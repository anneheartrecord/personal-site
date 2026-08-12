import { getCollection } from "astro:content";

/** Normalized shape every discovery endpoint (sitemap, llms.txt, llms-full.txt, site-index.json) reads, regardless of source collection. */
export interface ContentEntry {
  id: string;
  collection: "blog" | "aiNews";
  url: string;
  title: string;
  description: string;
  date: Date;
  tags: string[];
  sourceCount?: number;
}

/** Fetch every non-draft blog post, normalized to the shared content entry shape. */
const getBlogEntries = async (): Promise<ContentEntry[]> => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({
    id: post.id,
    collection: "blog" as const,
    url: `/blog/${post.id}`,
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    tags: post.data.tags,
  }));
};

/** Fetch every non-draft AI News issue, normalized to the shared content entry shape. */
const getAiNewsEntries = async (): Promise<ContentEntry[]> => {
  const issues = await getCollection("aiNews", ({ data }) => !data.draft);
  return issues.map((issue) => ({
    id: issue.id,
    collection: "aiNews" as const,
    url: `/ai-news/${issue.id}`,
    title: issue.data.title,
    description: issue.data.description,
    date: issue.data.date,
    tags: issue.data.tags,
    sourceCount: issue.data.sourceCount,
  }));
};

/** Every publishable (non-draft) entry across every content collection — the single list every discovery endpoint reads instead of maintaining its own. */
export async function getPublishableEntries(): Promise<ContentEntry[]> {
  const [blogEntries, aiNewsEntries] = await Promise.all([getBlogEntries(), getAiNewsEntries()]);
  return [...blogEntries, ...aiNewsEntries];
}
