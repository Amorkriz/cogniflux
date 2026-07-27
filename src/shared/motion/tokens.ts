/**
 * 动效令牌 TS 出口（基线 §11）：与 src/styles/tokens.css 同源同值。
 * tokens.css 是唯一事实来源，此处为 Motion primitives 的 JS 消费端；
 * 修改任一侧必须同步另一侧。
 */

/** 时长（秒，Motion 使用秒制）——对应 --motion-fast/base/slow/narrative */
export const durations = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  narrative: 0.5,
  /** 路由过渡专用：仅 opacity 150ms（基线 §11 PageTransition） */
  page: 0.15,
} as const;

/** 缓动——对应 --easing-out / --easing-emphasized / --easing-linear */
export const easings = {
  out: [0.22, 1, 0.36, 1],
  emphasized: [0.32, 0.72, 0, 1],
  linear: "linear",
} as const;

/** 入场位移距离（px）——基线 §11：4/8/16 */
export const distances = {
  sm: 4,
  md: 8,
  lg: 16,
} as const;

/** 列表 stagger 间隔（秒）——基线 §11：40–80ms */
export const staggerIntervals = {
  tight: 0.04,
  base: 0.06,
  loose: 0.08,
} as const;

/** 列表 stagger 上限：超过后立即显示（性能红线，基线 §11） */
export const STAGGER_LIMIT = 12;
