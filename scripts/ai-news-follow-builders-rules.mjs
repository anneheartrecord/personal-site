export const IMPORTANT_PATTERNS = [
  { name: "Coding Agent", pattern: /codex|claude code|coding agent|cowork|cursor|devin/i, weight: 32 },
  { name: "Agent Workflow", pattern: /agent|agents|workflow|plan mode|prompt|memory|context|skill/i, weight: 22 },
  { name: "AI Infra", pattern: /infra|api|mcp|model context protocol|eval|benchmark|latency|token/i, weight: 18 },
  { name: "Product Shift", pattern: /figma|saas|product|design|builder|software|prototype/i, weight: 16 },
  { name: "Model", pattern: /model|llm|gpt|claude|gemini|openai|anthropic/i, weight: 14 },
  { name: "Enterprise", pattern: /enterprise|business|company|org|team|customer/i, weight: 10 },
];

export const DROP_PATTERNS = [
  { reason: "纯回复，缺少独立上下文", pattern: /^@/ },
  { reason: "个人闲聊或活动花絮", pattern: /lmao|cheeky|pills|party|shirt|merch/i },
  { reason: "只有称赞，没有具体信息", pattern: /^incredible work\b|^great work\b|^love this\b/i },
];

/** Normalize text for deterministic topic fallback keys.
 * @param {string} text - Raw candidate text.
 * @returns {string} Normalized text.
 */
const normalizeTopicText = (text) => text.replace(/\s+/g, " ").trim().toLowerCase();

/** Create a topic-level deduplication key for a candidate.
 * @param {object} candidate - Candidate item.
 * @returns {string} Stable topic key.
 */
export const createTopicKey = (candidate) => {
  const lowerText = candidate.text.toLowerCase();
  if (lowerText.includes("cowork") || lowerText.includes("usage limits")) {
    return "claude-cowork";
  }
  if (lowerText.includes("skills api") || lowerText.includes("build ai skills")) {
    return "agent-skills";
  }
  if (lowerText.includes("filesystem") || lowerText.includes("file system")) {
    return "agent-filesystem";
  }
  if (lowerText.includes("plan mode")) {
    return "prompt-framing";
  }
  if (lowerText.includes("codex")) {
    return "codex";
  }
  if (lowerText.includes("memory") || lowerText.includes("shorter prompts")) {
    return "agent-memory";
  }
  if (lowerText.includes("saas apocalypse") || lowerText.includes("figma")) {
    return "figma-saas";
  }
  if (lowerText.includes("human engineers") || lowerText.includes("overseeing")) {
    return "agent-oversight";
  }
  if (lowerText.includes("design") && lowerText.includes("code")) {
    return "design-code";
  }
  if (lowerText.includes("enterprise") || lowerText.includes("business")) {
    return "enterprise-ai";
  }
  return normalizeTopicText(candidate.titleSeed).slice(0, 90);
};

/** Return a Chinese title and short judgment for a selected item.
 * @param {object} item - Selected item.
 * @returns {{title: string, summary: string}} Public-facing insight.
 */
