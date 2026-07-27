import type { ComponentProps } from "react";

import { cn } from "@/shared/utils";

export type InputProps = ComponentProps<"input">;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        // 高度 44px（触控目标红线）；焦点环走全局 :focus-visible
        "h-11 w-full min-w-0 rounded-control border border-default bg-surface px-3 text-sm text-primary transition-colors duration-(--motion-fast) placeholder:text-tertiary hover:border-strong disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
