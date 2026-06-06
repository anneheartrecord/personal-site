import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const aiNews = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/ai-news" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default(["AI News"]),
    draft: z.boolean().default(false),
    issue: z.number().int().positive().optional(),
    sourceCount: z.number().int().nonnegative().default(0),
  }),
});

export const collections = { blog, aiNews };
