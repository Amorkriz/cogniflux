import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/utils";

/**
 * 游戏化状态胶囊（视觉改版 §三）：等宽字体大写 + 字母间距 + 前置呼吸点。
 * 零业务语义——状态文案与 tone 的映射由调用方（领域层）负责。
 */
export const statusCapsuleVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border border-default bg-surface px-2.5 py-0.5 font-mono text-xs font-medium tracking-widest uppercase",
  {
    variants: {
      tone: {
        accent: "text-accent",
        secondary: "text-accent-secondary",
        tertiary: "text-accent-tertiary",
        warm: "text-accent-warm",
        pink: "text-accent-pink",
        success: "text-success",
        warning: "text-warning",
        neutral: "text-tertiary",
      },
    },
    defaultVariants: {
      tone: "accent",
    },
  },
);

/** 前置呼吸点：色调与文本 tone 同步；动画只动 opacity（animate-breathe） */
export const statusCapsuleDotVariants = cva("size-1.5 shrink-0 rounded-full", {
  variants: {
    tone: {
      accent: "bg-accent",
      secondary: "bg-accent-secondary",
      tertiary: "bg-accent-tertiary",
      warm: "bg-accent-warm",
      pink: "bg-accent-pink",
      success: "bg-success",
      warning: "bg-warning",
      neutral: "bg-strong",
    },
    /** reduced-motion 时 motion-reduce:animate-none 双保险（primitives 外的 CSS 侧兜底） */
    animated: {
      true: "animate-breathe motion-reduce:animate-none",
      false: "",
    },
  },
  defaultVariants: {
    tone: "accent",
    animated: true,
  },
});

export interface StatusCapsuleProps
  extends ComponentProps<"span">,
    VariantProps<typeof statusCapsuleVariants> {
  /** 呼吸点动画开关（默认 true） */
  animated?: boolean;
}

export function StatusCapsule({
  className,
  tone,
  animated = true,
  children,
  ...props
}: StatusCapsuleProps) {
  return (
    <span className={cn(statusCapsuleVariants({ tone }), className)} {...props}>
      <span
        aria-hidden="true"
        className={statusCapsuleDotVariants({ tone, animated })}
      />
      {children}
    </span>
  );
}
