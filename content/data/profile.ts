/**
 * Profile 单例数据（结构化 TS，基线 §7）。
 * 由 src/domains/profile 的 repository 经 profileSchema 校验后消费。非发布物。
 */
export const profile = {
  name: "戴文恺",
  title: "AI Agent 工程师 / FDE / AI 全栈",
  bio: "AI Agent 全栈工程师，兼具云网络运维智能化与安全平台研发经验，擅长把生产级 Agent 从 0 建到 1。",
  story:
    "我从华为的 Java 后端与安全平台一路走来，如今在阿里云做云网络的 Agent 工程师，主导从 0→1 建设生产级运维智能体与统一告警平台——覆盖工具调用权限控制、日志与 SQL 诊断、告警聚合降噪与异步高并发处理。我习惯用契约约束输入输出、用 ReAct 循环建模推理、用公开写作倒逼自己想清楚。Cogniflux 就是这段实践的公开记录。",
  skills: [
    { group: "AI 与 Agent", items: ["大模型应用开发", "ReAct Loop", "Function Call", "MCP", "RAG", "vLLM 本地部署"] },
    { group: "后端与云原生", items: ["Java/Spring", "Python/FastAPI", "Kubernetes/Docker", "CI/CD"] },
    { group: "前端与内容", items: ["React", "Vue", "TypeScript", "MDX 内容管线"] },
  ],
  socials: [
    { platform: "GitHub", url: "https://github.com/Amorkriz" },
    { platform: "Email", url: "mailto:amored.chr@gmail.com" },
  ],
  avatar: "/images/avatar.png",
} as const;
