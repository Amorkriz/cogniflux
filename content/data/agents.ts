/**
 * Agents 种子数据（结构化 TS，基线 §7）。
 * 由 src/domains/agents 的 repository 经 agentSchema 校验后消费。
 */
export const agents = [
  {
    slug: "refactor-navigator",
    title: "重构领航员",
    summary:
      "面向遗留 Java 系统的重构助手：读取调用链与测试覆盖，给出小步安全重构路径与回归风险提示。",
    status: "published",
    createdAt: "2026-07-12",
    tags: ["refactor", "java", "agent"],
    featured: true,
    featuredOrder: 2,
    role: "遗留系统重构顾问",
    capabilities: [
      "识别坏味道并按影响面排序",
      "生成小步重构计划与对应测试补全建议",
      "评估改动的回归风险等级",
    ],
    stack: ["TypeScript", "AST 分析", "工具调用"],
    agentStatus: "building",
    demo: { type: "link", src: "https://cogniflux.example.com/agents/refactor-navigator" },
    related: [{ kind: "project", slug: "flux-agent-runtime" }],
  },
  {
    slug: "pr-reviewer",
    title: "PR 评审搭子",
    summary:
      "拉取 PR 差异做首轮评审：聚焦并发/事务/空指针等 Java 常见坑，输出可执行的修改建议。",
    status: "published",
    createdAt: "2026-07-20",
    tags: ["code-review", "agent"],
    role: "代码评审助手",
    capabilities: ["差异摘要", "风险点标注", "给出可复制的修改片段"],
    stack: ["TypeScript", "Git Diff", "规则引擎"],
    agentStatus: "usable",
    related: [],
  },
] as const;
