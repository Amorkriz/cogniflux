import { Link } from "react-router";

import { ArrowRight } from "@/shared/ui";

import type { ContentKind, ResolvedRef } from "@/shared/types/reference";

/** 内容类型展示标签（与 shared/types 的 ContentKind 对应，零领域依赖） */
const KIND_LABEL: Record<ContentKind, string> = {
  article: "文章",
  project: "项目",
  agent: "Agent",
  lab: "实验",
  tool: "工具",
};

export interface RelatedRefsProps {
  /** 区块标题元素 id（aria-labelledby） */
  id: string;
  title: string;
  refs: ResolvedRef[];
}

/**
 * 关联内容链接区（详情页复用，≥2 领域）：
 * 渲染 resolveRefs / getReferencesTo 的 ResolvedRef 列表；空列表不渲染。
 */
export function RelatedRefs({ id, title, refs }: RelatedRefsProps) {
  if (refs.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-section">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-primary">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2">
        {refs.map((ref) => (
          <li key={`${ref.kind}:${ref.slug}`}>
            <Link
              to={ref.href}
              className="group inline-flex min-h-11 items-center gap-2 text-sm text-secondary transition-colors duration-(--motion-fast) hover:text-accent"
            >
              <span className="rounded-control border border-default bg-raised px-1.5 py-0.5 font-mono text-xs text-tertiary">
                {KIND_LABEL[ref.kind]}
              </span>
              {ref.title}
              <ArrowRight
                aria-hidden="true"
                className="size-4 opacity-0 transition-opacity duration-(--motion-fast) group-hover:opacity-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
