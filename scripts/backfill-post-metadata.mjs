#!/usr/bin/env node

/**
 * Detect (and, narrowly, fix) junk historical blog metadata that propagates into every
 * downstream surface that reads frontmatter: og:description, llms-full.txt, site-index.json,
 * and the rendered page itself. See plan Unit U8 / requirements R21-R24.
 *
 * Three cohorts are detected across every file in src/content/blog/:
 *   - Cohort A (previous-blog residue): a description that is leftover boilerplate from
 *     this domain's previous, unrelated blog rather than a summary of the post itself.
 *     Reading a sample of this repo's descriptions is what surfaces the actual residue
 *     string (see PRIOR_BLOG_SIGNATURE below) — it is not asserted a priori.
 *   - Cohort B (Markdown/code-artifact descriptions): a description field that is not
 *     natural prose at all, but a raw fragment of the post body — a Markdown heading, a
 *     shebang line, an inline-code token, a bare list marker, an unrendered shell command,
 *     or a bold-wrapped pseudo-heading. A softer "embedded unrendered link" signal is
 *     reported separately, since those descriptions ARE prose that happens to carry a raw
 *     `[text](<url>)` fragment inline — a real defect, but a different shape than "the
 *     whole field is an artifact".
 *   - Cohort C (leading-H1 duplicate): a post body whose first non-empty line is a Markdown
 *     H1 that duplicates the frontmatter title, which is also rendered as the page's <h1>
 *     by the layout — i.e. the title renders twice.
 *
 * Also reported (detection only, never acted on): R23 groups of posts sharing an identical
 * description, and the specific CLA-duplicate pair the plan calls out by title.
 *
 * Frontmatter is parsed by hand (splitting on the --- delimiters) — this repo has no YAML
 * dependency and it is not worth adding one for a one-off backfill script. The line-based
 * key/value split mirrors the pattern already used in scripts/submit-indexnow.mjs.
 *
 * Usage:
 *   node scripts/backfill-post-metadata.mjs --dry-run   # report only; touches nothing
 *   node scripts/backfill-post-metadata.mjs --apply      # see "Apply semantics" below
 *
 * Apply semantics (intentionally narrow):
 *   - Cohort C is the only cohort this script ever rewrites unattended: removing a leading
 *     H1 line that duplicates the title is a mechanical, lossless fix that needs no
 *     authoring judgment.
 *   - Cohort A/B descriptions are junk, but replacing them is authoring, not generation —
 *     a human has to write the real sentence from each post's actual opening argument.
 *     --apply only ever writes a new description for a flagged file if it finds one in
 *     REPLACEMENTS_FILE (a flat {"<filename>": "<new description>"} JSON map that a human
 *     maintains). A flagged file with no entry there is left untouched and reported as
 *     still pending — this script never invents description text itself.
 *   - The CLA-duplicate pair (R23) and any Vercel redirect are entirely out of scope here:
 *     deleting a post and wiring a redirect is a repo-level decision, not a metadata
 *     rewrite. Both modes only ever report on it; --apply never touches those two files.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BLOG_DIR = join(process.cwd(), "src", "content", "blog");
const REPLACEMENTS_FILE = join(process.cwd(), "scripts", "backfill-post-metadata.replacements.json");

// The exact leftover-signature text this domain's previous (unrelated) blog left behind in
// five posts' description fields, found by reading a sample of this repo's frontmatter.
const PRIOR_BLOG_SIGNATURE_PATTERN = /cbb777\.fun/;

const CJK_PATTERN = /[一-鿿]/;
const TRAILING_PUNCT_CHARS = " \t\r\n.,;:!?，。；：！？、\"'“”‘’（）()【】[]";
const LOOSE_STRIP_PATTERN = /[\s.,;:!?，。；：！？、"'“”‘’（）()【】[\]_|-]/g;

/** Parse a minimal Markdown frontmatter block without adding a YAML dependency (mirrors submit-indexnow.mjs). */
const parseFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: content };
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

  return { frontmatter, body: content.slice(match[0].length), frontmatterBlock: match[0] };
};

/** Strip any of `chars` from both ends of `value` (JS's String#trim only strips whitespace). */
const stripChars = (value, chars) => {
  const set = new Set(chars);
  let start = 0;
  let end = value.length;
  while (start < end && set.has(value[start])) {
    start += 1;
  }
  while (end > start && set.has(value[end - 1])) {
    end -= 1;
  }
  return value.slice(start, end);
};

/** Cohort C normalization: trim, case-fold, strip trailing punctuation only (stated explicitly per the plan). */
const normalizeForCompare = (value) => stripChars(value.trim().toLowerCase(), TRAILING_PUNCT_CHARS);

