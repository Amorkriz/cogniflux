import type { ComponentProps } from "react";

import { cn } from "@/shared/utils";

export type TagProps = ComponentProps<"span">;

/** 内容标签（如 #react）：等宽字体、低对比，零业务语义 */
export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control border border-default bg-surface px-2 py-0.5 font-mono text-xs text-secondary",
        className,
      )}
      {...props}
    />
  );
}
