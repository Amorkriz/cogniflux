import { Link } from "react-router";

import { Badge, Card, Clock, Tag } from "@/shared/ui";
import { formatDate } from "@/shared/utils";

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
}

/** 文章列表卡：title/summary/date/tags/readingTime/category（基线 §7 列表页用） */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card interactive className="relative h-full">
      <article className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{ARTICLE_CATEGORY_LABEL[article.category]}</Badge>
          {article.status === "draft" ? (
            <Badge variant="warning">DRAFT</Badge>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold text-primary">
          {/* stretched-link：整卡可点，链接文本仍是标题（键盘/读屏可达） */}
          <Link
            to={`/writing/${article.slug}`}
            className="transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
          >
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-secondary">{article.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-tertiary">
          <time dateTime={article.createdAt}>{formatDate(article.createdAt)}</time>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5" />
            {article.readingTime} 分钟
          </span>
          {/* 次要 meta：移动端隐藏（基线 §12 信息密度） */}
          <span className="hidden flex-wrap gap-1.5 sm:flex">
            {article.tags.slice(0, 3).map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </span>
        </div>
      </article>
    </Card>
  );
}
