# Cogniflux 设计令牌与主题使用法

> 令牌唯一事实来源：`src/styles/tokens.css`。业务组件只允许使用语义令牌类名，禁止裸色值/像素值/动画参数硬编码。

## 1. 两层令牌结构

- **Primitive 层**（原料，业务代码禁止直接使用）：灰阶 `--gray-50…950`、品牌色阶 `--brand-50…950`、功能色原始值、字号阶梯 `--font-size-xs…5xl`、间距阶梯 `--space-1…32`（4px 基准）、圆角 `--radius-1…4/full`、阴影 `--shadow-1…3`、时长 `--duration-120/200/320/500`、缓动 `--easing-out/emphasized/linear`。
- **Semantic 层**（业务唯一入口）：`:root` 中的默认值即 light 主题兜底；主题文件（`themes/light.css`、`themes/dark.css`）**只覆盖 Semantic 层**。

## 2. 语义令牌清单（与 tokens.css 核对）

| 分组 | 令牌 |
|---|---|
| 背景三层级 | `--bg-base` / `--bg-surface` / `--bg-raised` |
| 文本 | `--text-primary` / `--text-secondary` / `--text-tertiary` / `--text-inverse` |
| 边框 | `--border-default` / `--border-strong` |
| 强调色 | `--accent` / `--accent-hover` |
| 功能色 | `--success` / `--warning` / `--danger` / `--info` |
| 形状 | `--radius-card` / `--radius-control` |
| 阴影 | `--shadow-card` / `--shadow-overlay` |
| 遮罩 | `--overlay-scrim` |
| 节奏 | `--space-section` / `--space-block` |
| 容器 | `--container-prose`（65ch）/ `--container-page`（1120px） |
| z-index | `--z-base/raised/sticky/overlay/modal/toast` |
| 动效 | `--motion-fast/base/slow/narrative` + `--ease-out` / `--ease-emphasized` |
| 焦点环 | `--color-focus-ring` |
| 字体 | `--font-sans` / `--font-mono` + 字重 `--font-weight-*` + 行高 `--leading-*` |

## 3. 业务组件红线

- **只用语义令牌类名**：`bg-surface`、`text-primary`、`text-secondary`、`border-default`、`rounded-card`、`shadow-card`、`text-accent` 等。
- 禁止：裸色值（`#3b82f6`、`bg-blue-500`）、任意像素值（`w-[137px]`）、硬编码动画参数（`duration-300`、自写 cubic-bezier）。
- 禁止业务代码直接使用 Primitive 令牌（`var(--gray-500)`、`var(--brand-600)`）。
- 长文排版走 `.prose`（typography 插件 + 令牌定制）；`@apply` 只允许用于 `.prose` 这类设计系统底层，禁止写页面级样式。

## 4. Tailwind v4 `@theme inline` 机制

