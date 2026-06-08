#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const DEFAULT_SITE_URL = "https://charles-cheng.com";
const KIT_API_BASE_URL = "https://api.kit.com/v4";

/** Escape text before inserting it into HTML.
 * @param {string} value - Raw text.
 * @returns {string} HTML-safe text.
 */
const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Parse a minimal Markdown frontmatter block.
 * @param {string} content - Markdown content.
 * @returns {Record<string, string>} Parsed frontmatter values.
 */
const parseFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    frontmatter[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return frontmatter;
};

/** Remove Markdown frontmatter from an issue.
 * @param {string} content - Markdown content.
 * @returns {string} Markdown without frontmatter.
 */
const stripFrontmatter = (content) => content.replace(/^---\n[\s\S]*?\n---\n?/, "");

/** Convert a small AI News Markdown subset into email-safe HTML.
 * @param {string} markdown - AI News Markdown body.
 * @returns {string} HTML content.
 */
const markdownToHtml = (markdown) => {
  const lines = markdown.split("\n");
  const htmlParts = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    htmlParts.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("<a id=")) {
      flushList();
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      htmlParts.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`);
      continue;
    }

    const linkOnly = line.match(/^\[([^\]]+)\]\(([^)]+)\)(.*)$/);
    if (linkOnly) {
      flushList();
      htmlParts.push(
        `<p><a href="${escapeHtml(linkOnly[2])}">${escapeHtml(linkOnly[1])}</a>${escapeHtml(linkOnly[3])}</p>`,
      );
      continue;
    }

    const listItem = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)$/);
    if (listItem) {
      listItems.push(`<a href="${escapeHtml(listItem[2])}">${escapeHtml(listItem[1])}</a>`);
      continue;
    }

    flushList();
    htmlParts.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushList();
  return htmlParts.join("\n");
};

/** Read the AI News issue path from env and return normalized metadata.
 * @returns {{title: string, description: string, date: string, url: string, html: string}} Issue payload.
 */
const readIssue = () => {
  const issuePath = process.env.AI_NEWS_ISSUE_PATH;
  if (!issuePath) {
    throw new Error("AI_NEWS_ISSUE_PATH is required.");
  }

  const absolutePath = resolve(process.cwd(), issuePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`AI News issue does not exist: ${issuePath}`);
  }

  const content = readFileSync(absolutePath, "utf8");
  const frontmatter = parseFrontmatter(content);
  if (frontmatter.draft === "true") {
    throw new Error(`AI News issue is still draft: ${issuePath}`);
  }

  const slug = basename(issuePath, ".md");
  const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const issueUrl = `${siteUrl}/ai-news/${slug}`;
  const issueTitle = frontmatter.title || `AI News | ${slug}`;
  const issueDescription = frontmatter.description || "Daily AI News for builders.";
  const bodyHtml = markdownToHtml(stripFrontmatter(content));
  const html = `
    <p><strong>${escapeHtml(issueTitle)}</strong></p>
    <p>${escapeHtml(issueDescription)}</p>
    <p><a href="${escapeHtml(issueUrl)}">Read this issue on the web</a></p>
    ${bodyHtml}
  `;

  return {
    title: issueTitle,
    description: issueDescription,
    date: frontmatter.date || slug,
    url: issueUrl,
    html,
  };
};

/** Create or schedule a Kit broadcast for the issue.
 * @param {{title: string, description: string, date: string, url: string, html: string}} issue - Issue payload.
 * @returns {Promise<void>} Resolves after Kit accepts the broadcast.
 */
const createBroadcast = async (issue) => {
  const apiKey = process.env.KIT_V4_API_KEY;
  if (!apiKey) {
    console.log("KIT_V4_API_KEY is not configured. Skipping Kit subscriber broadcast.");
    return;
  }

  const sendAt =
    process.env.KIT_BROADCAST_SEND_AT ||
    new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const subject = process.env.KIT_BROADCAST_SUBJECT || issue.title;
  const payload = {
    subject,
    preview_text: issue.description,
    description: issue.description,
    content: issue.html,
    public: true,
    published_at: new Date(`${issue.date}T00:00:00+08:00`).toISOString(),
    send_at: sendAt,
  };

  const senderEmail = process.env.KIT_BROADCAST_FROM_EMAIL;
  if (senderEmail) {
    payload.email_address = senderEmail;
  }

  const templateId = Number(process.env.KIT_BROADCAST_TEMPLATE_ID || "");
  if (Number.isInteger(templateId) && templateId > 0) {
    payload.email_template_id = templateId;
  }

  const response = await fetch(`${KIT_API_BASE_URL}/broadcasts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Kit broadcast failed: ${response.status} ${errorBody}`);
  }

  const result = await response.json();
  console.log(
    JSON.stringify(
      {
        broadcastId: result.id,
        subject: result.subject,
        sendAt: result.send_at,
        public: result.public,
        issueUrl: issue.url,
      },
      null,
      2,
    ),
  );
};

await createBroadcast(readIssue());
