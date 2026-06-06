# AI News Growth System

This document records the planned AI-managed growth system for `charles-cheng.com`.

The product goal is not only to publish daily AI news. The goal is to build a repeatable loop:

```text
sources -> AI selection -> daily issue -> website archive -> email delivery -> attribution -> weekly report -> next adjustment
```

## Product Scope

### Daily AI News

Daily AI News solves daily AI information processing. Each issue should collect 5-10 events, keep original source links, and add short judgment for builders.

Recommended issue structure:

```markdown
# AI News｜YYYY-MM-DD

## 今日判断
One sentence about the most important shift today.

## 重点 3 条
### 1. Event title
- 原链接：
- 发生了什么：
- 为什么重要：
- 我的判断：

## 快讯 5-7 条
- Event, original link, one-sentence context.

## 后续观察
1-3 follow-up points.
```

### Weekly AI Long-form Essay

In addition to daily news, the site should publish one weekly long-form AI essay. The essay should focus on:

- real understanding of AI, not hype;
- how AI changes engineering, work, attention, and decision-making;
- how to resist negative effects such as attention fragmentation, shallow information intake, and tool addiction;
- what builders should do differently after seeing the week's news pattern.

Daily AI News feeds the weekly essay. The weekly essay should not be a summary dump. It should extract one durable thesis from the week's information flow.

## Follow Builders Adaptation

The reference implementation is `zarazhangrui/follow-builders`:

- GitHub: https://github.com/zarazhangrui/follow-builders
- Core principle: follow builders, not influencers.
- Default sources: 26 X/Twitter builders, 6 AI podcasts, and 2 official blogs.
- Feed generation runs in GitHub Actions, not on the user's laptop.
- The central feed is generated first, then an agent/LLM remixes the feed into a digest.

For this site, reuse the principle, not the full product shape. The public AI News should be a website-native publication, not a chat digest.

Internal rule:

- Marketing accounts, listicle accounts, affiliate accounts, and pure repost accounts are excluded by default.
- A source earns attention by showing work: product launches, demos, code, architecture notes, workflow changes, evaluation results, or failure analysis.
- A single item still needs its own evidence. A trusted account posting fluff should be skipped.

Initial 10 X/Twitter builders to watch:

1. Andrej Karpathy — `karpathy`
2. Swyx — `swyx`
3. Josh Woodward — `joshwoodward`
4. Boris Cherny — `bcherny`
5. Amjad Masad — `amasad`
6. Guillermo Rauch — `rauchg`
7. Alex Albert — `alexalbert__`
8. Ryo Lu — `ryolu_`
9. Peter Steinberger — `steipete`
10. Dan Shipper — `danshipper`

These are not permanent endorsements. They are the first seed set. The source list should evolve based on signal quality.

Candidate scoring:

| Dimension | Score |
| --- | --- |
| Original source link exists | 0-2 |
| Real builder activity, not commentary-only | 0-2 |
| Useful to engineering/product/workflow decisions | 0-2 |
| New information density | 0-2 |
| Long-term thesis value for weekly essays | 0-2 |

Decision rule:

- Below 6: discard into internal log only.
- 6-7: candidate for short news.
- 8-10: candidate for top placement.

The public AI News must not include a "discarded today" section. Rejections belong in internal logs only.

Public issue structure:

```markdown
# AI News｜YYYY-MM-DD

## 今日目录
- [Title A](#title-a)
- [Title B](#title-b)

## 今日判断
One sentence about the most important pattern.

## 快讯

### Title A
[查看原文](https://...)

100-300 words: what happened, why it matters, and my judgment.
```

Internal log structure:

```markdown
# AI News Internal Log｜YYYY-MM-DD

## Candidate Pool
Raw items and source links.

## Selected
Items selected for public publication, with scores.

## Discarded
Items rejected, with reasons.

## Follow-up
Items worth testing, watching, or turning into weekly essay material.
```

## Phase 1: Website Surface and Subscription Entry

Status: implemented in this first pass.

Deliverables:

- Add `aiNews` content collection in `src/content.config.ts`.
- Add `src/content/ai-news/` as the daily issue directory.
- Add `/ai-news` archive page.
- Add `/ai-news/[date]` issue detail page.
- Add `/ai-news/feed.json` for automation and AI retrieval.
- Add `NewsletterSignup` component.
- Add AI News entry to sidebar navigation.
- Add AI News section to the homepage.
- Add AI News pages to sitemap, `site-index.json`, `llms.txt`, and `llms-full.txt`.
- Add `scripts/generate-ai-news-draft.mjs` and `npm run news:stub` for draft creation.

Subscription behavior:

- Uses Kit as the preferred newsletter system.
- Set `PUBLIC_KIT_FORM_ID` and `PUBLIC_KIT_API_KEY` to connect the signup form to Kit's public form subscribe API.
- Without both public env vars, the site shows a configured-safe disabled state instead of silently failing.
- Do not expose Kit API secrets in the static site. Secrets are only for the later automation layer that creates broadcasts and reads analytics.

Why Kit first:

