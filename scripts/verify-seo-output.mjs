#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

const DIST_DIR = join(process.cwd(), "dist");
const CANONICAL_ORIGIN = "https://www.charles-cheng.com";
const APEX_ORIGIN = "https://charles-cheng.com";
const SCAN_EXTENSIONS = new Set([".html", ".xml", ".txt", ".json"]);

/** Convert an absolute path to a forward-slash path relative to the repo root, for readable output.
 * @param {string} absolutePath - Absolute file path.
 * @returns {string} Relative, forward-slash-normalized path.
 */
const toDisplayPath = (absolutePath) => relative(process.cwd(), absolutePath).split(sep).join("/");

/** Recursively collect files under a directory whose extension is in the given set.
 * @param {string} rootDir - Directory to walk.
 * @param {Set<string>} extensions - Lowercase extensions to include, for example ".html".
 * @returns {Array<string>} Absolute file paths, in traversal order.
 */
const collectFiles = (rootDir, extensions) => {
  if (!existsSync(rootDir)) {
    return [];
  }

  const results = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const currentDir = stack.pop();
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (extensions.has(extname(entry.name).toLowerCase())) {
        results.push(entryPath);
      }
    }
  }

  return results;
};

/** Check that no scanned file leaks the apex (non-www) host. The site must only ever emit the www host.
 * @param {Array<string>} scannedFiles - Absolute file paths to inspect.
 * @returns {Array<string>} One failure message per offending file, empty when clean.
 */
const checkNoApexHostLeak = (scannedFiles) => {
  const failures = [];
  for (const filePath of scannedFiles) {
    const content = readFileSync(filePath, "utf8");
    if (content.includes(APEX_ORIGIN)) {
      failures.push(
        `apex-host-leak: ${toDisplayPath(filePath)} contains "${APEX_ORIGIN}" — only "${CANONICAL_ORIGIN}" may appear in built output`,
      );
    }
  }

  return failures;
};

/** Check that dist/sitemap.xml exists, has at least one entry, and its first <loc> is the canonical homepage URL.
 * @returns {Array<string>} Failure messages, empty when the check passes.
 */
