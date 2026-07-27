/**
 * Toolbox 种子数据（结构化 TS，基线 §7）。
 * 由 src/domains/toolbox 的 repository 经 toolSchema 校验后消费。
 * recommendLevel 1-3（3 为最推荐）。
 */
export const tools = [
  {
    slug: "vite",
    title: "Vite",
    summary: "现代前端构建工具，冷启动与 HMR 极快，是本站内容管线与开发体验的地基。",
    status: "published",
    createdAt: "2026-07-05",
    tags: ["build", "frontend"],
    category: "dev",
    url: "https://vite.dev",
    useCase: "本地开发热更新、生产构建与插件化内容校验",
    recommendLevel: 3,
  },
  {
    slug: "zod",
    title: "Zod",
    summary: "TypeScript 优先的运行时校验库，schema 即类型来源，从后端契约思维平滑迁移到内容契约。",
    status: "published",
    createdAt: "2026-07-06",
    tags: ["validation", "typescript"],
    category: "dev",
    url: "https://zod.dev",
    useCase: "内容 frontmatter 与结构化数据的构建期校验、类型推导",
    recommendLevel: 3,
  },
  {
    slug: "obsidian",
    title: "Obsidian",
    summary: "本地优先的双链笔记，用于沉淀转型期的学习笔记与文章草稿，再迁移到内容仓库。",
    status: "published",
    createdAt: "2026-07-07",
    tags: ["notes", "knowledge"],
    category: "productivity",
    url: "https://obsidian.md",
    useCase: "知识管理、写作前的素材整理与大纲",
    recommendLevel: 2,
  },
] as const;