CSS-first，无 `tailwind.config.js`。`src/styles/globals.css`：

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./themes/light.css";
@import "./themes/dark.css";
@custom-variant dark ([data-theme="dark"] &);
@theme inline {
  --color-surface: var(--bg-surface);
  --color-primary: var(--text-primary);
  --radius-card: var(--radius-card);
  /* …将 Semantic 令牌映射为 Tailwind 工具类 */
}
```

`inline` 的关键：工具类直接引用 `var(--…)`，值随 `data-theme` 切换实时变化，无需重编译。产出的工具类速查：

| 工具类 | 来源令牌 |
|---|---|
| `bg-base` / `bg-surface` / `bg-raised` | 背景三层级 |
| `text-primary` / `text-secondary` / `text-tertiary` / `text-inverse` | 文本 |
| `border-default` / `border-strong` | 边框 |
| `text-accent` / `bg-accent` / `hover:bg-accent-hover` | 强调色 |
| `text-success` / `text-warning` / `text-danger` / `text-info` | 功能色 |
| `rounded-card` / `rounded-control` | 形状 |
| `shadow-card` / `shadow-overlay` | 阴影 |
| `bg-scrim` | 覆盖层遮罩 |
| `py-section` / `gap-block` | 节奏 |
| `max-w-prose-container` / `max-w-page` | 容器 |
| `font-sans` / `font-mono` | 字体 |
| `animate-overlay-in/out`、`animate-pop-in/out`、`animate-dialog-in/out`、`animate-breathe` | 覆盖层/呼吸点动画（时长/缓动来自动效令牌） |

dark 变体由 `data-theme` 驱动（而非 `prefers-color-scheme`），写法照常：`dark:...`（大多数场景因令牌自动切换而无需 dark: 前缀）。

## 5. 主题机制与新增流程

- 切换：`<html data-theme="light|dark">` + localStorage（key `cogniflux-theme`）+ `root.tsx` 内联防闪烁脚本；默认跟随系统偏好。工具函数在 `src/shared/utils/theme.ts`（`getTheme/setTheme/toggleTheme`）。
- 基线定义了 `ThemeDefinition` TS 接口（colors/surfaces/typography/motion/density）作为"一个主题必须提供什么"的约束；**当前阶段该接口尚未落成 TS 代码**，light/dark 两主题以 CSS 文件手工同步（基线允许：阶段 1 手工同步足矣，阶段 2 可加脚本从 TS 生成 CSS）。
- **新增主题流程**：
  1. 新建 `src/styles/themes/{id}.css`，以 `[data-theme="{id}"] { … }` 覆盖 **Semantic 层**全部颜色 + 按需覆盖阴影/遮罩/焦点环（参照 `dark.css` 的覆盖范围），并设置 `color-scheme`。
  2. 在 `globals.css` 顶部 `@import` 该文件。
  3. 扩展 `src/shared/utils/theme.ts` 的 `Theme` 联合类型与 ThemeSwitcher。
  4. 验证 WCAG AA 对比度（正文 4.5:1，参照 dark.css 注释中的对比度标注方式）。
- 业务组件零改动——这是语义令牌层存在的意义。

## 6. 动效令牌与 primitives

- 双出口同源：CSS 侧 `tokens.css`（`--motion-fast: 120ms` / `base: 200ms` / `slow: 320ms` / `narrative: 500ms`）；JS 侧 `src/shared/motion/tokens.ts`（`durations`/`easings`/`distances`/`staggerIntervals`/`STAGGER_LIMIT = 12`，秒制）。**修改任一侧必须同步另一侧**。
- Primitives（`src/shared/motion/`，全站动效的唯一 Motion 触点）：`FadeIn`、`SlideUp`、`Stagger`、`PageTransition`（仅 opacity 150ms）、`Collapse`。全部内置 `useReducedMotion` 处理。
- 分层规则：微交互（hover/focus）→ 纯 CSS transition（令牌时长）；入场/路由过渡 → primitives；领域专属动效（如 AgentStatusBadge 呼吸点 `animate-breathe`）→ 领域组件内实现但必须消费动效令牌。
- 性能红线：只动 `transform/opacity`；stagger 上限 12 项；`prefers-reduced-motion` 双保险（CSS `motion-reduce:animate-none` + primitives 层）。

## 7. CVA 变体规范

- 组件变体逻辑集中在 CVA（class-variance-authority）声明，禁止在 JSX 里手拼条件类名分叉。
- 变体函数与组件一同具名导出（如 `Button` + `buttonVariants`，供 Link 等场景复用样式，见 `src/shared/ui/Button.tsx`）。
- 类名合并统一用 `cn()`（`src/shared/utils/cn.ts`，clsx + tailwind-merge）。
- 超过 ~6 个工具类的重复组合应提炼为组件而非复制粘贴；props >8 或出现 `type/mode` 开关分叉渲染时必须拆分组件。
- Props 类型命名 `XxxProps` 并导出；每层目录 `index.ts` 定义公开边界（`shared/ui/index.ts`、`shared/components/index.ts`）。
