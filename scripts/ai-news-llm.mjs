const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

/** Build the OpenAI-compatible Responses API URL.
 * @returns {string} Responses API endpoint.
 */
const getResponsesUrl = () => {
  const baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL;
  return `${baseUrl.replace(/\/$/, "")}/responses`;
};

/** Shorten source text before sending candidates to the model.
 * @param {string} text - Raw candidate text.
 * @param {number} maxLength - Maximum characters to keep.
 * @returns {string} Truncated text.
 */
const truncateText = (text, maxLength) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

/** Escape double quotes in YAML frontmatter values.
 * @param {string} value - Raw string.
 * @returns {string} YAML-safe string.
 */
const escapeYamlString = (value) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/** Extract text from a raw Responses API payload.
 * @param {object} responseBody - Raw OpenAI response body.
 * @returns {string} Model output text.
 */
const extractResponseText = (responseBody) => {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

  const outputItems = Array.isArray(responseBody.output) ? responseBody.output : [];
  return outputItems
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((contentItem) => contentItem.text ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
};

/** Parse a JSON object from model output.
 * @param {string} text - Model output.
 * @returns {object} Parsed JSON object.
 */
const parseJsonOutput = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("OpenAI response did not contain JSON.");
    }
    return JSON.parse(match[0]);
  }
};

/** Build the compact candidate list sent to the model.
 * @param {Array<object>} scoredCandidates - Candidates with deterministic scores.
 * @returns {Array<object>} Candidate payload.
 */
const buildCandidatePayload = (scoredCandidates) =>
  scoredCandidates
    .sort((left, right) => right.score - left.score)
    .slice(0, 32)
    .map((candidate) => ({
      id: candidate.id,
      type: candidate.type,
      sourceLabel: candidate.sourceLabel,
      sourceName: candidate.sourceName,
      url: candidate.url,
      publishedAt: candidate.publishedAt,
      deterministicScore: candidate.score,
      deterministicCategories: candidate.categories,
      deterministicDropReasons: candidate.dropReasons,
      engagement: candidate.engagement,
      text: truncateText(candidate.text, candidate.type === "podcast" ? 1800 : 900),
    }));

/** Build the prompt for AI News selection and writing.
 * @param {string} issueDate - Issue date in YYYY-MM-DD.
 * @param {Array<object>} candidates - Candidate payload.
 * @returns {string} Prompt text.
 */
const buildPrompt = (issueDate, candidates) => `你是 charles-cheng.com 的 AI News 编辑。

目标：每天给一线 builder 做 AI 信息流，不追营销号，不搬运大厂通稿，优先观察真正正在使用或建设 AI 产品的人。

今天日期：${issueDate}

消息源规则：
- “正在做 AI 产品的人”指：在建设 AI 产品、Agent、Coding Tool、AI Infra、模型平台、开发者工具，或直接把 AI 放进真实工作流的人。
- “一线 AI Infra / Agent / Coding Tool 开发者”指：发布过产品/API/源码/架构细节/工作流复盘/评测/失败分析，且信息来自一手实践，不只是二手评论。
- 可以采用官方账号的信息，但如果同一事件有 builder 或产品负责人原始解释，优先选 builder。
- 丢弃营销号、纯转发、情绪表达、没有上下文的回复、只有宣传但没有新信息的内容。

选稿规则：
- 从候选里选 5-10 条。每条必须保留原链接。
- 对重复事件做聚类，只保留最有信息量的一条。
- 每条评分 0-10。低于 6 分的进入内部 discarded，不进入公开 News。
- 评分维度：原始来源、真实 builder 行为、对工程/产品/工作流决策的帮助、新信息密度、是否能沉淀为周度长文判断。

公开稿格式要求：
- 不出现“今日丢弃”。
- 每条有一个中文标题、原链接、100-300 字中文简介。
- 简介必须同时回答：发生了什么、为什么重要、我的判断。
- 语言要直接、克制、有判断，不要广告腔，不要标题党。

请只输出 JSON，不要 Markdown，不要解释。JSON 结构：
{
  "dailyJudgment": "两段以内的中文总体判断",
  "tags": ["AI News", "AI", "Agent", "Builder"],
  "selected": [
    {
      "id": "候选 id，必须来自输入",
      "score": 8,
      "title": "中文标题",
      "sourceLabel": "来源显示名",
      "sourceUrl": "原链接",
      "categories": ["Agent Workflow"],
      "whySelected": "内部选中理由",
      "summary": "100-300 字中文简介"
    }
  ],
  "discarded": [
    {
      "id": "候选 id，必须来自输入",
      "score": 4,
      "reason": "丢弃原因"
    }
  ]
}

候选 JSON：
${JSON.stringify(candidates, null, 2)}
`;

/** Call OpenAI Responses API for the AI News issue.
 * @param {object} params - Generation parameters.
 * @param {string} params.issueDate - Issue date.
 * @param {Array<object>} params.scoredCandidates - Candidates with deterministic scores.
 * @returns {Promise<object>} Parsed AI News JSON.
 */
export const generateLlmIssue = async ({ issueDate, scoredCandidates }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const candidates = buildCandidatePayload(scoredCandidates);
  const response = await fetch(getResponsesUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: buildPrompt(issueDate, candidates),
      max_output_tokens: 7000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorSummary = "unknown_error";
    try {
      const errorBody = JSON.parse(errorText);
      errorSummary = errorBody.error?.code || errorBody.error?.type || errorSummary;
    } catch {
      errorSummary = "unparseable_error";
    }
    throw new Error(`OpenAI Responses API failed: ${response.status} ${errorSummary}`);
  }

  const responseBody = await response.json();
  return validateLlmIssue(parseJsonOutput(extractResponseText(responseBody)), scoredCandidates);
};

