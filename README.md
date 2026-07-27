# Cogniflux

> AI Builder 的个人工作台：构建、写作与实验的公开记录。

**技术栈**：React 19 · React Router v8（框架模式，prerender 静态输出）· Vite · TypeScript（strict）· Tailwind CSS v4（CSS-first + 设计令牌）· Motion · MDX + Zod · Vitest · pnpm

内容以本地 MDX / TS 数据文件为源，经 Zod 构建期校验，通过领域 Repository 供页面消费；全站 prerender 输出静态 HTML（SEO 与 SSG 同级）。视觉走「极简科技感 + 轻二次元 + 开发者工作台 + 游戏化 UI」方向（见下文）。

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

## 视觉与设计系统

- **双主题**：浅色为淡蓝紫渐变 + 网格/星点装饰的非纯白底；暗色为深蓝紫「夜间开发者工作台」。
- **令牌扩展**：紫/青/橙/粉四色系语义令牌、glass 毛玻璃（白名单：导航胶囊 + 首页 NowStrip）、渐变边框、发光阴影、纯 CSS 装饰层。
- **首页六模块**：Hero（身份陈述 + 开发者工作台装饰场景，预留看板娘挂载位 `#companion-slot`）→ 精选项目大卡 → 精选 Agents → 最新文章（首篇大卡）→ NOW BUILDING / CURRENTLY LEARNING / OPEN TO 状态条 → About/Contact。
- **关键组件**：毛玻璃胶囊导航、StatusCapsule 游戏化状态胶囊、AgentCard、FeaturedProjectCard。
- **数据模型**：Agent 新增 `accentTag`/`icon`（可选），Now 新增 `currentlyLearning`/`openTo`（字段字典见 [docs/CONTENT.md](./docs/CONTENT.md)）。
- **质量**：Vitest 77 项测试，含双主题 WCAG AA 对比度自动化测试。

令牌与装饰层使用规范见 [docs/DESIGN.md](./docs/DESIGN.md)（§8/§9）；看板娘 + TwinSparkBot 集成预留见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) §8。

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
