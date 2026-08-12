#!/usr/bin/env node

/**
 * Notify IndexNow-participating search engines (Bing, Yandex, Naver, Seznam, Yep — not Google,
 * which does not participate) that content changed. Hand-rolled per indexnow.org/documentation
 * instead of pulling in a dependency, since the whole integration is a single HTTPS POST.
 *
 * The IndexNow key is read from process.env.INDEXNOW_KEY (see CI wiring in
 * .github/workflows/ai-news-notify.yml). It is intentionally NOT hardcoded here: the key itself
 * is not secret (IndexNow requires it to be hosted, in the clear, at "/<key>.txt"), but keeping it
 * out of the script means rotating it is a config change, not a code change.
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs <url> [url ...] [--dry-run]
 *   node scripts/submit-indexnow.mjs --changed [--dry-run]   # URLs from content changed in this git commit
 *   node scripts/submit-indexnow.mjs --all [--dry-run]       # every publishable blog + AI News URL
 *
 * URLs may also be passed as a single comma-separated argument.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_SITE_URL = "https://www.charles-cheng.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_BATCH = 10000;

const CONTENT_DIRS = [
  { dir: join(process.cwd(), "src", "content", "blog"), urlPrefix: "/blog" },
  { dir: join(process.cwd(), "src", "content", "ai-news"), urlPrefix: "/ai-news" },
];

/** Parse a minimal Markdown frontmatter block without adding YAML dependencies (mirrors notify-ai-news-publish.mjs). */
const parseFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    frontmatter[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return frontmatter;
};

/** Run a git command and return trimmed stdout, or "" on failure. */
const runGit = (args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

/** Build an absolute URL for a content Markdown file, or null if it should be skipped (template, draft). */
const buildUrlForContentFile = ({ dir, urlPrefix }, absolutePath, siteUrl) => {
  if (!existsSync(absolutePath) || absolutePath.endsWith("_template.md")) {
    return null;
  }

  const content = readFileSync(absolutePath, "utf8");
  const frontmatter = parseFrontmatter(content);
  if (frontmatter.draft === "true") {
    return null;
  }

  const slug = absolutePath
    .slice(dir.length + 1)
    .replace(/\.md$/, "")
    .split("/")
    .join("/");
  return new URL(`${urlPrefix}/${slug}`, siteUrl).toString();
};

/** Every publishable (non-draft, non-template) blog + AI News URL, read directly from src/content/**.
 * Deliberately does not import astro:content / src/lib/content-index.ts: no script in this repo
 * runs under Astro's content-collection loader (see notify-ai-news-publish.mjs, which reads and
 * parses the same Markdown frontmatter by hand for the same reason) — this keeps the same pattern.
 */
const getAllPublishableUrls = (siteUrl) => {
  const urls = [];
  for (const target of CONTENT_DIRS) {
    if (!existsSync(target.dir)) {
      continue;
    }

    for (const fileName of readdirSync(target.dir)) {
      if (!fileName.endsWith(".md")) {
        continue;
      }

      const url = buildUrlForContentFile(target, join(target.dir, fileName), siteUrl);
      if (url) {
        urls.push(url);
      }
    }
  }

  return urls;
};

/** URLs for content Markdown files changed in the current commit (mirrors notify-ai-news-publish.mjs's diff-tree approach, generalized to blog + AI News). */
const getChangedUrls = (siteUrl) => {
  const commitSha = process.env.GITHUB_SHA || "HEAD";
  const diffOutput = runGit([
    "diff-tree",
    "--root",
    "--no-commit-id",
    "--name-status",
    "-r",
    commitSha,
  ]);

  const changedPaths = diffOutput
    .split("\n")
    .map((line) => line.trim().split(/\s+/).slice(1).join(" "))
    .filter((filePath) => /^src\/content\/(blog|ai-news)\/.+\.md$/.test(filePath));

  const urls = [];
  for (const filePath of changedPaths) {
    const target = CONTENT_DIRS.find((candidate) => filePath.startsWith(`${candidate.dir.replace(`${process.cwd()}/`, "")}/`));
    if (!target) {
      continue;
    }

    const url = buildUrlForContentFile(target, join(process.cwd(), filePath), siteUrl);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
};

/** Split a URL list into chunks of at most MAX_URLS_PER_BATCH, per IndexNow's documented bulk-submission cap. */
const batchUrls = (urls) => {
  const batches = [];
  for (let index = 0; index < urls.length; index += MAX_URLS_PER_BATCH) {
    batches.push(urls.slice(index, index + MAX_URLS_PER_BATCH));
  }

  return batches;
};

/** Build one IndexNow bulk-submission payload for a batch of URLs. */
const buildPayload = (urlList, { host, key, keyLocation }) => ({
  host,
  key,
  keyLocation,
  urlList,
});

/** Log a human-readable outcome for one submitted batch's response, per indexnow.org/documentation status codes. */
const describeStatus = (status) => {
  switch (status) {
    case 200:
    case 202:
      return { ok: true, message: "accepted" };
    case 400:
      return { ok: false, message: "bad request — invalid format" };
    case 403:
      return { ok: false, message: "forbidden — key not valid (not found, wrong format, or does not match the key file at keyLocation)" };
    case 422:
      return { ok: false, message: "unprocessable — URL does not belong to the host, or key does not belong to the host" };
    case 429:
      return { ok: false, message: "too many requests — rate limited" };
    default:
      return { ok: false, message: `unexpected status ${status}` };
  }
};

/** POST one batch to the IndexNow endpoint. Never throws and never signals failure to the caller:
 * a submission failure must not fail the content-publishing workflow that triggered it. */
const submitBatch = async (payload) => {
  let response;
  try {
    response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log(`IndexNow submission failed (network error): ${error.message}. Continuing.`);
    return;
  }

  const { ok, message } = describeStatus(response.status);
  const logLine = `IndexNow: ${response.status} (${message}) for ${payload.urlList.length} URL(s).`;
  if (ok) {
    console.log(logLine);
  } else {
    console.log(`${logLine} Not fatal — content publishing continues regardless.`);
  }
};

/** Parse CLI flags and positional URL arguments. */
const parseArgs = (argv) => {
  const dryRun = argv.includes("--dry-run");
  const all = argv.includes("--all");
  const changed = argv.includes("--changed");
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const urls = positional.flatMap((arg) => arg.split(",")).map((url) => url.trim()).filter(Boolean);

  return { dryRun, all, changed, urls };
};

const main = async () => {
  const { dryRun, all, changed, urls: explicitUrls } = parseArgs(process.argv.slice(2));
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;

  let urls = explicitUrls;
  if (all) {
    urls = getAllPublishableUrls(siteUrl);
  } else if (changed) {
    urls = getChangedUrls(siteUrl);
  }

  if (urls.length === 0) {
    console.log("submit-indexnow: no URLs to submit. Exiting.");
    process.exit(0);
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key && !dryRun) {
    console.log("submit-indexnow: INDEXNOW_KEY is not configured. Skipping IndexNow submission.");
    process.exit(0);
  }

  const host = new URL(siteUrl).host;
  const keyLocation = new URL(`/${key || "<INDEXNOW_KEY>"}.txt`, siteUrl).toString();
  const batches = batchUrls(urls);

  console.log(
    `submit-indexnow: ${urls.length} URL(s) in ${batches.length} batch(es) → host=${host}, keyLocation=${keyLocation}`,
  );

  for (const batch of batches) {
    const payload = buildPayload(batch, { host, key: key || "<INDEXNOW_KEY>", keyLocation });
    if (dryRun) {
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }

    await submitBatch(payload);
  }

  process.exit(0);
};

await main();
