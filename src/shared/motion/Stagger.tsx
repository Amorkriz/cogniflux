import { m, useReducedMotion } from "motion/react";
import { Children, type ReactNode } from "react";

import { distances, durations, easings, STAGGER_LIMIT, staggerIntervals } from "./tokens";

export interface StaggerProps {
  children: ReactNode;
  /** 项间隔（秒），令牌值 0.04/0.06/0.08，默认 0.06 */
  interval?: (typeof staggerIntervals)[keyof typeof staggerIntervals];
  /** 每项上移距离（px），默认 8 */
  distance?: (typeof distances)[keyof typeof distances];
  /** 容器 className（如 grid/flex 布局类） */
  className?: string;
  /** 每个包裹项的 className */
  itemClassName?: string;
}

/**
 * 列表逐项入场 primitive：前 STAGGER_LIMIT(12) 项依次淡入上移，
 * 之后的项立即显示（性能红线，基线 §11）；reduced-motion 时全部直接呈现。
 */
export function Stagger({
  children,
  interval = staggerIntervals.base,
  distance = distances.md,
  className,
  itemClassName,
}: StaggerProps) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, index) => {
        if (reduced || index >= STAGGER_LIMIT) {
          return (
            <div key={index} className={itemClassName}>
              {child}
            </div>
          );
        }
        return (
          <m.div
            key={index}
            className={itemClassName}
            initial={{ opacity: 0, y: distance }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: durations.base,
              delay: index * interval,
              ease: easings.out,
            }}
          >
            {child}
          </m.div>
        );
      })}
    </div>
  );
}
