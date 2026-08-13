import { OGImageRoute } from "astro-og-canvas";
import { getPublishableEntries, type ContentEntry } from "../../lib/content-index";
import { getOgImageOptions, getOgImagePath } from "../../lib/og-image";

// One generated card per published blog post + AI News issue. `getOgImagePath` (sans its leading
// `/open-graph/` prefix and trailing `.png`, both handled by OGImageRoute) doubles as the `pages`
// key, so this route's own output paths always match what `getOgImagePath` hands back to callers.
const entries = await getPublishableEntries();
const pages: Record<string, ContentEntry> = Object.fromEntries(
  entries.map((entry) => [
    getOgImagePath(entry.collection, entry.id).replace(/^\/open-graph\//, "").replace(/\.png$/, ""),
    entry,
  ]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, entry) => getOgImageOptions(entry.title, entry.description),
});