export const createInsight = (item) => {
  const lowerText = item.text.toLowerCase();

  if (lowerText.includes("plan mode")) {
    return {
      title: "把任务写成问题，比固定 plan mode 更能触发模型反驳",
      summary:
        "Swyx 提到一个很实用的提示方式：不要只把任务包装成“按计划执行”，而是把任务改写成问题，让模型有机会质疑假设、指出替代方案。这个点对 builder 很有价值，因为很多 AI 编程失败不是模型不会做，而是人把需求说死了。把 prompt 变成可讨论的问题，本质上是在给 agent 预留纠偏空间。",
    };
  }

  if (lowerText.includes("cowork") || lowerText.includes("usage limits")) {
    return {
      title: "Claude Cowork 加码长任务，用量限制本身成为产品信号",
      summary:
        "Claude Cowork 把使用额度临时提高，Boris Cherny 的解释集中在“大而乱”的工作：跨账号研究、周期报告、邮件分拣和草稿。这里值得看的不是单纯促销，而是 Anthropic 正在把 AI 从聊天入口推向可托付任务。对个人网站的 AI News 来说，这类变化应该重点追踪：agent 产品竞争会越来越围绕长任务、上下文和可审查结果展开。",
    };
  }

  if (lowerText.includes("codex")) {
    return {
      title: "Codex 进入高频打磨期，采用率和细节问题同时上升",
      summary:
        "OpenAI Codex 相关 builder 提到的信号很直接：使用增长在发生，但产品细节仍有很多摩擦点。这类信息比发布稿更重要，因为它暴露的是一线使用者的真实反馈。对 coding agent 来说，下一阶段竞争不只是“能不能写代码”，而是权限、记忆、文件状态、审查体验和失败恢复这些细节能否被持续磨平。",
    };
  }

  if (lowerText.includes("skills api") || lowerText.includes("skill")) {
    return {
      title: "Skills API 继续升温，agent 能力开始从 prompt 迁移到可复用技能",
      summary:
        `${item.sourceLabel} 关注 AI skills，说明 agent 工作流正在从一次性提示词，转向可复用、可组合、可管理的技能层。这个方向对 builder 很关键：真正可规模化的 agent 不是每次靠长 prompt 硬撑，而是把常用操作沉淀成稳定接口和能力包。后面需要持续观察各家是否会围绕 skill、MCP、文件系统和权限模型形成事实标准。`,
    };
  }

  if (lowerText.includes("filesystem") || lowerText.includes("file system")) {
    return {
      title: "Agent 需要持久化文件系统状态，而不是只依赖聊天上下文",
      summary:
        "Rauch 提到 agent 的文件系统状态，这个点很底层，但重要。很多 agent 失败不是因为模型推理差，而是工作状态无法稳定保存、恢复和审计。对开发者工具来说，文件、任务、日志、依赖和中间产物都应该成为 agent 可操作的工作区。谁能把这层状态管理做好，谁就更接近真正可用的工程 agent。",
    };
  }

  if (lowerText.includes("saas apocalypse") || lowerText.includes("figma")) {
    return {
      title: "Figma 视角下的 SaaS 变化：软件不会消失，软件供给会被放大",
      summary:
        "Every 采访 Figma 的 Matt Colyer，核心不是“AI 杀死 SaaS”，而是软件生产者数量会被大幅放大。Figma 既要开放给 agent，也要把自己的产品能力嵌入 AI 工作流。这个判断适合放进周度长文继续展开：AI 让更多人能造软件后，SaaS 的护城河会从功能本身转向协作、上下文、数据和维护能力。",
    };
  }

  if (lowerText.includes("human engineers") || lowerText.includes("overseeing")) {
    return {
      title: "Coding agent 越强，人类工程师越要回到审查和系统边界",
      summary:
        "Aaron Levie 的观点指向一个现实变化：coding agent 能承担更多实现工作后，人类工程师的价值会更多落在需求拆解、架构边界、代码审查和风险控制上。这个方向值得持续看，因为它会改变团队分工。未来的工程能力不只是写代码速度，而是判断哪些工作可以交给 agent、哪些必须由人兜底。",
    };
  }

  if (lowerText.includes("memory") || lowerText.includes("shorter prompts")) {
    return {
      title: "更好的记忆可能比更长的 prompt 更重要",
      summary:
        "Thibault Sottiaux 提到更短 prompt 与更好记忆的方向，这和最近 agent 产品的演进一致。单纯把上下文塞长，会让系统成本、噪声和失败面一起变大；如果记忆能结构化沉淀，agent 才能在多次任务之间继承真实经验。对个人工作流来说，应该优先沉淀项目约束、偏好和复盘，而不是每次重新写一大段提示词。",
    };
  }

  if (lowerText.includes("design") || lowerText.includes("code")) {
    return {
      title: "设计与代码边界继续变薄，原型越来越接近可运行系统",
      summary:
        "Ryo Lu 讨论设计与代码的关系，背后是 AI 工具正在压缩“想法、设计、实现”之间的距离。对 builder 来说，这不是简单替代设计师或工程师，而是让更早期的产品判断可以用可运行原型来验证。后续值得关注的是：设计工具、代码生成工具和 agent 工作区会不会合并成同一个产品面。",
    };
  }

  if (lowerText.includes("enterprise") || lowerText.includes("business")) {
    return {
      title: "企业 AI 讨论正在从模型崇拜转向落地约束",
      summary:
        `${item.sourceLabel} 的这条信息更像一线观察：企业采用 AI 时，真正卡住的往往不是模型是否足够新，而是流程、权限、数据、审计和组织接受度。对 builder 来说，这类信号应该优先级很高，因为它决定了 AI 产品能否从 demo 进入日常系统。后续选题可以继续跟踪企业工具如何处理这些非模型问题。`,
    };
  }

  return {
    title: `${item.sourceName}：${item.categories[0] ?? "AI"} 方向出现一条一线信号`,
    summary:
      `${item.sourceLabel} 发布了一条与 ${item.categories.join("、") || "AI 产品"} 有关的更新。原文信息量不算发布稿式完整，但它来自正在使用或建设 AI 工具的一线账号，适合放进每日观察池。我的判断是：这类信号的价值在于帮助我们看到真实工作流的变化，而不是只追逐大厂公告。`,
  };
};
