#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const DEFAULT_NOTIFY_TO = "chengxisheng777@gmail.com";
const DEFAULT_SITE_URL = "https://charles-cheng.com";
const DEFAULT_FROM = "AI News <onboarding@resend.dev>";

/** Run a git command and return trimmed stdout. */
const runGit = (args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

/** Parse a minimal Markdown frontmatter block without adding YAML dependencies. */
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

/** Escape text before embedding it in a minimal HTML email. */
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Return AI News Markdown files changed in the current commit. */
const getChangedIssuePaths = () => {
  const explicitPath = process.env.AI_NEWS_ISSUE_PATH;
  if (explicitPath) {
    return [explicitPath];
  }

  const commitSha = process.env.GITHUB_SHA || "HEAD";
  const diffOutput = runGit([
    "diff-tree",
    "--root",
    "--no-commit-id",
    "--name-status",
    "-r",
    commitSha,
  ]);

  return diffOutput
    .split("\n")
    .map((line) => line.trim().split(/\s+/).slice(1).join(" "))
    .filter((filePath) => /^src\/content\/ai-news\/.+\.md$/.test(filePath))
    .filter((filePath) => !filePath.endsWith("_template.md"));
};

/** Build issue metadata from changed Markdown files. */
const getPublishedIssues = () => {
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;

  return getChangedIssuePaths()
    .map((filePath) => {
      const absolutePath = resolve(process.cwd(), filePath);
      if (!existsSync(absolutePath)) {
        return null;
      }

      const content = readFileSync(absolutePath, "utf8");
      const frontmatter = parseFrontmatter(content);
      if (frontmatter.draft === "true") {
        return null;
      }

      const slug = basename(filePath, ".md");
      return {
        title: frontmatter.title || `AI News | ${slug}`,
        description: frontmatter.description || "AI News has been published.",
        date: frontmatter.date || slug,
        sourceCount: frontmatter.sourceCount || "unknown",
        filePath,
        url: `${siteUrl.replace(/\/$/, "")}/ai-news/${slug}`,
      };
    })
    .filter(Boolean);
};

/** Send an email through Resend.
 * @param {{subject: string, text: string, html: string}} emailPayload - Email content.
 * @returns {Promise<void>} Resolves after Resend accepts the email.
 */
const sendEmailPayload = async ({ subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY is not configured. Skipping email notification.");
    return;
  }

  const fromEmail = process.env.AI_NEWS_EMAIL_FROM || DEFAULT_FROM;
  const toEmail = process.env.AI_NEWS_NOTIFY_TO || DEFAULT_NOTIFY_TO;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${errorText}`);
  }

  console.log(`AI News notification sent to ${toEmail}.`);
};

/** Send the publication notification email through Resend.
 * @param {Array<object>} issues - Published AI News issues.
 * @returns {Promise<void>} Resolves after the notification is sent.
 */
const sendPublicationEmail = async (issues) => {
  const repository = process.env.GITHUB_REPOSITORY || "";
  const commitSha = process.env.AI_NEWS_COMMIT_SHA || process.env.GITHUB_SHA || "";
  const commitUrl =
    repository && commitSha ? `https://github.com/${repository}/commit/${commitSha}` : "";
  const firstIssue = issues[0];
  const subject =
    issues.length === 1
      ? `AI News published: ${firstIssue.date}`
      : `AI News published: ${issues.length} issues`;
  const issueLines = issues
    .map(
      (issue) =>
        `- ${issue.title}\n  URL: ${issue.url}\n  File: ${issue.filePath}\n  Sources: ${issue.sourceCount}`,
    )
    .join("\n\n");
  const text = [
    "AI News has been pushed to the website repository.",
    "",
    issueLines,
    "",
    commitUrl ? `Commit: ${commitUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const htmlIssues = issues
    .map(
      (issue) => `
        <li>
          <p><strong>${escapeHtml(issue.title)}</strong></p>
          <p>${escapeHtml(issue.description)}</p>
          <p><a href="${escapeHtml(issue.url)}">${escapeHtml(issue.url)}</a></p>
          <p>File: <code>${escapeHtml(issue.filePath)}</code></p>
          <p>Sources: ${escapeHtml(issue.sourceCount)}</p>
        </li>
      `,
    )
    .join("");
  const html = `
    <p>AI News has been pushed to the website repository.</p>
    <ul>${htmlIssues}</ul>
    ${commitUrl ? `<p>Commit: <a href="${escapeHtml(commitUrl)}">${escapeHtml(commitSha.slice(0, 7))}</a></p>` : ""}
  `;

  await sendEmailPayload({ subject, text, html });
};

/** Send a failure notification email through Resend.
 * @returns {Promise<void>} Resolves after the notification is sent.
 */
const sendFailureEmail = async () => {
  const runUrl = process.env.AI_NEWS_FAILURE_RUN_URL || "";
  const message = process.env.AI_NEWS_FAILURE_MESSAGE || "AI News generation failed.";
  const date = new Date().toISOString().split("T")[0];
  const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const subject = `AI News generation failed: ${date}`;
  const text = [
    message,
    "",
    runUrl ? `Run: ${runUrl}` : "",
    `Site: ${siteUrl}/ai-news`,
  ]
    .filter(Boolean)
    .join("\n");
  const html = `
    <p>${escapeHtml(message)}</p>
    ${runUrl ? `<p>Run: <a href="${escapeHtml(runUrl)}">${escapeHtml(runUrl)}</a></p>` : ""}
    <p>Site: <a href="${escapeHtml(`${siteUrl}/ai-news`)}">${escapeHtml(`${siteUrl}/ai-news`)}</a></p>
  `;

  await sendEmailPayload({ subject, text, html });
};

if (process.env.AI_NEWS_FAILURE_EMAIL === "true") {
  await sendFailureEmail();
} else {
  const issues =
    process.env.AI_NEWS_TEST_EMAIL === "true"
      ? [
          {
            title: "AI News notification test",
            description: "This is a test email from the AI News GitHub Actions workflow.",
            date: new Date().toISOString().split("T")[0],
            sourceCount: "test",
            filePath: "workflow_dispatch",
            url: `${(process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "")}/ai-news`,
          },
        ]
      : getPublishedIssues();

  if (issues.length === 0) {
    console.log("No published AI News issue changed. Skipping notification.");
    process.exit(0);
  }

  await sendPublicationEmail(issues);
}