/** A looser normalization (all whitespace/punctuation/underscores/pipes removed) used only to flag borderline near-duplicates that the strict rule above misses. */
const normalizeLoose = (value) => value.toLowerCase().replace(LOOSE_STRIP_PATTERN, "");

/** The first non-empty line of a post body, or null if the body is empty. */
const firstNonEmptyLine = (body) => {
  for (const line of body.split("\n")) {
    if (line.trim().length > 0) {
      return line.trim();
    }
  }
  return null;
};

/** Cohort A: description is leftover boilerplate from this domain's previous, unrelated blog. */
const detectPriorBlogResidue = (description) => PRIOR_BLOG_SIGNATURE_PATTERN.test(description);

/**
 * Cohort B: description is a raw Markdown/code artifact rather than natural prose.
 * Returns { matched, pattern } for the strict (whole-field-is-an-artifact) checks, plus a
 * separate softer "embedded unrendered link" signal reported independently.
 */
const detectMarkdownArtifact = (description) => {
  const trimmed = description.trim();
  const hasCjk = CJK_PATTERN.test(trimmed);

  if (/^#{1,6}\s/.test(trimmed)) {
    return { matched: true, pattern: "heading" };
  }
  if (trimmed.startsWith("#!")) {
    return { matched: true, pattern: "shebang" };
  }
  if (/^`[^`]+`$/.test(trimmed)) {
    return { matched: true, pattern: "inline-code" };
  }
  if (/^([*-]|\d+\.)\s/.test(trimmed)) {
    return { matched: true, pattern: "list-marker" };
  }
  if (/^\[[^\]]*]\([^)]*\)\s*$/.test(trimmed)) {
    return { matched: true, pattern: "markdown-link" };
  }
  if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.split("**").length === 3) {
    return { matched: true, pattern: "bold-wrapped-heading" };
  }
  if (
    !hasCjk &&
    /^(curl|git|npm|python\d?|pip3?|go|bash|sh|echo|ls|cd|docker|kubectl)\b/.test(trimmed) &&
    (trimmed.startsWith("#!") || /(^|\s)(-{1,2}[A-Za-z]|https?:\/\/|\.sh\b|\.py\b)/.test(trimmed))
  ) {
    return { matched: true, pattern: "shell-command" };
  }

  return { matched: false, pattern: null };
};

/** Softer Cohort B signal: the description is otherwise natural prose but carries a raw, unrendered Markdown link inline. */
const detectEmbeddedMarkdownLink = (description) => {
  const trimmed = description.trim();
  const isFullLinkOnly = /^\[[^\]]*]\([^)]*\)\s*$/.test(trimmed);
  return !isFullLinkOnly && /]\(/.test(trimmed);
};

/** Cohort C: does the body's first non-empty line duplicate the frontmatter title as a leading H1? */
const detectLeadingH1Duplicate = (title, body) => {
  const line = firstNonEmptyLine(body);
  if (!line) {
    return { isH1: false };
  }

  const headingMatch = line.match(/^#\s+(.*)$/);
  if (!headingMatch) {
    return { isH1: false };
  }

  const h1Text = headingMatch[1].trim();
  const exactNormMatch = normalizeForCompare(h1Text) === normalizeForCompare(title);
  const looseMatch = normalizeLoose(h1Text) === normalizeLoose(title);

  return {
    isH1: true,
    h1Text,
    exactNormMatch,
    borderline: !exactNormMatch && looseMatch,
    unrelated: !exactNormMatch && !looseMatch,
  };
};

/** Normalize a title for cross-file duplicate-content grouping: strip a leading "NN." index, then loose-normalize. */
const normalizeTitleForGrouping = (title) => normalizeLoose(title.replace(/^\d+[.．]\s*/, ""));

/** Scan every .md file in src/content/blog/ and classify it into the three cohorts plus the cross-file checks. */
const scanBlogDirectory = () => {
  const files = readdirSync(BLOG_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  const posts = [];
  for (const fileName of files) {
    const filePath = join(BLOG_DIR, fileName);
    const content = readFileSync(filePath, "utf8");
    const { frontmatter, body, frontmatterBlock } = parseFrontmatter(content);

    posts.push({
      fileName,
      filePath,
      title: frontmatter.title ?? "",
      description: frontmatter.description ?? "",
      date: frontmatter.date ?? "",
      body,
      frontmatterBlock,
      content,
    });
  }

  return posts;
};

/** Build the full report object from a scanned post list. Pure function — no I/O, no mutation. */
const buildReport = (posts) => {
  const cohortA = [];
  const cohortB = [];
  const embeddedLinkBorderline = [];
  const cohortC = [];
  const cohortCBorderline = [];

  for (const post of posts) {
    if (detectPriorBlogResidue(post.description)) {
      cohortA.push({ fileName: post.fileName, description: post.description });
    }

    const artifact = detectMarkdownArtifact(post.description);
    if (artifact.matched) {
      cohortB.push({ fileName: post.fileName, description: post.description, pattern: artifact.pattern });
    } else if (detectEmbeddedMarkdownLink(post.description)) {
      embeddedLinkBorderline.push({ fileName: post.fileName, description: post.description });
    }

    const h1 = detectLeadingH1Duplicate(post.title, post.body);
    if (h1.isH1 && h1.exactNormMatch) {
      cohortC.push({ fileName: post.fileName, title: post.title, h1Text: h1.h1Text });
    } else if (h1.isH1 && h1.borderline) {
      cohortCBorderline.push({ fileName: post.fileName, title: post.title, h1Text: h1.h1Text });
    }
  }

  // R23: any group of posts sharing an identical description verbatim.
  const byDescription = new Map();
  for (const post of posts) {
    if (!post.description) continue;
    const group = byDescription.get(post.description) ?? [];
    group.push(post.fileName);
    byDescription.set(post.description, group);
  }
  const duplicateDescriptionGroups = [...byDescription.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([description, group]) => ({ description, files: group }));

  // Cross-file duplicate-content grouping by normalized title (generalizes the CLA pair
  // the plan names explicitly, in case the slug/title shifted since the plan was written).
  const byTitle = new Map();
  for (const post of posts) {
    const key = normalizeTitleForGrouping(post.title);
    if (!key) continue;
    const group = byTitle.get(key) ?? [];
    group.push(post);
    byTitle.set(key, group);
  }
  const duplicateTitleGroups = [...byTitle.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));
      return {
        files: sorted.map((p) => ({ fileName: p.fileName, date: p.date })),
        earlier: { fileName: sorted[0].fileName, date: sorted[0].date },
        later: { fileName: sorted[sorted.length - 1].fileName, date: sorted[sorted.length - 1].date },
      };
    });

  return {
    totalPosts: posts.length,
    cohortA,
    cohortB,
    embeddedLinkBorderline,
    cohortC,
    cohortCBorderline,
    duplicateDescriptionGroups,
    duplicateTitleGroups,
  };
};

/** Print a human-readable version of buildReport()'s output to the console. */
const printReport = (report) => {
  console.log(`backfill-post-metadata: scanned ${report.totalPosts} file(s) in src/content/blog/\n`);

  console.log(`Cohort A — previous-blog residue descriptions: ${report.cohortA.length}`);
  for (const item of report.cohortA) {
    console.log(`  - ${item.fileName}`);
    console.log(`      description: ${JSON.stringify(item.description)}`);
  }
  console.log();

  console.log(`Cohort B — Markdown/code-artifact descriptions: ${report.cohortB.length}`);
  for (const item of report.cohortB) {
    console.log(`  - ${item.fileName}  [${item.pattern}]`);
    console.log(`      description: ${JSON.stringify(item.description)}`);
  }
  console.log();

  console.log(
    `Cohort B (borderline, NOT counted above) — prose descriptions with an embedded unrendered Markdown link: ${report.embeddedLinkBorderline.length}`,
  );
  for (const item of report.embeddedLinkBorderline) {
    console.log(`  - ${item.fileName}`);
    console.log(`      description: ${JSON.stringify(item.description)}`);
  }
  console.log();

  console.log(`Cohort C — leading H1 duplicates frontmatter title: ${report.cohortC.length}`);
  console.log("  normalization rule: trim, case-fold (lowercase), strip trailing punctuation/brackets/quotes from both sides, then compare for equality");
  console.log();

  console.log(`Cohort C (borderline, NOT counted above) — H1 text is close-but-not-exact to the title: ${report.cohortCBorderline.length}`);
  for (const item of report.cohortCBorderline) {
    console.log(`  - ${item.fileName}`);
    console.log(`      title: ${JSON.stringify(item.title)}`);
    console.log(`      h1:    ${JSON.stringify(item.h1Text)}`);
  }
  console.log();

  console.log(`R23 — posts sharing an identical description: ${report.duplicateDescriptionGroups.length} group(s)`);
  for (const group of report.duplicateDescriptionGroups) {
    console.log(`  - ${JSON.stringify(group.description)}`);
    for (const fileName of group.files) {
      console.log(`      · ${fileName}`);
    }
  }
  console.log();

  console.log(`Cross-file duplicate-title groups (generalizes the CLA-duplicate pair): ${report.duplicateTitleGroups.length} group(s)`);
  for (const group of report.duplicateTitleGroups) {
    console.log(`  - earlier (would be removed): ${group.earlier.fileName} (${group.earlier.date})`);
    console.log(`    later   (would be kept):    ${group.later.fileName} (${group.later.date})`);
  }
};

/** Remove a leading H1 line (and one following blank line, if any) from a post body. */
const stripLeadingH1 = (body) => {
  const lines = body.split("\n");
  let index = 0;
  while (index < lines.length && lines[index].trim().length === 0) {
    index += 1;
  }
  if (index >= lines.length || !/^#\s+/.test(lines[index].trim())) {
    return body;
  }

  index += 1;
  if (index < lines.length && lines[index].trim().length === 0) {
    index += 1;
  }

  return lines.slice(index).join("\n");
};

/** Escape a string for embedding in a double-quoted frontmatter value. */
const escapeForFrontmatter = (value) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/** Replace the `description: "..."` line inside a frontmatter block with a new value. */
const replaceDescriptionInFrontmatter = (frontmatterBlock, newDescription) =>
  frontmatterBlock.replace(/^description:.*$/m, `description: "${escapeForFrontmatter(newDescription)}"`);

/**
 * Apply mode:
 *   - Cohort C: mechanically strip the duplicate leading H1 from the body.
 *   - Cohort A/B: only write a new description if REPLACEMENTS_FILE supplies human-authored
 *     text for that exact file; otherwise skip and report it as still pending.
 *   - Never touches the CLA-duplicate pair or any redirect.
 */
const applyFixes = (posts, report) => {
  let replacements = {};
  if (existsSync(REPLACEMENTS_FILE)) {
    replacements = JSON.parse(readFileSync(REPLACEMENTS_FILE, "utf8"));
  } else {
    console.log(
      `backfill-post-metadata: ${REPLACEMENTS_FILE} not found — Cohort A/B descriptions will be reported as pending, not rewritten.\n`,
    );
  }

  const postsByFileName = new Map(posts.map((post) => [post.fileName, post]));
  const pendingDescriptionRewrites = [];
  let h1StrippedCount = 0;
  let descriptionRewrittenCount = 0;

  const flaggedDescriptionFiles = new Set([
    ...report.cohortA.map((item) => item.fileName),
    ...report.cohortB.map((item) => item.fileName),
  ]);

  for (const fileName of flaggedDescriptionFiles) {
    const post = postsByFileName.get(fileName);
    const newDescription = replacements[fileName];
    if (!newDescription) {
      pendingDescriptionRewrites.push(fileName);
      continue;
    }

    const newFrontmatterBlock = replaceDescriptionInFrontmatter(post.frontmatterBlock, newDescription);
    const newContent = newFrontmatterBlock + post.body;
    writeFileSync(post.filePath, newContent, "utf8");
    descriptionRewrittenCount += 1;
    console.log(`  rewrote description: ${fileName}`);
  }

  for (const item of report.cohortC) {
    const post = postsByFileName.get(item.fileName);
    const newBody = stripLeadingH1(post.body);
    if (newBody === post.body) continue;
    const newContent = post.frontmatterBlock + newBody;
    writeFileSync(post.filePath, newContent, "utf8");
    h1StrippedCount += 1;
    console.log(`  stripped duplicate leading H1: ${item.fileName}`);
  }

  console.log(`\nbackfill-post-metadata --apply summary:`);
  console.log(`  descriptions rewritten: ${descriptionRewrittenCount}`);
  console.log(`  descriptions still pending a human-authored replacement: ${pendingDescriptionRewrites.length}`);
  for (const fileName of pendingDescriptionRewrites) {
    console.log(`    - ${fileName}`);
  }
  console.log(`  leading H1 duplicates stripped: ${h1StrippedCount}`);
  console.log(
    `  CLA-duplicate pair and any redirect: NOT touched by this script (repo-level decision — see report above)`,
  );
};

const main = () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");

  if (!dryRun && !apply) {
    console.log("Usage: node scripts/backfill-post-metadata.mjs --dry-run | --apply");
    process.exit(1);
  }
  if (dryRun && apply) {
    console.log("Pass only one of --dry-run or --apply, not both.");
    process.exit(1);
  }

  const posts = scanBlogDirectory();
  const report = buildReport(posts);

  printReport(report);

  if (apply) {
    console.log("\n--- applying fixes ---\n");
    applyFixes(posts, report);
  }
};

main();
