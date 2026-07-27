import type { ReactNode } from "react";

import { cn } from "@/shared/utils";

export interface TimelineProps {
  children: ReactNode;
  className?: string;
  /** 无障碍标签（如“近况时间线”） */
  "aria-label"?: string;
}

/**
 * 时间线复合组件（基线 §10 shared/components：Now 月度时间线与
 * Projects 详情时间线共用，≥2 领域复用且不含领域字段）。
 */
export function Timeline({ children, className, ...rest }: TimelineProps) {
  return (
    <ol className={cn("relative flex flex-col", className)} {...rest}>
      {children}
    </ol>
  );
}

export interface TimelineItemProps {
  /** 时间标签（如 2026-07）；用 <time> 输出 */
  time?: string;
  /** time 属性的机器可读值（缺省同 time） */
  dateTime?: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** 时间线单项：左侧竖线 + 节点圆点，内容区自由组合 */
export function TimelineItem({
  time,
  dateTime,
  title,
  children,
  className,
}: TimelineItemProps) {
  return (
    <li
      className={cn(
        "relative border-l border-default pb-8 pl-6 last:border-transparent last:pb-0",
        className,
      )}
    >
      {/* 节点圆点：绝对定位在竖线上 */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 -left-1.25 size-2.5 rounded-full border-2 border-strong bg-surface"
      />
      {time ? (
        <time
          dateTime={dateTime ?? time}
          className="font-mono text-xs text-tertiary"
        >
          {time}
        </time>
      ) : null}
      <div className="mt-1 text-base font-semibold text-primary">{title}</div>
      {children ? <div className="mt-2">{children}</div> : null}
    </li>
  );
}
