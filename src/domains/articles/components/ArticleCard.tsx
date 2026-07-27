import { Link } from "react-router";

import { Badge, Card, Clock, Tag } from "@/shared/ui";
import { cn, formatDate } from "@/shared/utils";

import type { Article, ArticleCategory } from "../types";

/** 文章分类展示标签（领域词汇归领域，基线 §10） */
export const ARTICLE_CATEGORY_LABEL: Record<ArticleCategory, string> = {
  engineering: "工程",
  agents: "Agents",
  thinking: "思考",
  buildlog: "构建日志",
};

export interface ArticleCardProps {
  article: Article;
  /** featured：首页大卡——更大标题/显示 cover/摘要行数放宽/meta 完整（默认 default 零破坏） */
  size?: "default" | "featured";
}

/** size → 标题字号（变体映射集中管理，不在 JSX 手拼分叉） */
const TITLE_SIZE: Record<NonNullable<ArticleCardProps["size"]>, string> = {
  default: "text-lg",
  featured: "text-xl sm:text-2xl",
};

/** size → 摘要行数（featured 放宽） */
const SUMMARY_CLAMP: Record<NonNullable<ArticleCardProps["size"]>, string> = {
  default: "line-clamp-3",
  featured: "line-clamp-4",
};

/** size → 标签 meta 展示：default 移动端隐藏（基线 §12）；featured 完整展示 */
const META_TAGS: Record<NonNullable<ArticleCardProps["size"]>, string> = {
  default: "hidden flex-wrap gap-1.5 sm:flex",
  featured: "flex flex-wrap gap-1.5",
};

/** 文章列表卡：title/summary/date/tags/readingTime/category（基线 §7 列表页用） */
export function ArticleCard({ article, size = "default" }: ArticleCardProps) {
  return (
    <Card interactive className="relative h-full">
      <article className="flex h-full flex-col gap-3">
        {/* featured 大卡：有 cover 则展示（固定宽高比防 CLS），无则不留空 */}
        {size === "featured" && article.cover ? (
          <img
            src={article.cover.src}
            alt={article.cover.alt}
            loading="lazy"
            className="aspect-video w-full rounded-card object-cover"
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{ARTICLE_CATEGORY_LABEL[article.category]}</Badge>
          {article.status === "draft" ? (
            <Badge variant="warning">DRAFT</Badge>
          ) : null}
        </div>
        <h3 className={cn("font-semibold text-primary", TITLE_SIZE[size])}>
          {/* stretched-link：整卡可点，链接文本仍是标题（键盘/读屏可达） */}
          <Link
            to={`/writing/${article.slug}`}
            className="transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
          >
            {article.title}
          </Link>
        </h3>
        <p className={cn("text-sm text-secondary", SUMMARY_CLAMP[size])}>
          {article.summary}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-tertiary">
          <time dateTime={article.createdAt}>{formatDate(article.createdAt)}</time>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5" />
            {article.readingTime} 分钟
          </span>
          {/* 次要 meta：default 移动端隐藏（基线 §12 信息密度）；featured 完整展示 */}
          <span className={META_TAGS[size]}>
            {article.tags.slice(0, 3).map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </span>
        </div>
      </article>
    </Card>
  );
}
