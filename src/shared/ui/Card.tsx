import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/utils";

export const cardVariants = cva("rounded-card border border-default bg-surface", {
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
    },
    elevated: {
      true: "shadow-card",
      false: "",
    },
    /** 卡片 hover 微抬升（基线 §11 取舍清单）：纯 CSS，reduced-motion 时取消 */
    interactive: {
      true: "transition-[transform,box-shadow] duration-(--motion-base) ease-out-token hover:-translate-y-0.5 hover:shadow-card motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      false: "",
    },
    /** 毛玻璃卡片（视觉改版）：.glass 为非分层样式，覆盖基类 bg-surface/border-default；
     * 含 @supports 降级（见 decorations.css） */
    glass: {
      true: "glass",
      false: "",
    },
    /** 渐变流光描边（视觉改版）：hover/focus-within 时伪元素只动 opacity；
     * 宿主已有 rounded-card（伪元素 border-radius: inherit 依赖它） */
    glowBorder: {
      true: "relative gradient-border-card",
      false: "",
    },
  },
  defaultVariants: {
    padding: "md",
    elevated: false,
    interactive: false,
    glass: false,
    glowBorder: false,
  },
});

export interface CardProps
  extends ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

export function Card({
  className,
  padding,
  elevated,
  interactive,
  glass,
  glowBorder,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({ padding, elevated, interactive, glass, glowBorder }),
        className,
      )}
      {...props}
    />
  );
}
