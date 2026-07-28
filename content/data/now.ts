/**
 * Now 种子数据（结构化 TS，基线 §7）。
 * 由 src/domains/now 的 repository 经 nowUpdateSchema 校验后消费；每月一条，按月倒序。
 */
export const nowUpdates = [
  {
    slug: "2026-07",
    title: "2026 年 7 月：把服务治理经验迁进 Agent",
    summary: "在搭建 Cogniflux 的同时，试着把微服务的熔断/重试思路映射到 Agent 工具调用链。",
    status: "published",
    createdAt: "2026-07-01",
    date: "2026-07",
    tags: ["now"],
    focus: ["搭建个人工作台", "多 Agent 编排实验"],
    currentlyLearning: ["Agent Memory", "RAG"],
    openTo: ["AI 应用开发合作"],
    entries: [
      {
        category: "building",
        text: "从零搭建 Cogniflux：领域驱动架构 + MDX 内容管线。",
        link: "/projects/cogniflux-platform",
      },
      { category: "learning", text: "系统学习 Agent 工具调用与状态机建模。" },
      { category: "reading", text: "重读《重构（第 2 版）》，为重构领航员整理规则。" },
    ],
  },
  {
    slug: "2026-06",
    title: "2026 年 6 月：从后端到 Builder 的起点",
    summary: "决定把四年 Java 后端经验公开沉淀，用一个属于自己的站点记录转型。",
    status: "published",
    createdAt: "2026-06-01",
    date: "2026-06",
    tags: ["now"],
    focus: ["确定内容体系", "选型前端技术栈"],
    entries: [
      { category: "thinking", text: "想清楚站点的第一原则：内容与展示分离。" },
      { category: "learning", text: "补齐 React Router v8 框架模式与 Vite 生态。" },
    ],
  },
] as const;