- It supports subscribers, tags, broadcasts, opens, clicks, and unsubscribe handling.
- It fits newsletter growth better than a raw transactional email API.
- Resend remains a future option for product-style transactional email.

## Phase 2: Daily Automation

Status: implemented as a no-key v1 automation.

Current behavior:

- Run every day around 08:07 Asia/Shanghai.
- Use GitHub Actions as the execution environment. The user's laptop is not part of the production path.
- Chrome Tab is optional for preview and visual checking. It is not the core runtime.
- Fetch public `follow-builders` JSON feeds.
- Deterministically score and select 5-10 builder-facing items.
- Generate the daily public issue as `src/content/ai-news/YYYY-MM-DD.md`.
- Generate an internal selection log in `.ai-news-internal/`.
- Run `npm run build`.
- Commit the generated public issue to `main`.
- Let Vercel deploy from `main`.
- Send a Resend notification email to `chengxisheng777@gmail.com` after the generated issue is committed.

Implemented files:

- `scripts/generate-ai-news-from-follow-builders.mjs`
- `.github/workflows/ai-news-generate.yml`
- `npm run news:generate`

The v1 generator does not require a paid LLM key. It uses public feeds plus deterministic scoring. This is enough to publish a real daily issue and validate the website loop. A later LLM step can improve judgment quality and rewrite summaries in a stronger personal voice.

Suggested hosted flow:

```text
08:07 GitHub Actions
  -> fetch candidate sources
  -> deterministic scorer selects 5-10 items
  -> write internal selection log
  -> write src/content/ai-news/YYYY-MM-DD.md
  -> npm run build
  -> commit/push to main
  -> Vercel deploys from main
  -> send email notification to chengxisheng777@gmail.com
```

Safety gate:

- First 1-2 weeks should be `auto-generate + human approve`.
- Full auto-send should start only after quality is stable.

Execution answer:

- The AI News production and selection process should run in GitHub Actions.
- In v1, no LLM call is required. Source fetching, scoring, Markdown generation, build validation, and notification are deterministic scripts.
- In v2, the LLM call should happen from the GitHub Actions runner using repository secrets.
- A separate server is not required for the first version.
- A hosted browser provider is only needed later if we need real browser sessions beyond Playwright checks.

## Phase 3: Email Delivery and Growth Loop

Target behavior:

- Create a Kit broadcast for each daily issue.
- Use a server-side script or secure scheduled job for Kit broadcast creation and analytics reads.
- Add UTM parameters to every website link:
  - `utm_source=kit`
  - `utm_medium=email`
  - `utm_campaign=ai_news_YYYYMMDD`
- Send daily email after the issue is published.
- Track opens, clicks, unsubscribes, and source-link clicks.

Email structure:

```markdown
Subject: 今日 AI News：<top event>

今日判断：
...

重点 3 条：
1. ...
2. ...
3. ...

快讯：
- ...

阅读全文：
https://charles-cheng.com/ai-news/YYYY-MM-DD?utm_source=kit&utm_medium=email&utm_campaign=ai_news_YYYYMMDD
```

Weekly growth report:

```markdown
# AI News Growth Report｜YYYY-WW

## 总体判断
What changed this week.

## 内容表现
Which topics got clicks and which did not.

## 订阅表现
New subscribers, open rate, click rate, unsubscribe rate.

## 渠道表现
Email, Twitter/X, Direct, Search, referrals.

## 下周动作
Continue, stop, or adjust.
```

## Growth Strategy From Reference

The reference case is useful because the growth loop was not based on manual effort. The replicable principles are:

- AI should run daily, not wait for manual prompting.
- News selection needs a fixed judgment lens.
- Every outbound link needs UTM attribution.
- Subscription UX should be measured and adjusted.
- Reports should classify content by goal, not by vanity metrics.
- Weekly reports should check whether last week's recommendations worked.

For this site, the judgment lens should be:

> AI signal for builders: tools, agents, models, infra, product shifts, workflow changes, and original source links.

## Future Source Candidates

Final sources are intentionally left undecided. Candidate source groups:

- official AI company blogs and changelogs;
- model release notes and API docs;
- arXiv / papers with engineering relevance;
- GitHub trending AI projects;
- Hacker News AI discussions;
- X/Twitter posts from high-signal builders;
- funding/product news that changes builder behavior.

Selection should favor:

- concrete mechanism over vague hype;
- engineering practice over pure announcement;
- original source over secondary commentary;
- events that connect to weekly long-form themes.

## Notification

Publication notifications are handled by `.github/workflows/ai-news-notify.yml`.

Behavior:

- Trigger on pushes to `main` that change `src/content/ai-news/**`.
- Skip `_template.md`.
- Skip issues with `draft: true`.
- Send an email to `chengxisheng777@gmail.com`.

Required GitHub configuration:

- Secret: `RESEND_API_KEY`
- Variable: `AI_NEWS_EMAIL_FROM`
- Variable: `AI_NEWS_NOTIFY_TO`

`AI_NEWS_EMAIL_FROM` should be a verified sender in Resend. Example:

```text
AI News <news@charles-cheng.com>
```
