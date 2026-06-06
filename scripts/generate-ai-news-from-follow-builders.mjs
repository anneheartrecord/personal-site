#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DROP_PATTERNS,
  IMPORTANT_PATTERNS,
  createInsight,
  createTopicKey,
} from "./ai-news-follow-builders-rules.mjs";

const CONTENT_DIR = join(process.cwd(), "src", "content", "ai-news");
const INTERNAL_LOG_DIR = join(process.cwd(), ".ai-news-internal");
const TIME_ZONE = "Asia/Shanghai";
const FEED_URLS = {
  x: "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json",
  podcasts: "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json",
  blogs: "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json",
};

/** Return a CLI option value by flag name.
 * @param {string} flagName - CLI flag, for example "--date".
 * @returns {string | undefined} The value immediately after the flag.
 */
const readOption = (flagName) => {
  const flagIndex = process.argv.indexOf(flagName);
  return flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
};

/** Test whether a boolean flag is present.
 * @param {string} flagName - CLI flag, for example "--force".
 * @returns {boolean} True when the flag is included.
 */
const hasFlag = (flagName) => process.argv.includes(flagName);

/** Format a date as YYYY-MM-DD in the target timezone.
 * @param {Date} dateValue - Date object to format.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
const formatDateInTimeZone = (dateValue) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(dateValue).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

/** Normalize whitespace and strip tracking-only URL placeholders.
 * @param {string} text - Raw text from a feed item.
 * @returns {string} Cleaned one-line text.
 */
