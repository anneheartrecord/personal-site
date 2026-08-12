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

  console.log("seo:verify passed: no apex-host leaks, sitemap.xml is well-formed, and blog canonical/og:url tags are correct.");
};

main();
