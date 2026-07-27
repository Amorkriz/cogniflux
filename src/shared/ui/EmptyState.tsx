import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/utils";

export interface EmptyStateProps extends ComponentProps<"div"> {
  /** 图标节点（请从 @/shared/ui 的 icon 出口取图标） */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** 行动区（如一个 Button 或链接） */
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-default px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div aria-hidden="true" className="text-tertiary [&_svg]:size-8">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-medium text-primary">{title}</p>
      {description ? (
        <p className="max-w-prose-container text-sm text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
