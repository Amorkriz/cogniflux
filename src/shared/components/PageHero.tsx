import type { ReactNode } from "react";

import { SlideUp } from "@/shared/motion";

export interface PageHeroProps {
  /** 小字眉题（等宽小写，如栏目 slug） */
  eyebrow?: string;
  title: string;
  description?: string;
  /** 行动区（按钮/链接） */
  children?: ReactNode;
}

/** 页面头部：统一入场动效（SlideUp primitive），每页唯一 h1 */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <SlideUp>
      <header>
        {eyebrow ? <p className="font-mono text-sm text-tertiary">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-prose-container text-lg text-secondary">
            {description}
          </p>
        ) : null}
        {children ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>
        ) : null}
      </header>
    </SlideUp>
  );
}
