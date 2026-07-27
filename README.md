# Cogniflux

> AI Builder 的个人工作台：构建、写作与实验的公开记录。

**技术栈**：React 19 · React Router v8（框架模式，prerender 静态输出）· Vite · TypeScript（strict）· Tailwind CSS v4（CSS-first + 设计令牌）· Motion · MDX + Zod · Vitest · pnpm

内容以本地 MDX / TS 数据文件为源，经 Zod 构建期校验，通过领域 Repository 供页面消费；全站 prerender 输出静态 HTML（SEO 与 SSG 同级）。

## 快速开始

```bash
pnpm install   # 安装依赖（pnpm 11+，Node 22）
pnpm dev       # 本地开发服务器（draft 内容可见）
pnpm build     # 生产构建（prerender + sitemap/RSS 生成）
```

## 命令速查

| 命令                    | 说明                                    |
| ----------------------- | --------------------------------------- |
| `pnpm dev`              | 本地开发服务器                          |
| `pnpm build`            | 生产构建（prerender + generate-seo）    |
| `pnpm preview`          | 静态预览 `build/client`（端口 3000）    |
| `pnpm typecheck`        | 路由类型生成 + TS 类型检查              |
| `pnpm lint`             | ESLint 检查（含目录依赖方向规则）       |
| `pnpm test`             | Vitest 单元测试                         |
| `pnpm validate-content` | 内容 frontmatter 校验（Zod，CI 必跑）   |
| `pnpm format`           | Prettier 格式化（含 Tailwind 类名排序） |

## 目录结构速览

```
content/            # 内容源：articles/（MDX）、lab/（MDX）、data/（TS）、_templates/
src/
├── root.tsx        # 根布局（appDirectory=src，含主题防闪烁脚本）
├── routes.ts       # 路由表：8 栏目 + 详情路由 + /dev/ui + 404
├── pages/          # 路由页面（仅组合，经 repository 取数）
├── domains/        # 8 领域：types/schema/repository/components/index.ts
├── shared/         # ui / components / motion / seo / types / utils
├── content-io/     # MDX 编译、frontmatter 校验（只服务 repository）
├── services/agent/ # AgentGateway 接口 + mock
└── styles/         # tokens.css / themes/ / globals.css
scripts/            # content-urls / generate-seo / validate-content
docs/               # 项目文档 + ADR
```

依赖方向：`pages → domains → shared`；页面禁止直接 import `content/**`（ESLint 强制）。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 架构落地版：技术路线、目录职责、延后决策触发条件、与基线的偏差 |
| [docs/CONTENT.md](./docs/CONTENT.md) | 内容写作规范：frontmatter 字段字典、slug 纪律、related 机制 |
| [docs/DESIGN.md](./docs/DESIGN.md) | 设计令牌与主题使用法、动效规范、CVA 规范 |
| [docs/CHECKLIST.md](./docs/CHECKLIST.md) | 发布前检查清单 |
| [docs/adr/](./docs/adr/) | ADR-001…008 架构决策记录 |
| [AGENTS.md](./AGENTS.md) | AI 协作规则（AI 编码工具每次会话自动读取） |

## 内容写作入门（三步）

1. **复制模板**：从 `content/_templates/` 复制对应模板（如 `article.mdx` → `content/articles/2026/{slug}/index.mdx`），按注释填 frontmatter。
2. **写作**：`pnpm dev` 实时预览（`status: draft` 本地可见、带 DRAFT 角标）；`pnpm validate-content` 自检 frontmatter。
3. **PR 预览**：改 `status: published` 后提 PR，CI 全绿 + Vercel Preview 走查（对照 [docs/CHECKLIST.md](./docs/CHECKLIST.md)）后合并即发布。

详细规范见 [docs/CONTENT.md](./docs/CONTENT.md)。
