/**
 * shared/motion 公开边界：全站动效的唯一 Motion 触点（基线 §11）。
 * 页面入场统一走这些 primitives；hover/focus 微交互用纯 CSS transition。
 */
export { Collapse, type CollapseProps } from "./Collapse";
export { FadeIn, type FadeInProps } from "./FadeIn";
export { PageTransition, type PageTransitionProps } from "./PageTransition";
export { SlideUp, type SlideUpProps } from "./SlideUp";
export { Stagger, type StaggerProps } from "./Stagger";
export {
  distances,
  durations,
  easings,
  STAGGER_LIMIT,
  staggerIntervals,
} from "./tokens";
