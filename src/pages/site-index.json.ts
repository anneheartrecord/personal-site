import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { projects } from "../data/projects";
import { socials } from "../data/socials";
import { site as siteData } from "../data/site";

/** Convert a route path into an absolute URL using Astro's configured site. */
const toAbsoluteUrl = (path: string, baseUrl: URL) => new URL(path, baseUrl).toString();

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
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
      { title: "Projects", url: toAbsoluteUrl("/projects", baseUrl), description: "Open source projects and AI tooling work." },
      { title: "AMA", url: toAbsoluteUrl("/ama", baseUrl), description: "Career consulting and resume/interview advisory." },
      { title: "Social Media", url: toAbsoluteUrl("/social", baseUrl), description: "Public social profiles and contact methods." },
      { title: "Friends", url: toAbsoluteUrl("/friends", baseUrl), description: "Internet friends and recommended people." },
    ],
    socials,
    projects,
    posts: sortedPosts.map((post) => ({
      title: post.data.title,
      url: toAbsoluteUrl(`/blog/${post.id}`, baseUrl),
      description: post.data.description,
      date: post.data.date.toISOString().split("T")[0],
      tags: post.data.tags,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
