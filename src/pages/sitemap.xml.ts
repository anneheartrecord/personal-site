import type { APIRoute } from "astro";
import { execSync } from "node:child_process";
import { getPublishableEntries } from "../lib/content-index";
import { isShallowRepo } from "../lib/git-lastmod";

/** Static routes emitted in the sitemap, paired with the source file used to derive their last-modified date. */
const staticPages = [
  { path: "", file: "src/pages/index.astro" },
  { path: "blog", file: "src/pages/blog/index.astro" },
  { path: "ai-news", file: "src/pages/ai-news/index.astro" },
  { path: "projects", file: "src/pages/projects.astro" },
  { path: "ama", file: "src/pages/ama.astro" },
  { path: "social", file: "src/pages/social.astro" },
  { path: "friends", file: "src/pages/friends.astro" },
];

/** Escape XML entities in URL and date fields. */
const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

/** Render one sitemap URL entry with optional last modification date. */
const renderUrl = (url: string, lastmod?: Date) => {
  const lines = ["  <url>", `    <loc>${escapeXml(url)}</loc>`];

  if (lastmod) {
    lines.push(`    <lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>`);
  }

  lines.push("  </url>");
  return lines.join("\n");
};

/** Look up a static page's last-modified date from its git history, falling back to the current build time when git history is unavailable or unreliable (shallow clone, no git). */
const getStaticPageLastmod = (file: string): Date => {
  if (isShallowRepo()) {
    return new Date();
  }

  try {
    const output = execSync(`git log -1 --format=%aI -- "${file}"`, { encoding: "utf8" }).trim();
    if (output) {
      return new Date(output);
    }
  } catch {
    // Fall through to the build-time fallback below.
  }

  return new Date();
};

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL("https://www.charles-cheng.com");
  const entries = await getPublishableEntries();
  const urls = [
    ...staticPages.map(({ path, file }) => ({
      url: new URL(`/${path}`, baseUrl).toString(),
      lastmod: getStaticPageLastmod(file),
    })),
    ...entries.map((entry) => ({
      url: new URL(entry.url, baseUrl).toString(),
      lastmod: entry.date,
    })),
  ];

  return new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((entry) => renderUrl(entry.url, entry.lastmod)),
      "</urlset>",
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
};
