import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { distances, durations, easings } from "./tokens";

export interface SlideUpProps {
  children: ReactNode;
  /** 延迟（秒） */
  delay?: number;
  /** 时长（秒），默认 durations.base */
  duration?: number;
  /** 上移距离（px），只允许令牌值 4/8/16，默认 8 */
  distance?: (typeof distances)[keyof typeof distances];
  /** true 时改为进入视口一次性触发 */
  inView?: boolean;
  className?: string;
}

/** 入场淡入 + 上移 primitive：只动 transform/opacity；reduced-motion 时位移取消 */
export function SlideUp({
  children,
  delay = 0,
  duration = durations.base,
  distance = distances.md,
  inView = false,
  className,
}: SlideUpProps) {
  const reduced = useReducedMotion();
  const visible = { opacity: 1, y: 0 };
  return (
    <m.div
      className={className}
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
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
