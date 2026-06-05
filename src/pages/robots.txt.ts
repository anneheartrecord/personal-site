import type { APIRoute } from "astro";

/** Build robots.txt from the configured production site URL. */
export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL("https://charles-cheng.com");
  const sitemapUrl = new URL("/sitemap.xml", baseUrl);
  const llmsUrl = new URL("/llms.txt", baseUrl);

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${sitemapUrl.toString()}`,
      `LLMs: ${llmsUrl.toString()}`,
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
