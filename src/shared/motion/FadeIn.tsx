import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { durations, easings } from "./tokens";

export interface FadeInProps {
  children: ReactNode;
  /** 延迟（秒） */
  delay?: number;
  /** 时长（秒），默认 durations.base */
  duration?: number;
  /** true 时改为进入视口一次性触发（IntersectionObserver，基线 §11） */
  inView?: boolean;
  className?: string;
}

/** 入场淡入 primitive：只动 opacity；reduced-motion 时内容直接呈现 */
export function FadeIn({
  children,
  delay = 0,
  duration = durations.base,
  inView = false,
  className,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const visible = { opacity: 1 };
  return (
    <m.div
      className={className}
      initial={{ opacity: reduced ? 1 : 0 }}
      {...(inView
        ? { whileInView: visible, viewport: { once: true, amount: 0.2 } }
        : { animate: visible })}
      transition={{
        duration: reduced ? 0 : duration,
        delay: reduced ? 0 : delay,
        ease: easings.out,
      }}
    >
      {children}
    </m.div>
  );
}
