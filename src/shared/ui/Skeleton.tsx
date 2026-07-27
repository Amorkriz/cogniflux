import type { ComponentProps } from "react";

import { cn } from "@/shared/utils";

export type SkeletonProps = ComponentProps<"div">;

/** 骨架屏占位：调用方用 className 控制尺寸；reduced-motion 时停止脉冲 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-control bg-raised motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
