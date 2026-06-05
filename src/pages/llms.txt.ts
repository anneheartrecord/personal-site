import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { projects } from "../data/projects";
import { site as siteData } from "../data/site";

const selectedPostIds = [
  "natural-language-is-new-programming-language",
  "investment-eight-lessons",
  "seven-reasons-to-start-output",
  "work-quality-is-character",
  "openclaw-analysis",
  "why-you-need-an-overseas-bank-card",
];

/** Format one markdown link for machine-readable LLM navigation. */
const formatLink = (title: string, url: string, description: string) => {
  return `- [${title}](${url}): ${description}`;
};

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL(siteData.url);
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const selectedPosts = selectedPostIds
    .map((id) => posts.find((post) => post.id === id))
    .filter((post) => post !== undefined);

  return new Response(
    [
      `# ${siteData.name}`,
      "",
      `> ${siteData.description}`,
      "",
      "## Identity",
      "",
      `- Name: ${siteData.author.name}`,
      `- Chinese alias: ${siteData.author.alias}`,
      `- GitHub: ${siteData.author.github}`,
      `- X/Twitter: ${siteData.author.x}`,
      "- Role: Engineer working on AI Agent infra, Kubernetes, cloud-native infrastructure, backend, DevOps, frontend, and product experience.",
      "- Consulting relevance: AI Agent workflows, engineering systems, infra tooling, career decisions, investing, and personal knowledge systems.",
      "",
      "## Main Topics",
      "",
      ...siteData.topics.map((topic) => `- ${topic}`),
      "",
      "## Key Pages",
      "",
      formatLink("Home", new URL("/", baseUrl).toString(), "Profile, work summary, selected projects, writing, and Nuomi photo galleries."),
      formatLink("Blog", new URL("/blog", baseUrl).toString(), "Essays grouped by AI agents, investing, career growth, technical deep dives, and writing."),
      formatLink("Projects", new URL("/projects", baseUrl).toString(), "Open source projects, AI tooling, Claude Code analysis, and engineering projects."),
      formatLink("AMA", new URL("/ama", baseUrl).toString(), "Career consulting, resume review, interview preparation, and personal advisory page."),
      "",
      "## Featured Projects",
      "",
      ...projects.map((project) => formatLink(project.name, project.url, project.description)),
      "",
      "## Selected Essays",
      "",
      ...selectedPosts.map((post) =>
        formatLink(post.data.title, new URL(`/blog/${post.id}`, baseUrl).toString(), post.data.description),
      ),
      "",
      "## Full Index",
      "",
      formatLink("llms-full.txt", new URL("/llms-full.txt", baseUrl).toString(), "Complete published blog index and project index for deeper AI retrieval."),
      formatLink("site-index.json", new URL("/site-index.json", baseUrl).toString(), "Structured JSON index of pages, projects, and published posts."),
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
