import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { projects } from "../data/projects";
import { site as siteData } from "../data/site";

/** Format a markdown link with compact metadata for LLM crawlers. */
const formatLink = (title: string, url: string, description: string, metadata: string) => {
  return `- [${title}](${url}) — ${metadata}. ${description}`;
};

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const aiNewsIssues = await getCollection("aiNews", ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const sortedAiNewsIssues = aiNewsIssues.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return new Response(
    [
      `# ${siteData.name} Full Content Index`,
      "",
      siteData.description,
      "",
      "## Author",
      "",
      `Charles Cheng, also known as ${siteData.author.alias}, is an engineer working on AI Agent infrastructure. His writing covers Kubernetes, cloud-native systems, Claude Code, OpenClaw, investing, career choices, decision making, and personal knowledge systems.`,
      "",
      "## Projects",
      "",
      ...projects.map((project) =>
        formatLink(project.name, project.url, project.description, `tags: ${project.tags.join(", ")}`),
      ),
      "",
      "## AI News Issues",
      "",
      ...sortedAiNewsIssues.map((issue) =>
        formatLink(
          issue.data.title,
          new URL(`/ai-news/${issue.id}`, baseUrl).toString(),
          issue.data.description,
          `date: ${issue.data.date.toISOString().split("T")[0]}; sources: ${issue.data.sourceCount}; tags: ${issue.data.tags.join(", ")}`,
        ),
      ),
      "",
      "## Published Blog Posts",
      "",
      ...sortedPosts.map((post) =>
        formatLink(
          post.data.title,
          new URL(`/blog/${post.id}`, baseUrl).toString(),
          post.data.description,
          `date: ${post.data.date.toISOString().split("T")[0]}; tags: ${post.data.tags.join(", ")}`,
        ),
      ),
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
