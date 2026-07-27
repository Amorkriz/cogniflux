import { Card, ExternalLink, Star, Tag } from "@/shared/ui";

import type { Tool, ToolCategory } from "../types";

/** 工具分类展示标签（分组标题用） */
export const TOOL_CATEGORY_LABEL: Record<ToolCategory, string> = {
  dev: "开发",
  ai: "AI",
  productivity: "效率",
  hardware: "硬件",
  method: "方法",
};

/** 推荐度星级（1-3）：实心/空心星组合，读屏输出文字 */
function RecommendStars({ level }: { level: number }) {
  return (
    <span
      role="img"
      aria-label={`推荐度 ${level}/3`}
      className="inline-flex items-center gap-0.5 text-warning"
    >
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={i <= level ? "size-3.5 fill-current" : "size-3.5 opacity-30"}
        />
      ))}
    </span>
  );
}

export interface ToolCardProps {
  tool: Tool;
}

/** 工具卡（Toolbox 纯列表页，无详情页）：外链 + useCase + 推荐星级 */
export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Card interactive={Boolean(tool.url)} className="relative h-full">
      <article className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-primary">
            {tool.url ? (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
              >
                {tool.title}
                <ExternalLink aria-hidden="true" className="size-4 text-tertiary" />
                <span className="sr-only">（新窗口打开）</span>
              </a>
            ) : (
              tool.title
            )}
          </h3>
          <RecommendStars level={tool.recommendLevel} />
        </div>
        <p className="line-clamp-3 text-sm text-secondary">{tool.summary}</p>
        <p className="mt-auto flex flex-col gap-2 pt-1 text-xs text-tertiary">
          <span>用途：{tool.useCase}</span>
        </p>
        {tool.tags.length > 0 ? (
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {tool.tags.slice(0, 3).map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        ) : null}
      </article>
    </Card>
  );
}
