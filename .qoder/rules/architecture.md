---
trigger: always_on
---

# 架构：依赖方向与目录边界（与 AGENTS.md 同源）

## 依赖方向（ESLint 强制，禁止反向）

```
pages → domains → shared → (无依赖)
content-io 只服务 domains 的 repository
```

- `src/pages/**` 与 `src/domains/**/components/**` 禁止 import `content/**`——内容一律经领域 repository 取数（如 `getArticles()`，Promise 返回）。
- `src/shared/**` 禁止依赖 domains/pages；`shared/ui` 组件禁止出现领域词汇（props 不得叫 `article` 等）。
- `src/content-io/` 禁止被 pages/components 直接调用。

## 领域出口纪律

- 每个领域（`src/domains/{articles,projects,agents,lab,now,toolbox,profile,site}`）对外只经 `index.ts` 导出；跨领域引用只走对方 `index.ts`，禁止 import 其内部文件。
- 领域内结构固定：`types.ts / schema.ts / repository.ts / components/ / index.ts`；schema 用 `baseContentSchema.extend(...)`，`z.infer` 保证类型不漂移。

## 目录与路由约定

- `appDirectory=src`：`root.tsx` / `routes.ts` 在 `src/` 根（非 `src/app/`）；`src/app/` 只放 Provider。
- prerender/sitemap 路径枚举在 `scripts/content-urls.ts`（node fs 实现，不走 alias），改内容路由须同步它。
- 不新建 `packages/`、`apps/`、`server/`、Storybook、CMS、搜索——各有触发条件（见 `docs/ARCHITECTURE.md` §4），未触发不做。
- 抽象遵循"两次规则"：第 2 次复用才上移一层，禁止预防性抽象。
- 密钥红线：前端永不持有 Key；`.env` 仅 `VITE_` 前缀；`src/services/agent/` 只允许接口 + mock。
- 交付前五条命令全绿：`pnpm typecheck / lint / validate-content / test / build`。
