import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const staticPages = ["", "blog", "projects", "ama", "social", "friends"];

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

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL("https://charles-cheng.com");
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const urls = [
    ...staticPages.map((path) => ({
      url: new URL(`/${path}`, baseUrl).toString(),
      lastmod: undefined,
    })),
    ...posts.map((post) => ({
      url: new URL(`/blog/${post.id}`, baseUrl).toString(),
      lastmod: post.data.date,
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
