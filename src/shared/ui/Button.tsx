import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/utils";

export const buttonVariants = cva(
  // 微交互为纯 CSS transition（令牌时长）；焦点环走全局 :focus-visible（--color-focus-ring）
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-colors duration-(--motion-fast) disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // primary 附带 svg 箭头 hover 右移（视觉改版）：只动 transform，
        // 时长用动效令牌，reduced-motion 时无过渡；无 svg 子元素时零影响
        primary:
          "bg-accent text-inverse hover:bg-accent-hover active:bg-accent-hover [&_svg]:transition-transform [&_svg]:duration-(--motion-fast) hover:[&_svg]:translate-x-0.5 motion-reduce:[&_svg]:transition-none",
        secondary:
          "border border-default bg-surface text-primary hover:bg-raised active:bg-raised",
        ghost: "text-secondary hover:bg-raised hover:text-primary active:bg-raised",
        danger: "bg-danger text-inverse hover:opacity-90 active:opacity-90",
      },
      size: {
        /** 紧凑尺寸：仅桌面密集场景使用（移动端请用 md+ 保证 ≥44px 触控目标） */
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        /** 图标按钮：44×44 触控目标 */
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