const cleanText = (text) =>
  text
    .replace(/https:\/\/t\.co\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Convert a title into a stable ASCII anchor.
 * @param {string} prefix - Stable issue-local prefix.
 * @param {number} index - One-based item index.
 * @returns {string} HTML anchor id.
 */
const createAnchor = (prefix, index) => `${prefix}-${String(index).padStart(2, "0")}`;

/** Fetch and parse JSON from a public feed URL.
 * @param {string} feedUrl - Public JSON URL.
 * @returns {Promise<object>} Parsed JSON payload.
 */
const fetchJsonFeed = async (feedUrl) => {
  const response = await fetch(feedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${feedUrl}: ${response.status}`);
  }
  return response.json();
};

/** Fetch all public follow-builders feeds.
 * @returns {Promise<{xFeed: object, podcastFeed: object, blogFeed: object}>} Feed payloads.
 */
const fetchFeeds = async () => {
  const [xFeed, podcastFeed, blogFeed] = await Promise.all([
    fetchJsonFeed(FEED_URLS.x),
    fetchJsonFeed(FEED_URLS.podcasts),
    fetchJsonFeed(FEED_URLS.blogs),
  ]);
  return { xFeed, podcastFeed, blogFeed };
};

/** Convert X feed entries into candidate items.
 * @param {object} xFeed - Parsed feed-x.json payload.
 * @returns {Array<object>} Candidate items.
 */
const extractXItems = (xFeed) => {
  const builders = Array.isArray(xFeed.x) ? xFeed.x : [];
  return builders.flatMap((builder) => {
    const tweets = Array.isArray(builder.tweets) ? builder.tweets : [];
    return tweets.map((tweet) => ({
      id: `x-${tweet.id}`,
      type: "x",
      sourceName: builder.name,
      sourceHandle: builder.handle,
      sourceLabel: `${builder.name} (@${builder.handle})`,
      titleSeed: cleanText(tweet.text),
      text: cleanText(tweet.text),
      rawText: tweet.text,
      url: tweet.url,
      publishedAt: tweet.createdAt,
      engagement: {
        likes: Number(tweet.likes ?? 0),
        retweets: Number(tweet.retweets ?? 0),
        replies: Number(tweet.replies ?? 0),
      },
      feedGeneratedAt: xFeed.generatedAt,
    }));
  });
};

/** Convert podcast feed entries into candidate items.
 * @param {object} podcastFeed - Parsed feed-podcasts.json payload.
 * @returns {Array<object>} Candidate items.
 */
const extractPodcastItems = (podcastFeed) => {
  const podcasts = Array.isArray(podcastFeed.podcasts) ? podcastFeed.podcasts : [];
  return podcasts.map((episode) => ({
    id: `podcast-${episode.guid}`,
    type: "podcast",
    sourceName: episode.name,
    sourceHandle: "",
    sourceLabel: episode.name,
    titleSeed: episode.title,
    text: cleanText(`${episode.title}. ${episode.transcript ?? ""}`).slice(0, 1800),
    rawText: episode.transcript ?? "",
    url: episode.url,
    publishedAt: episode.publishedAt,
    engagement: { likes: 0, retweets: 0, replies: 0 },
    feedGeneratedAt: podcastFeed.generatedAt,
  }));
};

/** Convert blog feed entries into candidate items.
 * @param {object} blogFeed - Parsed feed-blogs.json payload.
 * @returns {Array<object>} Candidate items.
 */
const extractBlogItems = (blogFeed) => {
  const blogPosts = Array.isArray(blogFeed.blogs) ? blogFeed.blogs : [];
  return blogPosts.map((post) => ({
    id: `blog-${post.url}`,
    type: "blog",
    sourceName: post.name ?? post.source ?? "Blog",
    sourceHandle: "",
    sourceLabel: post.name ?? post.source ?? "Blog",
    titleSeed: post.title ?? "Untitled AI post",
    text: cleanText(`${post.title ?? ""}. ${post.description ?? post.summary ?? ""}`),
    rawText: post.description ?? post.summary ?? "",
    url: post.url,
    publishedAt: post.publishedAt ?? post.date,
    engagement: { likes: 0, retweets: 0, replies: 0 },
    feedGeneratedAt: blogFeed.generatedAt,
  }));
};

/** Calculate keyword categories and deterministic score for a candidate.
 * @param {object} candidate - Candidate item.
 * @returns {object} Candidate item with score metadata.
 */
const scoreCandidate = (candidate) => {
  const searchableText = `${candidate.titleSeed} ${candidate.text}`;
  const categories = IMPORTANT_PATTERNS.filter((rule) => rule.pattern.test(searchableText));
  const categoryScore = categories.reduce((total, rule) => total + rule.weight, 0);
  const engagementScore =
    candidate.type === "x"
      ? Math.min(
          20,
          Math.log10(candidate.engagement.likes + 1) * 6 +
            Math.log10(candidate.engagement.retweets + 1) * 5 +
            Math.log10(candidate.engagement.replies + 1) * 3,
        )
      : 14;
  const sourceScore = candidate.type === "podcast" ? 18 : 12;
  const originalLinkScore = candidate.url ? 8 : 0;
  const lengthScore = candidate.text.length >= 80 ? 8 : candidate.text.length >= 45 ? 3 : -12;
  const dropReasons = DROP_PATTERNS.filter((rule) => rule.pattern.test(candidate.text)).map(
    (rule) => rule.reason,
  );

  if (categories.length === 0 && candidate.type === "x") {
    dropReasons.push("没有命中 Agent、Infra、Coding Tool、产品变化等核心主题");
  }

  if (candidate.text.length < 35) {
    dropReasons.push("信息量过短");
  }

  const score = Math.round(categoryScore + engagementScore + sourceScore + originalLinkScore + lengthScore);
  return {
    ...candidate,
    categories: categories.map((rule) => rule.name),
    score,
    dropReasons,
  };
};

/** Select a diverse set of 5-10 publishable items.
 * @param {Array<object>} scoredCandidates - Candidates with score metadata.
 * @returns {Array<object>} Selected candidates.
 */
const selectItems = (scoredCandidates) => {
  const sortedCandidates = scoredCandidates
    .filter((candidate) => candidate.dropReasons.length === 0)
    .filter((candidate) => candidate.score >= 42)
    .sort((left, right) => right.score - left.score);
  const selectedItems = [];
  const sourceCounts = new Map();
  const topicKeys = new Set();

  for (const candidate of sortedCandidates) {
    const sourceKey = candidate.sourceHandle || candidate.sourceName;
    const topicKey = createTopicKey(candidate);
    const currentSourceCount = sourceCounts.get(sourceKey) ?? 0;
    if (currentSourceCount >= 2) {
      continue;
    }

    if (topicKeys.has(topicKey)) {
      continue;
    }

    const alreadyCovered = selectedItems.some(
      (item) => cleanText(item.titleSeed).slice(0, 80) === cleanText(candidate.titleSeed).slice(0, 80),
    );
    if (alreadyCovered) {
      continue;
    }

    selectedItems.push(candidate);
    sourceCounts.set(sourceKey, currentSourceCount + 1);
    topicKeys.add(topicKey);
    if (selectedItems.length >= 8) {
      break;
    }
  }

  if (selectedItems.length >= 5) {
    return selectedItems;
  }

  return scoredCandidates
    .filter((candidate) => candidate.dropReasons.length === 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
};

/** Determine the issue number for a date from existing content files.
 * @param {string} issueDate - Issue date in YYYY-MM-DD.
 * @returns {number} Next positive issue number.
 */
const getIssueNumber = (issueDate) => {
  if (!existsSync(CONTENT_DIR)) {
    return 1;
  }

  const existingIssuePath = join(CONTENT_DIR, `${issueDate}.md`);
  if (existsSync(existingIssuePath)) {
    const existingIssue = readFileSync(existingIssuePath, "utf8").match(/\nissue:\s*(\d+)/)?.[1];
    if (existingIssue) {
      return Number(existingIssue);
    }
  }

  const issueNumbers = readdirSync(CONTENT_DIR)
    .filter((fileName) => fileName.endsWith(".md") && fileName !== "_template.md")
    .map((fileName) => readFileSync(join(CONTENT_DIR, fileName), "utf8").match(/\nissue:\s*(\d+)/)?.[1])
    .filter(Boolean)
    .map((issueNumber) => Number(issueNumber));

  return issueNumbers.length > 0 ? Math.max(...issueNumbers) + 1 : 1;
};

/** Build public Markdown for a daily AI News issue.
 * @param {string} issueDate - Issue date in YYYY-MM-DD.
 * @param {Array<object>} selectedItems - Selected candidates.
 * @returns {string} Markdown file content.
 */
const buildPublicIssue = (issueDate, selectedItems) => {
  const issueNumber = getIssueNumber(issueDate);
  const slugPrefix = issueDate.replaceAll("-", "");
  const insights = selectedItems.map((item, index) => ({
    ...createInsight(item),
    anchor: createAnchor(slugPrefix, index + 1),
    item,
  }));
  const focusTags = Array.from(new Set(selectedItems.flatMap((item) => item.categories))).slice(0, 4);
  const description = `今天的 AI News 聚焦 ${focusTags.join("、") || "AI builder 一线动态"}。`;
  const tableOfContents = insights
    .map((insight) => `- [${insight.title}](#${insight.anchor})`)
    .join("\n");
  const body = insights
    .map(
      (insight, index) => `<a id="${insight.anchor}"></a>

### ${index + 1}. ${insight.title}

[查看原文](${insight.item.url}) · 来源：${insight.item.sourceLabel}

${insight.summary}`,
    )
    .join("\n\n");

  return `---
title: "AI News｜${issueDate}"
description: "${description}"
date: ${issueDate}
tags: ["AI News", "AI", "Agent", "Builder"]
draft: false
issue: ${issueNumber}
sourceCount: ${selectedItems.length}
---

## 今日目录

${tableOfContents}

## 今日判断

今天的主要信号不是某个单点发布，而是 AI 产品继续向真实工作流下沉：coding agent 在处理长任务，产品工具在接入 agent，builder 也开始讨论记忆、状态、技能和审查边界。

对一线 builder 来说，值得看的不是营销号转述，而是谁真的在把 AI 放进日常系统里使用。今天这些条目共同指向一个方向：agent 的竞争会越来越从“模型聪不聪明”转向“工作区、上下文、权限、复用能力和人工审查是否稳定”。

## 快讯

${body}
`;
};

/** Build an internal selection log with selected and discarded items.
 * @param {string} issueDate - Issue date in YYYY-MM-DD.
 * @param {Array<object>} selectedItems - Selected candidates.
 * @param {Array<object>} scoredCandidates - All scored candidates.
 * @param {{xFeed: object, podcastFeed: object, blogFeed: object}} feeds - Source feeds.
 * @returns {string} Internal Markdown log.
 */
const buildInternalLog = (issueDate, selectedItems, scoredCandidates, feeds) => {
  const selectedIds = new Set(selectedItems.map((item) => item.id));
  const discardedItems = scoredCandidates
    .filter((candidate) => !selectedIds.has(candidate.id))
    .sort((left, right) => right.score - left.score)
    .slice(0, 40);
  const selectedLog = selectedItems
    .map(
      (item) =>
        `- ${item.score}｜${item.sourceLabel}｜${item.categories.join(", ") || "uncategorized"}\n  ${item.url}\n  ${item.text.slice(0, 280)}`,
    )
    .join("\n\n");
  const discardedLog = discardedItems
    .map(
      (item) =>
        `- ${item.score}｜${item.sourceLabel}｜${item.dropReasons.join("；") || "分数或多样性限制"}\n  ${item.url}\n  ${item.text.slice(0, 220)}`,
    )
    .join("\n\n");

  return `# AI News Internal Log｜${issueDate}

## Feed Snapshot

- X feed generated at: ${feeds.xFeed.generatedAt ?? "unknown"}
- Podcast feed generated at: ${feeds.podcastFeed.generatedAt ?? "unknown"}
- Blog feed generated at: ${feeds.blogFeed.generatedAt ?? "unknown"}
- Candidate count: ${scoredCandidates.length}
- Selected count: ${selectedItems.length}

## Selected

${selectedLog}

## Discarded

${discardedLog}

## Follow-up

- 接入 LLM 后，把当前 deterministic summary 升级为更像个人判断的 100-300 字短评。
- 继续扩充一线 builder 名单，尤其是 AI infra、agent runtime、coding tool 和产品工程方向。
- 公开 issue 不展示本节内容；丢弃记录只保留在内部日志或 GitHub artifact。
`;
};

/** Main script entrypoint.
 * @returns {Promise<void>} Resolves after files are written.
 */
const main = async () => {
  const requestedDate = readOption("--date") ?? process.env.AI_NEWS_DATE;
  const issueDate = requestedDate || formatDateInTimeZone(new Date());
  const shouldForce = hasFlag("--force") || process.env.AI_NEWS_FORCE === "true";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    throw new Error(`Invalid issue date: ${issueDate}. Expected YYYY-MM-DD.`);
  }

  const publicIssuePath = join(CONTENT_DIR, `${issueDate}.md`);
  if (existsSync(publicIssuePath) && !shouldForce) {
    console.log(`AI News issue already exists: ${publicIssuePath}`);
    return;
  }

  mkdirSync(CONTENT_DIR, { recursive: true });
  mkdirSync(INTERNAL_LOG_DIR, { recursive: true });

  const feeds = await fetchFeeds();
  const candidates = [
    ...extractXItems(feeds.xFeed),
    ...extractPodcastItems(feeds.podcastFeed),
    ...extractBlogItems(feeds.blogFeed),
  ];
  const scoredCandidates = candidates.map(scoreCandidate);
  const selectedItems = selectItems(scoredCandidates);

  if (selectedItems.length < 5) {
    throw new Error(`Only selected ${selectedItems.length} items. Expected at least 5.`);
  }

  writeFileSync(publicIssuePath, buildPublicIssue(issueDate, selectedItems), "utf8");
  writeFileSync(
    join(INTERNAL_LOG_DIR, `${issueDate}.md`),
    buildInternalLog(issueDate, selectedItems, scoredCandidates, feeds),
    "utf8",
  );

  console.log(`Generated public AI News issue: ${publicIssuePath}`);
  console.log(`Generated internal AI News log: ${join(INTERNAL_LOG_DIR, `${issueDate}.md`)}`);
};

await main();
