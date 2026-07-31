import { Link } from "react-router";

import { Badge, Card, Lock } from "@/shared/ui";
import { formatDate } from "@/shared/utils";

/**
 * 私密文章占位卡（ADR-010）：对所有访客展示统一中性占位——
 * 锁图标 + “私密文章” + 日期，真实标题/摘要不进入任何公开 HTML。
 */
export interface PrivateArticleCardProps {
  slug: string;
  /** ISO 日期 */
  createdAt: string;
}

export function PrivateArticleCard({ slug, createdAt }: PrivateArticleCardProps) {
  return (
    <Card interactive className="relative h-full">
      <article className="flex h-full min-h-11 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            <Lock aria-hidden="true" />
            私密
          </Badge>
        </div>
        <h3 className="text-lg font-semibold text-primary">
          {/* stretched-link：整卡可点，链接文本仍是标题（键盘/读屏可达） */}
          {/* reloadDocument：整页跳转跳过 .data 预取——客户端导航的 .data 请求会被 nginx 鉴权拦截，turbo-stream 解码失败落错误边界 */}
          <Link
            to={`/writing/${slug}`}
            reloadDocument
            className="transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
          >
            私密文章
          </Link>
        </h3>
        <p className="text-sm text-secondary">该文章仅作者可见。</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-tertiary">
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
        </div>
      </article>
    </Card>
  );
}
