import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils";

import { durations, easings } from "./tokens";

export interface CollapseProps {
  /** 展开状态（受控） */
  open: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * 展开/收起 primitive：height + opacity 过渡（height 为 Collapse 语义
 * 的必要例外，基线 §11 将其列为一等 primitive）。
 * reduced-motion 时无过渡，直接挂载/卸载。
 */
export function Collapse({ open, children, className }: CollapseProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return open ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          className={cn("overflow-hidden", className)}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: durations.base, ease: easings.out }}
        >
          {children}
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
