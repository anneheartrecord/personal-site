import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const SEARCH_CONTENT_LIMIT = 5200;

/**
 * Converts markdown body text into compact plain text for client-side search.
 *
 * @param markdown - Raw markdown body from an Astro content entry.
 * @returns Plain text with markdown syntax and excess whitespace removed.
 */
function toSearchText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/^[>-]\s+/gm, " ")
    .replace(/[*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Keeps each indexed article small enough for a fast static search payload.
 *
 * @param value - Plain text article content.
 * @returns The original text or a truncated version with an ellipsis.
 */
function limitSearchText(value: string): string {
  if (value.length <= SEARCH_CONTENT_LIMIT) {
    return value;
  }

  return `${value.slice(0, SEARCH_CONTENT_LIMIT).trimEnd()}...`;
}

/**
 * Formats a post date as a stable day string for search result rendering.
 *
 * @param date - Published date from frontmatter.
 * @returns ISO calendar date in YYYY-MM-DD format.
 */
function formatPostDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const sortedPosts = posts.sort(
    (leftPost, rightPost) => rightPost.data.date.valueOf() - leftPost.data.date.valueOf(),
  );

  const payload = {
    posts: sortedPosts.map((post) => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      date: formatPostDate(post.data.date),
      tags: post.data.tags,
      url: `/blog/${post.id}`,
      content: limitSearchText(toSearchText(post.body ?? "")),
    })),
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
