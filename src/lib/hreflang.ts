import type { CollectionEntry } from "astro:content";

/** One `<link rel="alternate" hreflang="...">` annotation the layout should emit. */
export interface HreflangLink {
  hreflang: string;
  href: string;
}

/**
 * Validate every blog post's `translationOf` reference points at a real post id. Call this
 * from `getStaticPaths` (or another build-time entry point) so a typo'd or stale reference
 * fails the build instead of silently emitting a broken hreflang link.
 *
 * @param posts - Every blog post in the collection.
 * @throws When any post's `translationOf` does not match another post's id.
 */
export function validateTranslationLinks(posts: CollectionEntry<"blog">[]): void {
  const knownIds = new Set(posts.map((post) => post.id));
  for (const post of posts) {
    const translationOf = post.data.translationOf;
    if (translationOf === undefined) {
      continue;
    }

    if (translationOf === post.id) {
      throw new Error(`Blog post "${post.id}" has translationOf pointing at itself, which is not a translation pair.`);
    }

    if (!knownIds.has(translationOf)) {
      throw new Error(
        `Blog post "${post.id}" has translationOf: "${translationOf}", which does not match any known blog post id.`,
      );
    }
  }
}

/**
 * Build the reciprocal hreflang link set for one post. A translation pair is mutual by
 * nature, so either side naming the other via `translationOf` is enough to establish the
 * link for both — the post can point at its counterpart directly, or be pointed at by it.
 * Google expects each language version to list itself plus every alternate; per KTD9, a post
 * with no linked counterpart in either direction emits no hreflang links at all.
 *
 * @param post - The post being rendered.
 * @param posts - Every blog post in the collection, used to find `post`'s counterpart.
 * @param buildUrl - Builds an absolute URL for a post id.
 * @returns The hreflang links to emit for `post`, empty when it has no linked counterpart.
 */
export function getHreflangLinks(
  post: CollectionEntry<"blog">,
  posts: CollectionEntry<"blog">[],
  buildUrl: (id: string) => string,
): HreflangLink[] {
  const partner =
    post.data.translationOf !== undefined
      ? posts.find((candidate) => candidate.id === post.data.translationOf)
      : posts.find((candidate) => candidate.data.translationOf === post.id);

  if (!partner) {
    return [];
  }

  return [
    { hreflang: post.data.lang, href: buildUrl(post.id) },
    { hreflang: partner.data.lang, href: buildUrl(partner.id) },
  ];
}