const checkSitemapFirstLoc = () => {
  const sitemapPath = join(DIST_DIR, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    return [`sitemap-missing: ${toDisplayPath(sitemapPath)} does not exist`];
  }

  const sitemapContent = readFileSync(sitemapPath, "utf8");
  const locValues = [...sitemapContent.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
  if (locValues.length === 0) {
    return [`sitemap-empty: ${toDisplayPath(sitemapPath)} has zero <url>/<loc> entries`];
  }

  const expectedFirstLoc = `${CANONICAL_ORIGIN}/`;
  if (locValues[0] !== expectedFirstLoc) {
    return [
      `sitemap-first-loc-mismatch: expected first <loc> to be "${expectedFirstLoc}" but found "${locValues[0]}"`,
    ];
  }

  return [];
};

/** Check that at least one built blog page carries a canonical link and an og:url meta tag on the www host.
 * @param {Array<string>} htmlFiles - Absolute paths of all scanned HTML files.
 * @returns {Array<string>} Failure messages, empty when both tags are found on at least one blog page.
 */
const checkBlogCanonicalAndOgUrl = (htmlFiles) => {
  const blogPages = htmlFiles.filter((filePath) => toDisplayPath(filePath).startsWith("dist/blog/"));
  if (blogPages.length === 0) {
    return ["blog-pages-missing: no built HTML pages found under dist/blog/ to spot-check"];
  }

  const canonicalPrefix = `<link rel="canonical" href="${CANONICAL_ORIGIN}`;
  const ogUrlPrefix = `content="${CANONICAL_ORIGIN}`;
  let hasCanonical = false;
  let hasOgUrl = false;
  for (const filePath of blogPages) {
    const content = readFileSync(filePath, "utf8");
    hasCanonical = hasCanonical || content.includes(canonicalPrefix);
    hasOgUrl =
      hasOgUrl || (content.includes('property="og:url"') && content.includes(ogUrlPrefix));
    if (hasCanonical && hasOgUrl) {
      break;
    }
  }

  const failures = [];
  if (!hasCanonical) {
    failures.push(
      `blog-canonical-missing: no page under dist/blog/ has a <link rel="canonical" href="${CANONICAL_ORIGIN}...">`,
    );
  }

  if (!hasOgUrl) {
    failures.push(
      `blog-og-url-missing: no page under dist/blog/ has an og:url meta tag pointing at "${CANONICAL_ORIGIN}"`,
    );
  }

  return failures;
};

/** Check that a built RSS feed exists, is well-formed enough to be a feed, and carries at least one item.
 * @param {string} relativeDistPath - Path to the feed file, relative to dist/ (for example "blog/rss.xml").
 * @returns {Array<string>} Failure messages, empty when the feed passes.
 */
const checkRssFeed = (relativeDistPath) => {
  const feedPath = join(DIST_DIR, relativeDistPath);
  if (!existsSync(feedPath)) {
    return [`rss-feed-missing: dist/${relativeDistPath} does not exist`];
  }

  const feedContent = readFileSync(feedPath, "utf8");
  const failures = [];
  if (!feedContent.includes("<rss") || !feedContent.includes("</rss>")) {
    failures.push(`rss-feed-malformed: dist/${relativeDistPath} has no <rss>...</rss> root element`);
  }

  if (!feedContent.includes("<item>")) {
    failures.push(`rss-feed-empty: dist/${relativeDistPath} has zero <item> entries`);
  }

  return failures;
};

/** Check that dist/robots.txt has no non-standard "LLMs:" directive and disallows none of the named crawlers.
 * @returns {Array<string>} Failure messages, empty when the check passes.
 */
const checkRobotsTxt = () => {
  const robotsPath = join(DIST_DIR, "robots.txt");
  if (!existsSync(robotsPath)) {
    return [`robots-missing: ${toDisplayPath(robotsPath)} does not exist`];
  }

  const robotsContent = readFileSync(robotsPath, "utf8");
  const failures = [];
  if (/^LLMs:/im.test(robotsContent)) {
    failures.push(`robots-non-standard-directive: dist/robots.txt still contains a non-standard "LLMs:" line`);
  }

  const namedCrawlers = ["Googlebot", "Bingbot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"];
  for (const crawler of namedCrawlers) {
    const groupMatch = robotsContent.match(new RegExp(`User-agent:\\s*${crawler}\\b([\\s\\S]*?)(?:\\n\\n|$)`, "i"));
    if (groupMatch && /Disallow:\s*\S/.test(groupMatch[1])) {
      failures.push(`robots-crawler-disallowed: dist/robots.txt has a Disallow rule under the ${crawler} group`);
    }
  }

  return failures;
};

/** Check that exactly one IndexNow key file is published at the dist root, with a body matching the key format.
 * @returns {Array<string>} Failure messages, empty when the check passes.
 */
const checkIndexNowKeyFile = () => {
  const knownRootTextFiles = new Set(["robots.txt", "llms.txt", "llms-full.txt"]);
  const rootTxtFiles = readdirSync(DIST_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt") && !knownRootTextFiles.has(entry.name));

  const keyFiles = rootTxtFiles.filter((entry) => /^[a-zA-Z0-9-]{8,128}\.txt$/.test(entry.name));
  if (keyFiles.length !== 1) {
    return [
      `indexnow-key-file-missing: expected exactly one IndexNow key file (<key>.txt, 8-128 chars of [a-zA-Z0-9-]) at the dist root, found ${keyFiles.length}`,
    ];
  }

  const [keyFile] = keyFiles;
  const expectedKey = keyFile.name.replace(/\.txt$/, "");
  const actualBody = readFileSync(join(DIST_DIR, keyFile.name), "utf8").trim();
  if (actualBody !== expectedKey) {
    return [
      `indexnow-key-file-mismatch: dist/${keyFile.name}'s body ("${actualBody}") does not match its own filename-derived key ("${expectedKey}")`,
    ];
  }

  return [];
};

/** Extract every JSON-LD payload (one array entry per `<script type="application/ld+json">` block) from an HTML file's raw content.
 * @param {string} htmlContent - Raw HTML file content.
 * @returns {Array<{raw: string, parsed: unknown}>} One entry per script block that parsed successfully.
 */
const extractJsonLdBlocks = (htmlContent) => {
  const blocks = [];
  for (const match of htmlContent.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      blocks.push({ raw: match[1], parsed: JSON.parse(match[1]) });
    } catch {
      blocks.push({ raw: match[1], parsed: undefined });
    }
  }

  return blocks;
};

/** Check that every JSON-LD script block on every built page parses as valid JSON, and that none emits a pruned type (R17).
 * @param {Array<string>} htmlFiles - Absolute paths of all scanned HTML files.
 * @returns {Array<string>} Failure messages, empty when every page passes.
 */
const checkJsonLdValidityAndPrunedTypes = (htmlFiles) => {
  const failures = [];
  const prunedTypes = new Set(["FAQPage", "HowTo"]);

  for (const filePath of htmlFiles) {
    const content = readFileSync(filePath, "utf8");
    for (const { parsed } of extractJsonLdBlocks(content)) {
      if (parsed === undefined) {
        failures.push(`json-ld-invalid: ${toDisplayPath(filePath)} has a <script type="application/ld+json"> block that is not valid JSON`);
        continue;
      }

      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (node && prunedTypes.has(node["@type"])) {
          failures.push(`json-ld-pruned-type-emitted: ${toDisplayPath(filePath)} emits "@type": "${node["@type"]}", which R17 requires the site to never emit`);
        }
      }
    }
  }

  return failures;
};

