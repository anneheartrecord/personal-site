import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { getPublishableEntries } from "../../lib/content-index";
import { site as siteData } from "../../data/site";

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const entries = await getPublishableEntries();
  const issues = entries
    .filter((entry) => entry.collection === "aiNews")
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return rss({
    title: "AI News — Charles Cheng",
    description: "Daily AI signal for builders, with source links, short analysis, and weekly long-form reflections on AI.",
    site: baseUrl,
    trailingSlash: false,
    items: issues.map((issue) => ({
      title: issue.title,
      description: issue.description,
      pubDate: issue.date,
      link: issue.url,
      categories: issue.tags,
    })),
  });
};
