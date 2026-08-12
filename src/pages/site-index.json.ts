import type { APIRoute } from "astro";
import { getPublishableEntries } from "../lib/content-index";
import { projects } from "../data/projects";
import { socials } from "../data/socials";
import { site as siteData } from "../data/site";

/** Convert a route path into an absolute URL using Astro's configured site. */
const toAbsoluteUrl = (path: string, baseUrl: URL) => new URL(path, baseUrl).toString();

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const entries = await getPublishableEntries();
  const sortedPosts = entries
    .filter((entry) => entry.collection === "blog")
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
  const sortedAiNewsIssues = entries
    .filter((entry) => entry.collection === "aiNews")
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
  // Any collection added to content-index.ts beyond blog/aiNews lands here automatically, grouped by
  // collection name, so a new collection is never silently missing while it awaits its own named key.
  const otherEntriesByCollection = entries
    .filter((entry) => entry.collection !== "blog" && entry.collection !== "aiNews")
    .reduce<Record<string, typeof entries>>((groups, entry) => {
      (groups[entry.collection] ??= []).push(entry);
      return groups;
    }, {});
  const payload = {
    site: {
      name: siteData.name,
      url: siteData.url,
      description: siteData.description,
      author: siteData.author,
      topics: siteData.topics,
      keywords: siteData.keywords,
    },
    pages: [
      { title: "Home", url: toAbsoluteUrl("/", baseUrl), description: "Profile, work summary, projects, blog highlights, travel and Nuomi galleries." },
      { title: "Blog", url: toAbsoluteUrl("/blog", baseUrl), description: "Writing grouped by AI, investing, career, engineering, and thinking." },
      { title: "AI News", url: toAbsoluteUrl("/ai-news", baseUrl), description: "Daily AI news with original links, short context, and builder-focused judgment." },
      { title: "Projects", url: toAbsoluteUrl("/projects", baseUrl), description: "Open source projects and AI tooling work." },
      { title: "AMA", url: toAbsoluteUrl("/ama", baseUrl), description: "Career consulting and resume/interview advisory." },
      { title: "Social Media", url: toAbsoluteUrl("/social", baseUrl), description: "Public social profiles and contact methods." },
      { title: "Friends", url: toAbsoluteUrl("/friends", baseUrl), description: "Internet friends and recommended people." },
    ],
    socials,
    projects,
    posts: sortedPosts.map((post) => ({
      title: post.title,
      url: toAbsoluteUrl(post.url, baseUrl),
      description: post.description,
      date: post.date.toISOString().split("T")[0],
      tags: post.tags,
    })),
    aiNews: sortedAiNewsIssues.map((issue) => ({
      title: issue.title,
      url: toAbsoluteUrl(issue.url, baseUrl),
      description: issue.description,
      date: issue.date.toISOString().split("T")[0],
      tags: issue.tags,
      sourceCount: issue.sourceCount,
    })),
    ...(Object.keys(otherEntriesByCollection).length > 0
      ? {
          otherCollections: Object.fromEntries(
            Object.entries(otherEntriesByCollection).map(([collection, collectionEntries]) => [
              collection,
              collectionEntries.map((entry) => ({
                title: entry.title,
                url: toAbsoluteUrl(entry.url, baseUrl),
                description: entry.description,
                date: entry.date.toISOString().split("T")[0],
                tags: entry.tags,
              })),
            ]),
          ),
        }
      : {}),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
