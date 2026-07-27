import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/shared/ui";

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * 全局 Provider（基线 §11）：
 * - LazyMotion + domAnimation：全站 m 组件按需加载动效特性（~5KB gzip），
 *   strict 模式禁止误用完整版 motion 组件。
 * - TooltipProvider：Radix Tooltip 全局单例。
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    </LazyMotion>
  );
}
