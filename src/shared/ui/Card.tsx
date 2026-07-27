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
  },
  defaultVariants: {
    padding: "md",
    elevated: false,
    interactive: false,
  },
});

export interface CardProps
  extends ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

export function Card({ className, padding, elevated, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ padding, elevated, interactive }), className)}
      {...props}
    />
  );
}
