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

Target behavior:

- Run every day around 08:00 Asia/Shanghai.
- Use a local Mac `launchd` job because the requested Chrome Tab preview needs a GUI environment.
- Generate the daily issue as Markdown.
- Start a local Astro preview.
- Open Chrome to the generated issue URL.
- Run `npm run build`.
- Commit and push if the issue passes review.
- Let Vercel deploy from `main`.

Suggested local flow:

```text
08:00 launchd
  -> fetch candidate sources
  -> AI selects 5-10 items
  -> AI writes src/content/ai-news/YYYY-MM-DD.md
  -> npm run build
  -> npm run preview
  -> open Chrome tab for review
  -> commit + push after approval
```

Safety gate:

- First 1-2 weeks should be `auto-generate + human approve`.
- Full auto-send should start only after quality is stable.

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
