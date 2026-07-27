---
trigger: glob
globs: src/**/*.tsx,src/**/*.css
---

# 设计令牌与动效红线（与 AGENTS.md 同源）

## 语义令牌红线

- 业务组件禁止裸色值/像素值/动画参数：`#3b82f6`、`bg-blue-500`、`w-[137px]`、`duration-300`、自写 cubic-bezier 一律不允许。
- 只用语义令牌类名：`bg-base/surface/raised`、`text-primary/secondary/tertiary/inverse`、`border-default/strong`、`text-accent`、`text-accent-secondary/tertiary/warm/pink`（及同名 bg-*/border-*）、`bg-hero`、`bg-glow`、`rounded-card/control`、`shadow-card/overlay/glow`、`py-section`、`gap-block`、`max-w-prose-container/page`。
- `bg-strong`（边框强色作背景）合法用途：**仅用于小型状态点/分隔类元素的背景填充**（如 StatusCapsule neutral 呼吸点），禁止用作卡片/容器大面积背景。
- 禁止直用 Primitive 令牌（`var(--gray-*)`、`var(--brand-*)`、`var(--purple/cyan/orange/pink-*)`、`--space-*`、`--radius-1…4`）。令牌唯一来源 `src/styles/tokens.css`；新增令牌先加 Semantic 层再消费。
- 主题 = `[data-theme]` 下覆盖 Semantic 变量（参照 `src/styles/themes/dark.css`）；dark 变体由 `data-theme` 驱动，多数场景令牌自动切换、无需 `dark:` 前缀。
- `@apply` 只允许用于 `.prose` 等设计系统底层（`globals.css`），禁止写页面级样式。

## 装饰层白名单（src/styles/decorations.css，视觉改版）

- 装饰类仅限：`[data-decor="grid"]`、`[data-decor="stars"]`、`.glass`、`.gradient-border-card`；`data-decor` 新增取值必须同步本白名单与 `docs/DESIGN.md` §8。
- 装饰元素必须 `aria-hidden="true"`，纯 CSS gradient（禁图片/JS），不进入关键渲染路径。
- `.glass` 必须保留 `@supports not (backdrop-filter)` 纯色降级；`.gradient-border-card` 只动 opacity，reduced-motion 下无过渡。
- `.glass` 使用白名单——**仅限：站点导航胶囊（SiteHeader）、首页 NowStrip 卡片；新增使用场景须先修订本白名单**（并同步 `docs/DESIGN.md` §8）。禁止 `.glass` 与 `animate-float` 等持续动画组合（浮动 + blur 合成成本最高）；浮动装饰小卡用普通 surface 卡（`rounded-card border border-default bg-surface shadow-card`）。
- 装饰动效工具类：`animate-float`（transform）/ `animate-pulse-glow`（opacity），必须配 `motion-reduce:animate-none`。

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
