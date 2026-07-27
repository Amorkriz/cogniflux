import type { ComponentProps } from "react";

import { cn } from "@/shared/utils";

export interface SeparatorProps extends ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical";
  /** 纯装饰（默认）：对屏幕阅读器隐藏；false 时暴露 separator 语义 */
  decorative?: boolean;
}

/** 分隔线（自建，无需 Radix）：颜色仅消费 border 语义令牌 */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-default",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}
