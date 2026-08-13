# SEO/GEO Measurement

This document records how `charles-cheng.com` reads its free SEO and GEO (generative-engine optimization) signals, and what it deliberately does not measure.

Requirements covered:

- R28 — site traffic is attributed by UTM parameters rather than by referrer.
- R29 — AI crawler fetches are observable per user-agent.
- R30 — AI-assistant referrals are distinguishable from other traffic in an analytics surface.

## Measurement stack

### 1. Vercel Web Analytics — crawler and visit visibility (R29)

`@vercel/analytics` is wired into `src/layouts/Layout.astro` via its Astro integration (`import Analytics from "@vercel/analytics/astro"`, rendered as `<Analytics />` at the end of `<body>`). It ships a `<vercel-analytics>` custom element plus an inline module script on every page.

Once the site is deployed on Vercel with Web Analytics enabled, this gives:

- A native channel-detection view that recognizes AI-assistant referrers (ChatGPT, Perplexity, Claude, Copilot, Gemini) alongside search/social/direct.
- Vercel's separate bot/crawler request logs (Firewall / Observability, tracked at the platform level rather than by this component) for per-user-agent fetch visibility — which paths GPTBot, ClaudeBot, PerplexityBot, etc. are actually requesting, and how often. This is what makes R29 observable: crawler fetches are a server/edge-log fact, not something the client-side analytics snippet can see, so "observable per user-agent" is delivered by Vercel's request logs, and Web Analytics separately covers human visit attribution.

Nothing else was added to the build for this — no self-hosted analytics, no separate bot-tracking script. The free tier of Vercel Analytics and the platform's own request logging are the entire surface.

### 2. Bing Webmaster Tools — AI Performance report (citation-level data)

Bing Webmaster Tools ships an "AI Performance" report that shows citation-level data: which pages got cited in Copilot/Bing AI answers, and impression/click counts against those citations. This is the only free tool anywhere that reports actual citation events rather than a synthetic prompt panel's guess at them.

Status: **outstanding, owned by the site owner (D2).** A Bing Webmaster Tools account for `charles-cheng.com` has not been set up yet. This unit's repo-side work does not depend on that account existing — it only needs to be recorded as a dependency here so the next reader knows to set it up and then start reading the AI Performance report.

### 3. Google Search Console — Generative AI report (impressions)

Search Console has a "Generative AI" filter under Search Results (surfaced as AI Overviews / AI Mode impressions), which shows how often the site's pages get pulled into Google's generative surfaces, alongside normal Search impressions/clicks.

Status: **outstanding, owned by the site owner (D1).** Search Console verification for `charles-cheng.com` has not been completed yet. Same note as above — this document assumes it will exist and should be read once it does, but nothing in this repo blocks on it.

### 4. UTM parameters — attribution instead of referrer (R28, R30)

Referrer-based attribution silently fails for AI-assistant traffic:

- Claude's native app sends **no `Referer` header at all** when a user follows a link out of a conversation, so referrer-based analytics sees that visit as direct/unknown traffic — indistinguishable from someone typing the URL in by hand.
- Paid ChatGPT applies `rel="noreferrer"` to inline citation links, which strips the `Referer` header the same way. But it still appends `utm_source=chatgpt.com` (and related UTM params) to the destination URL itself.

That asymmetry is exactly why UTM parameters, not referrer, are the mechanism for R28/R30: the query string survives `rel="noreferrer"` and survives a missing `Referer` header, because it travels as part of the URL rather than as a browser-supplied header. A visit landing with `?utm_source=chatgpt.com` (or similarly for other assistants that tag their outbound links) is how an AI-assistant referral becomes distinguishable from other traffic in Vercel Analytics (R30), even though the referrer for that same visit is empty or stripped.

This is a passive-reading rule, not a new tagging system: this repo does not add UTM parameters to any content it controls (see the constraint below). It reads whatever UTM parameters inbound traffic already arrives with.

### 5. What is explicitly out of scope (KTD12)

This unit does not build, and no future unit should build without re-deriving this reasoning:

- **A prompt-panel monitoring harness** — a script that periodically asks LLMs "do you know about X" or "what would you cite for query Y" and logs the answers.
- **A paid AI-visibility subscription tool** (Profound, Otterly, Peec, etc.) — third-party services that run the same kind of synthetic prompt panel commercially.

Reasoning: a variance-components study of single-answer LLM brand-mention reliability found the signal-to-noise ratio so low that detecting a real change in citation rate needs a sample size no personal budget supports — the same prompt asked once can flip between mentioning a brand and not mentioning it, driven by sampling noise rather than by anything that changed on the target site. Every commercial AI-visibility tool available today runs this same kind of synthetic prompt panel; none of them have real access to production query logs (only the search engines and the AI assistants themselves have that). Bing Webmaster Tools' AI Performance report is the one exception — free, and grounded in actual citation events rather than a sampled prompt panel — which is why it is listed above as the sole citation-level source this stack relies on.

If a future reader is tempted to build a prompt-monitoring harness or buy an AI-visibility subscription, re-run the reliability math first. The conclusion here is about reliability at this budget, not a permanent rule against the category.

## Constraint: no UTM tagging on canonical/sitemap/JSON-LD URLs

UTM parameters must never be added to:

- `<link rel="canonical">` values,
- `<loc>` entries in `sitemap.xml`,
- any JSON-LD `url` field.

Tagging any of those would make the tagged URL look like a distinct page to search engines and AI crawlers, manufacturing duplicate-content signals against the canonical, untagged URL. This repo's existing convention (`docs/ai-news-growth-system.md`, Phase 3) already scopes UTM tagging to outbound email links only (`utm_source=kit&utm_medium=email&utm_campaign=ai_news_YYYYMMDD` on links sent in the daily email). This unit does not add any new UTM tagging anywhere in the codebase — it only wires up the analytics surface that can read UTM parameters when they arrive on an inbound request, and documents why referrer alone would miss AI-assistant traffic.

## Reconsideration trigger (from KTD10)

If Search Console reports "Crawled - currently not indexed" for more than half of the `ai-news` URLs, or any other quality flag appears on that collection, revisit adding `noindex, follow` to AI News issues older than the most recent thirty. That decision was deferred, not ruled out — this is the condition under which it should be revisited.

## Outstanding owner actions

- **D1** — Verify `charles-cheng.com` in Google Search Console, then start reading the Generative AI impressions report.
- **D2** — Set up a Bing Webmaster Tools account for `charles-cheng.com`, then start reading the AI Performance report.
- **D3** — Change the Vercel apex→www redirect status from 307 to 308 (recorded in U1).
- **D4** — Confirm Vercel's AI-bot ruleset is set to allow mode (recorded in U5).

None of these block this unit's repo-side work. They are recorded here so the measurement stack described above has somewhere to actually report once the accounts and dashboard settings exist.