/** Validate model output and normalize selected source metadata.
 * @param {object} issue - Parsed model issue.
 * @param {Array<object>} scoredCandidates - Source candidates.
 * @returns {object} Validated issue.
 */
const validateLlmIssue = (issue, scoredCandidates) => {
  const candidateById = new Map(scoredCandidates.map((candidate) => [candidate.id, candidate]));
  const selected = Array.isArray(issue.selected) ? issue.selected : [];
  const discarded = Array.isArray(issue.discarded) ? issue.discarded : [];

  if (selected.length < 5 || selected.length > 10) {
    throw new Error(`OpenAI selected ${selected.length} items. Expected 5-10.`);
  }

  const normalizedSelected = selected.map((item) => {
    const candidate = candidateById.get(item.id);
    if (!candidate) {
      throw new Error(`OpenAI selected unknown candidate id: ${item.id}`);
    }

    return {
      ...item,
      score: Number(item.score ?? candidate.score),
      sourceLabel: item.sourceLabel || candidate.sourceLabel,
      sourceUrl: item.sourceUrl || candidate.url,
      categories: Array.isArray(item.categories) ? item.categories : candidate.categories,
      summary: String(item.summary ?? "").trim(),
      title: String(item.title ?? "").trim(),
      candidate,
    };
  });

  for (const item of normalizedSelected) {
    if (!item.title || !item.summary || !item.sourceUrl) {
      throw new Error(`OpenAI returned incomplete selected item: ${item.id}`);
    }
  }

  return {
    dailyJudgment: String(issue.dailyJudgment ?? "").trim(),
    tags: Array.isArray(issue.tags) && issue.tags.length > 0 ? issue.tags : ["AI News", "AI", "Agent", "Builder"],
    selected: normalizedSelected,
    discarded,
  };
};

/** Build public Markdown from an LLM issue.
 * @param {string} issueDate - Issue date.
 * @param {object} issue - LLM issue JSON.
 * @param {number} issueNumber - Daily issue number.
 * @returns {string} Public Markdown.
 */
export const buildLlmPublicIssue = (issueDate, issue, issueNumber) => {
  const slugPrefix = issueDate.replaceAll("-", "");
  const insights = issue.selected.map((item, index) => ({
    ...item,
    anchor: `${slugPrefix}-${String(index + 1).padStart(2, "0")}`,
  }));
  const focusTags = Array.from(new Set(insights.flatMap((item) => item.categories))).slice(0, 4);
  const description = `今天的 AI News 聚焦 ${focusTags.join("、") || "AI builder 一线动态"}。`;
  const tableOfContents = insights.map((item) => `- [${item.title}](#${item.anchor})`).join("\n");
  const body = insights
    .map(
      (item, index) => `<a id="${item.anchor}"></a>

### ${index + 1}. ${item.title}

[查看原文](${item.sourceUrl}) · 来源：${item.sourceLabel}

${item.summary}`,
    )
    .join("\n\n");

  return `---
title: "AI News｜${issueDate}"
description: "${escapeYamlString(description)}"
date: ${issueDate}
tags: ${JSON.stringify(issue.tags)}
draft: false
issue: ${issueNumber}
sourceCount: ${insights.length}
---

## 今日目录

${tableOfContents}

## 今日判断

${issue.dailyJudgment}

## 快讯

${body}
`;
};

/** Build the private internal LLM selection log.
 * @param {string} issueDate - Issue date.
 * @param {object} issue - LLM issue JSON.
 * @param {Array<object>} scoredCandidates - Source candidates.
 * @param {object} feeds - Source feed payloads.
 * @returns {string} Internal Markdown log.
 */
export const buildLlmInternalLog = (issueDate, issue, scoredCandidates, feeds) => {
  const selectedIds = new Set(issue.selected.map((item) => item.id));
  const selectedLog = issue.selected
    .map((item) => `- ${item.score}｜${item.sourceLabel}｜${item.categories.join(", ")}\n  ${item.sourceUrl}\n  ${item.whySelected}\n  ${item.summary}`)
    .join("\n\n");
  const discardedFromModel = issue.discarded
    .map((item) => `- ${item.score ?? "n/a"}｜${item.id}\n  ${item.reason}`)
    .join("\n\n");
  const deterministicRemainder = scoredCandidates
    .filter((candidate) => !selectedIds.has(candidate.id))
    .sort((left, right) => right.score - left.score)
    .slice(0, 20)
    .map((item) => `- ${item.score}｜${item.sourceLabel}\n  ${item.url}\n  ${item.text.slice(0, 220)}`)
    .join("\n\n");

  return `# AI News Internal Log｜${issueDate}

## Mode

LLM selection and writing via OpenAI Responses API.

## Feed Snapshot

- X feed generated at: ${feeds.xFeed.generatedAt ?? "unknown"}
- Podcast feed generated at: ${feeds.podcastFeed.generatedAt ?? "unknown"}
- Blog feed generated at: ${feeds.blogFeed.generatedAt ?? "unknown"}
- Candidate count: ${scoredCandidates.length}
- Selected count: ${issue.selected.length}

## Selected

${selectedLog}

## Discarded By LLM

${discardedFromModel || "None"}

## Deterministic Remainder

${deterministicRemainder}
`;
};