/** Check that no built BlogPosting/NewsArticle JSON-LD node reports a dateModified earlier than its datePublished.
 * @param {Array<string>} htmlFiles - Absolute paths of all scanned HTML files.
 * @returns {Array<string>} Failure messages, empty when every dated node passes.
 */
const checkDateModifiedNotBeforePublished = (htmlFiles) => {
  const failures = [];
  for (const filePath of htmlFiles) {
    const content = readFileSync(filePath, "utf8");
    for (const { parsed } of extractJsonLdBlocks(content)) {
      if (parsed === undefined) {
        continue;
      }

      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || !node.datePublished || !node.dateModified) {
          continue;
        }

        if (new Date(node.dateModified).getTime() < new Date(node.datePublished).getTime()) {
          failures.push(
            `date-modified-before-published: ${toDisplayPath(filePath)} has dateModified "${node.dateModified}" earlier than datePublished "${node.datePublished}"`,
          );
        }
      }
    }
  }

  return failures;
};

/** Run all post-build SEO assertions against dist/ and report every failure found.
 * @returns {Array<string>} All failure messages across every check.
 */
const runChecks = () => {
  const failures = [];
  const scannedFiles = collectFiles(DIST_DIR, SCAN_EXTENSIONS);
  if (scannedFiles.length === 0) {
    failures.push(`dist-missing: no scannable files found under ${toDisplayPath(DIST_DIR)} — run "npm run build" first`);
    return failures;
  }

  failures.push(...checkNoApexHostLeak(scannedFiles));
  failures.push(...checkSitemapFirstLoc());

  const htmlFiles = scannedFiles.filter((filePath) => extname(filePath).toLowerCase() === ".html");
  failures.push(...checkBlogCanonicalAndOgUrl(htmlFiles));

  failures.push(...checkRssFeed("blog/rss.xml"));
  failures.push(...checkRssFeed("ai-news/rss.xml"));
  failures.push(...checkRobotsTxt());
  failures.push(...checkIndexNowKeyFile());

  failures.push(...checkJsonLdValidityAndPrunedTypes(htmlFiles));
  failures.push(...checkDateModifiedNotBeforePublished(htmlFiles));

  return failures;
};

/** Main script entrypoint.
 * @returns {void}
 */
const main = () => {
  const failures = runChecks();
  if (failures.length > 0) {
    console.error(`seo:verify failed with ${failures.length} issue(s):\n`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    "seo:verify passed: no apex-host leaks, sitemap.xml is well-formed, blog canonical/og:url tags are correct, both RSS feeds are well-formed with items, robots.txt has no non-standard directives or named-crawler disallows, the IndexNow key file is present and correct, every page's JSON-LD is valid with no pruned types, and no dateModified precedes its datePublished.",
  );
};

main();
