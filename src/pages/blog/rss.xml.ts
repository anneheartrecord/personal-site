import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { getPublishableEntries } from "../../lib/content-index";
import { site as siteData } from "../../data/site";

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const entries = await getPublishableEntries();
  const posts = entries
    .filter((entry) => entry.collection === "blog")
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return rss({
    title: "Blog — Charles Cheng",
    description:
      "Essays by Charles Cheng on AI agents, Claude Code, Kubernetes, cloud-native infrastructure, investing, career growth, writing, and engineering practice.",
    site: baseUrl,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.date,
      link: post.url,
      categories: post.tags,
    })),
  });
};
