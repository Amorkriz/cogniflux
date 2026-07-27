/**
 * Profile 单例数据（结构化 TS，基线 §7）。
 * 由 src/domains/profile 的 repository 经 profileSchema 校验后消费。非发布物。
 */
export const profile = {
  name: "林深",
  title: "Java 工程师 → AI Agent 开发者",
  bio: "十年 Java 后端出身，正把服务治理与工程化经验迁移到 AI Agent 的构建中。",
  story:
    "从电商交易系统的高并发一线走来，我习惯用契约、可观测与小步演进来对抗复杂度。如今我把同样的方法论带到 Agent 开发：用 schema 约束输入输出，用状态机建模推理过程，用公开写作倒逼自己想清楚。Cogniflux 就是这段转型的公开实验场。",
  skills: [
    { group: "后端工程", items: ["Java", "Spring", "分布式", "服务治理"] },
    { group: "AI 与 Agent", items: ["Prompt 工程", "工具调用", "多 Agent 编排"] },
    { group: "前端与内容", items: ["TypeScript", "React Router", "MDX 内容管线"] },
  ],
  socials: [
    { platform: "GitHub", url: "https://github.com/example" },
    { platform: "Email", url: "mailto:hi@cogniflux.example.com" },
  ],
  avatar: "/images/avatar.png",
} as const;
