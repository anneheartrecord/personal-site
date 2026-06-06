#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const DEFAULT_NOTIFY_TO = "chenxisheng777@gmail.com";
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

/** Send the publication notification email through Resend. */
const sendEmail = async (issues) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY is not configured. Skipping email notification.");
    return;
  }

  const fromEmail = process.env.AI_NEWS_EMAIL_FROM || DEFAULT_FROM;
  const toEmail = process.env.AI_NEWS_NOTIFY_TO || DEFAULT_NOTIFY_TO;
  const repository = process.env.GITHUB_REPOSITORY || "";
  const commitSha = process.env.GITHUB_SHA || "";
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
          <p><strong>${issue.title}</strong></p>
          <p>${issue.description}</p>
          <p><a href="${issue.url}">${issue.url}</a></p>
          <p>File: <code>${issue.filePath}</code></p>
          <p>Sources: ${issue.sourceCount}</p>
        </li>
      `,
    )
    .join("");

  const html = `
    <p>AI News has been pushed to the website repository.</p>
    <ul>${htmlIssues}</ul>
    ${commitUrl ? `<p>Commit: <a href="${commitUrl}">${commitSha.slice(0, 7)}</a></p>` : ""}
  `;

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

await sendEmail(issues);
