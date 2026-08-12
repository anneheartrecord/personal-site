import { execSync } from "node:child_process";

let isShallowRepoCache: boolean | undefined;

/**
 * Detect whether the current checkout is a shallow git clone (the default on CI and on Vercel
 * unless "Deep Clone" is enabled). Under a shallow clone, `git log -1 -- <file>` "succeeds" but
 * silently returns the same single available commit's date for every file, which would make every
 * file's derived date identical and wrong rather than absent. Shared by `src/pages/sitemap.xml.ts`
 * (static-page lastmod) and `getContentFileLastmod` below (content dateModified) so there is one
 * cached check per build, not one per caller.
 */
export const isShallowRepo = (): boolean => {
  if (isShallowRepoCache === undefined) {
    try {
      isShallowRepoCache = execSync("git rev-parse --is-shallow-repository", { encoding: "utf8" }).trim() === "true";
    } catch {
      isShallowRepoCache = true;
    }
  }

  return isShallowRepoCache;
};

/**
 * Look up a content file's last-modified date from its git history, falling back to the given
 * date when git history is unavailable or unreliable (shallow clone, no git, file not yet
 * committed).
 *
 * Unlike `sitemap.xml.ts`'s static-page lookup — which falls back to the current build time
 * because a static page (e.g. `/projects`) has no other meaningful date to fall back to — a
 * content entry (blog post, AI News issue) already carries its own `date` frontmatter field, so
 * that field, passed in as `fallback`, is the correct fallback here rather than build time.
 *
 * @param file - Path to the content file, relative to the repo root (e.g. `src/content/blog/foo.md`).
 * @param fallback - The content entry's own `date` field, used when git history can't be trusted.
 */
export const getContentFileLastmod = (file: string, fallback: Date): Date => {
  if (isShallowRepo()) {
    return fallback;
  }

  try {
    const output = execSync(`git log -1 --format=%aI -- "${file}"`, { encoding: "utf8" }).trim();
    if (output) {
      return new Date(output);
    }
  } catch {
    // Fall through to the fallback below.
  }

  return fallback;
};
