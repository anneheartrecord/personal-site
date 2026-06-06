import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dateArgIndex = process.argv.indexOf("--date");
const requestedDate = dateArgIndex >= 0 ? process.argv[dateArgIndex + 1] : undefined;

/** Return a local YYYY-MM-DD date for daily draft filenames. */
const formatLocalDate = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const date = requestedDate ?? formatLocalDate(new Date());
const contentDir = join(process.cwd(), "src", "content", "ai-news");
const filePath = join(contentDir, `${date}.md`);

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  throw new Error(`Invalid date: ${date}. Expected YYYY-MM-DD.`);
}

if (existsSync(filePath)) {
  console.log(`AI News draft already exists: ${filePath}`);
  process.exit(0);
}

mkdirSync(contentDir, { recursive: true });

const content = `---
title: "AI News｜${date}"
description: "今日 AI 领域 5-10 条关键动态。"
date: ${date}
tags: ["AI News", "AI", "Agent"]
draft: true
issue: 1
sourceCount: 0
---

## 今日判断

等待 AI 生成。

## 重点 3 条

### 1. 待补事件

- 原链接：
- 发生了什么：
- 为什么重要：
- 我的判断：

### 2. 待补事件

- 原链接：
- 发生了什么：
- 为什么重要：
- 我的判断：

### 3. 待补事件

- 原链接：
- 发生了什么：
- 为什么重要：
- 我的判断：

## 快讯 5-7 条

- 事件：
  原链接：
  一句话：

## 后续观察

1. 待补观察
2. 待补观察
3. 待补观察
`;

writeFileSync(filePath, content, "utf8");
console.log(`Created AI News draft: ${filePath}`);
