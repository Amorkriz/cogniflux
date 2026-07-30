# AGENTS.md — Cogniflux AI 协作规则

Cogniflux：AI Builder 的个人工作台（React Router v8 prerender 静态站 + MDX/TS 内容 + 设计令牌体系）。

## 常用命令

```bash
pnpm dev                # 开发服务器（draft 内容可见）
pnpm build              # 生产构建（prerender + sitemap/RSS）
pnpm typecheck          # react-router typegen + tsc（strict）
pnpm lint               # ESLint（含目录依赖方向规则）
pnpm test               # Vitest（tests/**/*.test.ts）
pnpm validate-content   # 内容 frontmatter Zod 校验
```

改动交付前五条全绿：typecheck / lint / validate-content / test / build。

## 目录依赖方向（ESLint 强制，禁止反向）

```
pages → domains → shared → (无依赖)
content-io 只服务 domains 的 repository
```

- 页面/领域组件**禁止 import `content/**`**——内容一律经领域 `index.ts` 的 repository 取数（`getArticles()` 等，Promise 返回）。
- 跨领域只经对方 `index.ts`，禁止 import 其内部文件。
- `src/shared/**` 禁止依赖 domains/pages；`shared/ui` 组件禁止出现领域词汇。
- 路由约定：`appDirectory=src`，`root.tsx`/`routes.ts` 在 `src/` 根；prerender 路径枚举在 `scripts/content-urls.ts`（不走 alias）。

## 全局红线

1. **令牌**：业务组件禁止裸色值/像素值/动画参数（如 `#3b82f6`、`w-[137px]`、`duration-300`）；只用语义令牌类名（`bg-surface`、`text-primary`、`rounded-card`、`shadow-card`…）；禁止直用 Primitive 令牌（`--gray-*`、`--brand-*`）。令牌唯一来源 `src/styles/tokens.css`。
2. **动效**：只动 `transform/opacity`；一律走 `shared/motion` primitives（FadeIn/SlideUp/Stagger/PageTransition/Collapse）或消费动效令牌的 CSS transition；必须尊重 `prefers-reduced-motion`；stagger 上限 12 项。
3. **无障碍**：交互组件必须键盘可达（Tab + 可见焦点环 `--color-focus-ring`）、触控目标 ≥44px、按钮用 `<button>`、图片必有 alt（`cover.alt` Zod 强制）。
4. **组件纪律**：props >8 或出现 `type/mode` 开关分叉渲染必须拆分；抽象遵循"两次规则"——第 2 次复用才上移一层，禁止预防性抽象；变体用 CVA + `cn()`，具名导出，`XxxProps` 导出。
5. **内容**：frontmatter 字段字典见 `docs/CONTENT.md`；slug 小写连字符、发布后不改；`status: draft` 不进生产构建；`related` 只写 `{ kind, slug }`。
6. **密钥**：前端永不持有任何 Key/Token；`.env` 仅允许 `VITE_` 前缀公开配置；`src/services/agent/` 只有 Gateway 接口 + mock，禁止真实 LLM SDK 调用。

## 文档指路

- 架构与偏差记录：`docs/ARCHITECTURE.md`；决策依据：`docs/adr/ADR-001…011`
- 内容规范/frontmatter 字典：`docs/CONTENT.md`；令牌与主题：`docs/DESIGN.md`
- 发布前检查：`docs/CHECKLIST.md`

## 其他约定

- Git 提交前缀（轻量 Conventional Commits）：`feat / fix / content / docs / chore`。
- 不新建 `packages/`、`apps/`、`server/` 目录、不引 CMS/搜索/Storybook——这些有明确触发条件（见 `docs/ARCHITECTURE.md` §4），未触发不做。
- 组件陈列页在 `/dev/ui` 路由（不进 sitemap）。
