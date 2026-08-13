import type { OGImageOptions } from "astro-og-canvas";

/**
 * Local CJK-capable font bundled in the repo so build-time OG image generation renders Chinese
 * titles correctly (most post titles are zh-CN). astro-og-canvas defaults to a Latin-only Noto
 * Sans subset, which has no CJK glyphs — a Chinese title would silently render as tofu boxes
 * without this. Sourced from Fontsource's static Noto Sans SC build (SIL Open Font License),
 * "chinese-simplified" unicode-range subset, weight 400.
 *
 * Quirk (confirmed with fontTools against the actual file): this Fontsource static subset embeds
 * its family name as "Noto Sans SC Thin" for every weight — OS/2 usWeightClass is correctly 400,
 * only the name-table family string is mislabeled upstream. CanvasKit's FontMgr matches fonts by
 * their embedded family name, not by filename, so `families` below must reference the mislabeled
 * string below or the font silently fails to match and the render falls back to tofu boxes.
 */
const CJK_FONT_PATH = "./src/assets/fonts/NotoSansSC-Regular.ttf";
const CJK_FONT_FAMILY = "Noto Sans SC Thin";

/** astro-og-canvas's own default font, listed explicitly so it still loads once `fonts` is
 * overridden below — it renders Latin letterforms slightly differently (and more consistently
 * with plain-English titles) than the CJK font's own Latin glyphs. */
const LATIN_FONT_URL = "https://api.fontsource.org/v1/fonts/noto-sans/latin-400-normal.ttf";
const LATIN_FONT_FAMILY = "Noto Sans";

/** Dark navy background gradient matching the site's dark-mode `--bg-primary` (#0c1222). */
const BG_GRADIENT: OGImageOptions["bgGradient"] = [[12, 18, 34]];

/**
 * Build the astro-og-canvas render options for a single generated per-post/issue OG card.
 *
 * @param title - Post/issue title (often zh-CN).
 * @param description - Post/issue description.
 * @returns Options consumed by astro-og-canvas's `OGImageRoute`.
 */
export function getOgImageOptions(title: string, description: string): OGImageOptions {
  return {
    title,
    description,
    bgGradient: BG_GRADIENT,
    padding: 64,
    fonts: [LATIN_FONT_URL, CJK_FONT_PATH],
    font: {
      title: {
        families: [LATIN_FONT_FAMILY, CJK_FONT_FAMILY],
        color: [255, 255, 255],
        size: 64,
        lineHeight: 1.2,
      },
      description: {
        families: [LATIN_FONT_FAMILY, CJK_FONT_FAMILY],
        color: [148, 163, 184],
        size: 34,
        lineHeight: 1.4,
      },
    },
  };
}

/** URL-path segment each content collection uses under `/open-graph/`, kept distinct from the
 * collection's own key ("aiNews") so generated card paths match the site's actual `/ai-news/`
 * route rather than leaking the internal collection name. */
const OG_PATH_SEGMENT: Record<"blog" | "aiNews", string> = {
  blog: "blog",
  aiNews: "ai-news",
};

/**
 * Map a content entry to the site-relative URL path of its generated OG card.
 *
 * @param collection - Source content collection.
 * @param id - Entry id (post/issue slug).
 * @returns Site-relative path to the generated PNG, e.g. `/open-graph/blog/my-post.png`.
 */
export function getOgImagePath(collection: "blog" | "aiNews", id: string): string {
  return `/open-graph/${OG_PATH_SEGMENT[collection]}/${id}.png`;
}
