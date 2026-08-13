# SEO/GEO Hardening — Remaining Owner Actions

All 11 implementation units of `docs/plans/2026-08-11-001-feat-seo-geo-hardening-plan.md` have landed on `feat/seo-geo-hardening`. Everything below is dashboard/account work the repo itself cannot do — it has to be done by the site owner, once, after this branch merges and deploys.

## D1 — Verify the domain in Google Search Console

1. Go to Search Console, add a **Domain property** for `charles-cheng.com` (not a URL-prefix property — a Domain property covers apex, `www`, and both protocols in one place, per KTD7).
2. Verify via DNS TXT record. The domain's nameservers are on Cloudflare, so add the TXT record there.
3. Once verified, submit `https://www.charles-cheng.com/sitemap.xml`.
4. Start reading the **Generative AI** filter under Search Results — this is the free impressions-level signal for Google's AI Overviews / AI Mode surfaces.

## D2 — Set up Bing Webmaster Tools

1. Create a Bing Webmaster Tools account/site for `charles-cheng.com`.
2. Use the **Search Console import** option instead of verifying from scratch — it carries over verification and lets you submit the sitemap in the same step.
3. Start reading the **AI Performance** report — this is the only free, citation-level (not impression-level) data source anywhere; it shows which pages actually got cited in Copilot/Bing AI answers.

## D3 — Change the Vercel apex→www redirect to a permanent status code

1. In the Vercel project's Domains settings, find the redirect rule from `charles-cheng.com` to `www.charles-cheng.com`.
2. Change its status code from **307 (temporary)** to **308 (permanent)**. A 307 tells search engines the apex is still the "real" canonical URL, which fights against every other canonicalization signal this branch already sets to `www` — 308 (or 301) is required for those signals to agree.
3. Verify after deploy:
   ```bash
   curl -sSI https://charles-cheng.com/       # expect: 308, location: https://www.charles-cheng.com/
   curl -sSI https://www.charles-cheng.com/   # expect: 200, no location header
   ```

## D4 — Confirm Vercel's AI-bot managed ruleset is in allow mode

Vercel ships an optional managed ruleset that can block AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) at the edge, independent of `robots.txt`. Its default is inactive, and this branch's `robots.txt` already assumes these bots are welcome (R3) — but that assumption has never been checked against the actual Vercel project setting. In the project's Firewall/Security settings, confirm the AI-bot ruleset is either disabled or set to allow, not block.

## Add the `INDEXNOW_KEY` GitHub Actions repository variable

U5 added an IndexNow submitter (`scripts/submit-indexnow.mjs`) wired into `.github/workflows/ai-news-notify.yml`, but the workflow step no-ops until this variable exists:

1. Repo Settings → Secrets and variables → Actions → **Variables** tab (not Secrets — the key is meant to be public, it's served in the clear at its own URL by design).
2. Add a variable named `INDEXNOW_KEY` with the value found in `public/d2eb4c1c0d34e1337a0d8d99127ce321.txt` (the file itself must stay published at the site root — don't delete it).
3. After adding it, the next blog post or AI News issue push will trigger a real IndexNow submission instead of the guarded no-op notice.

## Nice-to-have: enable Vercel "Deep Clone"

Several build-time features (the sitemap's static-page `lastmod`, and `dateModified` on blog/AI-News structured data) read git history at build time and safely fall back to a less-precise value when the checkout is a shallow clone — Vercel's default. Enabling **Deep Clone** in the project's Git settings gets these their fully accurate values instead of the fallback; not required, since the fallback is safe, just more precise.

## Enable Vercel Web Analytics

U11 wired `@vercel/analytics` into every page, but the project's **Web Analytics** feature still needs to be turned on in the Vercel dashboard (Analytics tab) for it to actually start collecting and reporting data.

---

None of the above blocks this branch from merging or deploying — the repo-side work is complete either way. This document exists so these steps aren't lost once the PR closes.
