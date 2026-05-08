export interface Project {
  name: string;
  description: string;
  url: string;
  github?: string;
  tags: string[];
}

export const projects: Project[] = [
  {
    name: "talk-mbti",
    description:
      "对话式 MBTI 人格分析 —— 没有一道选择题，打开就是聊天。心理学里的社会期许偏差（Social Desirability Bias）告诉我们，人填问卷时会无意识地美化自己。talk-mbti 换了个思路：通过自然对话，从你的措辞、第一反应、决策逻辑里提取真实的行为信号，聊完直接生成四维度百分比、认知功能栈、超能力和成长盲区的完整报告。基于 Gemini 2.0 Flash 驱动，Cloudflare AI Gateway 代理，国内无需梯子可用。",
    url: "https://mbti.charles-cheng.com",
    github: "https://github.com/anneheartrecord/talk-mbti",
    tags: ["AI", "MBTI", "Prompt"],
  },
  {
    name: "hermes-agent-anatomy",
    description:
      "Hermes Agent 源码解剖 —— NousResearch/hermes-agent 是一个 33 万行 Python 代码的开源 AI Agent 框架，从 CLI 交互到 11 平台消息网关到 RL 训练数据采集，全部内置在一个单体仓库里。这个项目是对其源码的系统化技术分析，逐模块拆解，写了 8 篇技术文档，配有大量手绘风格技术插图。从 Agent 核心循环、Tool Registry、多 Provider 适配到上下文压缩、消息网关、Memory 与 RL 训练。最后一篇将 Hermes Agent、OpenClaw、Claude Code 三个框架放在一起做了 13 个维度的对比。",
    url: "https://anneheartrecord.github.io/hermes-agent-anatomy/",
    github: "https://github.com/anneheartrecord/hermes-agent-anatomy",
    tags: ["AI Agent", "源码解析", "Hermes"],
  },
  {
    name: "claude-code-docs",
    description:
      "Claude Code 源码解剖 —— 2026 年 3 月 Anthropic 意外泄露了 Claude Code 的完整 TypeScript 源码（51.5 万行）。我对这份源码做了系统化的技术分析，逐模块拆解，写了 13 篇技术文档（中英双语）。从架构设计到 Agent 循环的六阶段实现，从三层消息压缩体系到 6,300 行的权限系统，从五层记忆加载到 40+ 工具的执行流水线。同时从 82 个 feature flag 里挖出了 Anthropic 尚未发布的功能蓝图。",
    url: "https://anneheartrecord.github.io/claude-code-docs/",
    github: "https://github.com/anneheartrecord/claude-code-docs",
    tags: ["Claude Code", "源码解析", "AI Agent"],
  },
  {
    name: "claude-code-config",
    description:
      "Claude Code 配置最佳实践 —— 装完 Claude Code，第一件事找别人的配置抄。settings.json、CLAUDE.md、Skills、MCP、Hooks 五个维度组合空间巨大，官方文档只告诉你每个选项是什么意思，不告诉你怎么配才好用。这份配置经过实战验证，一行命令安装，覆盖权限策略、安全兜底规则、效率优化等方面。从能用到好用，中间差的就是一份靠谱的配置。",
    url: "https://github.com/anneheartrecord/claude-code-config",
    github: "https://github.com/anneheartrecord/claude-code-config",
    tags: ["Claude Code", "配置", "最佳实践"],
  },
];
