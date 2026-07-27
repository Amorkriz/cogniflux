import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { durations, easings } from "./tokens";

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * 路由切换过渡 primitive：仅 opacity 150ms（基线 §11）。
 * 调用方以路由 pathname 作为 key 触发重新入场；reduced-motion 时直接呈现。
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={{ opacity: reduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduced ? 0 : durations.page,
        ease: easings.linear,
      }}
    >
      {children}
    </m.div>
  );
}
