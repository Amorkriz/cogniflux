---
trigger: glob
globs: content/**
---

# 内容规范（与 AGENTS.md 同源，字段字典详见 docs/CONTENT.md）

## frontmatter 与 slug

- 新内容从 `content/_templates/` 复制模板起步；frontmatter 必须通过 Zod 校验（`pnpm validate-content`，坏 frontmatter = 构建失败）。
- 基座必填：`slug / title / summary(≤160 字) / status / createdAt`；`cover` 若填则 `cover.alt` 必填（无障碍红线）。
- slug：小写字母/数字 + 连字符（`^[a-z0-9]+(?:-[a-z0-9]+)*$`），不含日期；文章 slug 与目录名一致（`content/articles/{年}/{slug}/index.mdx`）、Lab slug 与文件名一致（`content/lab/{slug}.mdx`）；**发布后不改**（改则 301 + 别名表）。
- 各类型扩展字段与 `src/domains/*/schema.ts` 一致：Article 必填 `category`；Lab 必填 `hypothesis/outcome`；Project 必填 `projectStatus/period.start`；Agent 必填 `role/agentStatus`；Tool 必填 `category/useCase/recommendLevel(1-3)`。

## draft 语义

- `status: draft`：dev 可见（DRAFT 角标），生产构建过滤——不进 prerender/sitemap/RSS。
- `status: published` 才发布；`archived` 归档不列出。
- 业务状态（`projectStatus`/`agentStatus`/`outcome`）与发布 `status` 相互独立（如归档项目仍可 published 展示）。

## related 引用

- 正向引用写 `related: [{ kind, slug }]`，`kind` 取 `article | project | agent | lab | tool`；**只存 kind+slug，不写 title**（渲染时由 repository 解析，防改标题后过期）。
- 反向关联（"被这些内容引用"）构建期自动生成，无需双向维护；悬空引用渲染时静默跳过——发布前确认目标存在。
- Tool 无 `related` 字段（可被引用，不引用他者）。

## 其他

- 文章图片与文章同目录存放，用相对路径（`./cover.png`）；单图 <500KB。
- 结构化数据（Project/Agent/Tool/Now/Profile/Site）写在 `content/data/*.ts`，TS 类型即约束。
- `content/` 内禁止任何组件/逻辑代码；页面代码禁止直接 import 本目录。
