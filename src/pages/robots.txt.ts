import type { APIRoute } from "astro";

/**
 * Crawlers called out explicitly so intent is visible in the file, even though the blanket
 * `User-agent: * / Allow: /` group already permits all of them. None gets a `Disallow` — in
 * particular `Google-Extended` (Gemini/Bard training) is deliberately left unmentioned rather
 * than given its own group, since the blanket allow already covers it and adding a group for it
 * here would invite someone to later add a restrictive line under it.
 */
const NAMED_CRAWLERS = ["Googlebot", "Bingbot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"];

/** Build robots.txt from the configured production site URL. */
export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL("https://www.charles-cheng.com");
  const sitemapUrl = new URL("/sitemap.xml", baseUrl);

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      ...NAMED_CRAWLERS.flatMap((crawler) => [`User-agent: ${crawler}`, "Allow: /", ""]),
      `Sitemap: ${sitemapUrl.toString()}`,
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
