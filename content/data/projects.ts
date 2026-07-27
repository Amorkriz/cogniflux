/**
 * Projects 种子数据（结构化 TS，基线 §7）。
 * 由 src/domains/projects 的 repository 经 projectSchema 校验后消费。
 * 人设：Java 工程师转型 AI Agent 开发者的真实感占位内容。
 */
export const projects = [
  {
    slug: "cogniflux-platform",
    title: "Cogniflux 个人工作台",
    summary:
      "内容与展示分离的个人站点：8 栏目、MDX 内容管线、领域驱动架构，作为 AI Builder 的公开记录。",
    status: "published",
    createdAt: "2026-06-01",
    updatedAt: "2026-07-26",
    tags: ["react-router", "typescript", "mdx"],
    cover: {
      src: "/images/covers/cogniflux-platform.png",
      alt: "Cogniflux 个人工作台项目封面：深蓝紫渐变占位图",
    },
    featured: true,
    featuredOrder: 1,
    techStack: ["React Router v8", "Vite", "TypeScript", "Zod", "Tailwind CSS"],
    projectStatus: "in-progress",
    period: { start: "2026-06" },
    links: {
      repo: "https://github.com/example/cogniflux",
      demo: "https://cogniflux.example.com",
    },
    highlights: [
      "领域驱动目录：pages → domains → shared，内容只经 content-io 进入展示层",
      "构建期 Zod 校验 + Shiki 高亮，frontmatter 不合法即构建失败",
      "ContentRef 反向关联：跨内容互引在构建期成图，渲染时解析",
    ],
    related: [{ kind: "article", slug: "hello-cogniflux" }],
  },
  {
    slug: "flux-agent-runtime",
    title: "Flux Agent Runtime",
    summary:
      "面向 Java 后端场景的多 Agent 编排运行时实验：把熟悉的服务治理经验迁移到 Agent 工具调用与状态机。",
    status: "draft",
    createdAt: "2026-07-10",
    tags: ["agent", "orchestration", "typescript"],
    techStack: ["TypeScript", "Node.js", "状态机", "工具调用协议"],
    projectStatus: "active",
    period: { start: "2026-07" },
    links: { repo: "https://github.com/example/flux-agent-runtime" },
    highlights: [
      "把微服务的熔断/重试/超时思路迁移到 Agent 工具调用链",
      "以有向状态机建模多轮推理，可观测每一步事件流",
    ],
    related: [{ kind: "agent", slug: "refactor-navigator" }],
  },
] as const;
