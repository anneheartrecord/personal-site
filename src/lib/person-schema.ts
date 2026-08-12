import type { Person, WithContext } from "schema-dts";
import { site } from "../data/site";
import { socials } from "../data/socials";

/**
 * Absolute, externally-resolvable profile URLs for the site owner, used as the `sameAs` graph on
 * the Person schema. Sourced entirely from `socials.ts` (which already lists GitHub and X)
 * filtered down to real cross-site identity links — excludes the in-page WeChat QR trigger
 * (`#wechat`, not a resolvable address) and the `mailto:` entry (an email address, not "another
 * page representing the same entity", which is what `sameAs` is for).
 */
const externalSameAs = socials.filter((social) => social.url.startsWith("http")).map((social) => social.url);

/**
 * The site owner's Person schema. Shared by the sitewide default JSON-LD emitted on every page
 * (`Layout.astro`) and the home page's `ProfilePage` `mainEntity` (`index.astro`) so the two never
 * drift apart.
 *
 * @param imageUrl - Absolute URL of the profile image to attach, resolved by the caller against
 * whichever `image` value is in effect for that page.
 */
export const getPersonSchema = (imageUrl: string): WithContext<Person> => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.author.name,
  alternateName: site.author.alias,
  url: site.url,
  image: imageUrl,
  email: site.author.email,
  jobTitle: "Full-stack Engineer",
  sameAs: externalSameAs,
  knowsAbout: [...site.topics],
});
