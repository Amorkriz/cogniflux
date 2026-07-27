---
trigger: glob
globs: src/**/*.tsx,src/**/*.css
---

# 设计令牌与动效红线（与 AGENTS.md 同源）

## 语义令牌红线

- 业务组件禁止裸色值/像素值/动画参数：`#3b82f6`、`bg-blue-500`、`w-[137px]`、`duration-300`、自写 cubic-bezier 一律不允许。
- 只用语义令牌类名：`bg-base/surface/raised`、`text-primary/secondary/tertiary/inverse`、`border-default/strong`、`text-accent`、`rounded-card/control`、`shadow-card/overlay`、`py-section`、`gap-block`、`max-w-prose-container/page`。
- 禁止直用 Primitive 令牌（`var(--gray-*)`、`var(--brand-*)`、`--space-*`、`--radius-1…4`）。令牌唯一来源 `src/styles/tokens.css`；新增令牌先加 Semantic 层再消费。
- 主题 = `[data-theme]` 下覆盖 Semantic 变量（参照 `src/styles/themes/dark.css`）；dark 变体由 `data-theme` 驱动，多数场景令牌自动切换、无需 `dark:` 前缀。
- `@apply` 只允许用于 `.prose` 等设计系统底层（`globals.css`），禁止写页面级样式。

## CVA 规范

- 组件变体集中在 CVA 声明，禁止 JSX 手拼条件类名分叉；类名合并统一 `cn()`（`src/shared/utils/cn.ts`）。
- 变体函数与组件一同具名导出（如 `buttonVariants`）；Props 类型 `XxxProps` 导出。
- 超过 ~6 个工具类的重复组合提炼为组件；props >8 或出现 `type/mode` 开关分叉渲染必须拆分。

## 动效红线

- 只动 `transform/opacity`；时长/缓动只用动效令牌（CSS：`--motion-fast/base/slow/narrative` + `--ease-out/emphasized`；JS：`src/shared/motion/tokens.ts`，两侧同源，改一侧必须同步另一侧）。
- 入场/路由过渡一律走 `shared/motion` primitives（FadeIn/SlideUp/Stagger/PageTransition/Collapse）——全站唯一 Motion 触点；微交互用消费令牌的 CSS transition。
- 必须尊重 `prefers-reduced-motion`（primitives 内置 + CSS `motion-reduce:animate-none` 双保险）；stagger 上限 12 项；滚动触发一次性，禁连续绑定。

## 无障碍

- 交互组件键盘可达 + 可见焦点环（`--color-focus-ring`）；触控目标 ≥44px；按钮用 `<button>`；图片必有 alt。
