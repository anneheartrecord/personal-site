import type { APIRoute } from "astro";
import { getPublishableEntries } from "../lib/content-index";
import { projects } from "../data/projects";
import { site as siteData } from "../data/site";

/** Format a markdown link with compact metadata for LLM crawlers. */
const formatLink = (title: string, url: string, description: string, metadata: string) => {
  return `- [${title}](${url}) — ${metadata}. ${description}`;
};

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const entries = await getPublishableEntries();
  const sortedPosts = entries
    .filter((entry) => entry.collection === "blog")
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
  const sortedAiNewsIssues = entries
    .filter((entry) => entry.collection === "aiNews")
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
  // Any collection added to content-index.ts beyond blog/aiNews lands here automatically, so a new
  // collection is never silently missing from this index while it awaits its own dedicated section.
  const otherEntries = entries
    .filter((entry) => entry.collection !== "blog" && entry.collection !== "aiNews")
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

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
          issue.title,
          new URL(issue.url, baseUrl).toString(),
          issue.description,
          `date: ${issue.date.toISOString().split("T")[0]}; sources: ${issue.sourceCount}; tags: ${issue.tags.join(", ")}`,
        ),
      ),
      "",
      "## Published Blog Posts",
      "",
      ...sortedPosts.map((post) =>
        formatLink(
          post.title,
          new URL(post.url, baseUrl).toString(),
          post.description,
          `date: ${post.date.toISOString().split("T")[0]}; tags: ${post.tags.join(", ")}`,
        ),
      ),
      ...(otherEntries.length > 0
        ? [
            "",
            "## Other Content",
            "",
            ...otherEntries.map((entry) =>
              formatLink(
                entry.title,
                new URL(entry.url, baseUrl).toString(),
                entry.description,
                `date: ${entry.date.toISOString().split("T")[0]}; tags: ${entry.tags.join(", ")}`,
              ),
            ),
          ]
        : []),
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
