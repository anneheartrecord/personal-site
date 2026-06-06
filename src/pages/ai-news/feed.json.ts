import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { site as siteData } from "../../data/site";

/** Convert a route path into an absolute URL using Astro's configured site. */
const toAbsoluteUrl = (path: string, baseUrl: URL) => new URL(path, baseUrl).toString();

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const issues = await getCollection("aiNews", ({ data }) => !data.draft);
  const sortedIssues = issues.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const payload = {
    title: "Charles Cheng AI News",
    description: "Daily AI signal for builders, with original links and short analysis.",
    url: toAbsoluteUrl("/ai-news", baseUrl),
    generatedAt: new Date().toISOString(),
    issues: sortedIssues.map((issue) => ({
      id: issue.id,
      title: issue.data.title,
      description: issue.data.description,
      date: issue.data.date.toISOString().split("T")[0],
      tags: issue.data.tags,
      sourceCount: issue.data.sourceCount,
      url: toAbsoluteUrl(`/ai-news/${issue.id}`, baseUrl),
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
