import type { Route } from "./+types/index";
import { ArticleCard, getArticles, PrivateArticleCard } from "@/domains/articles";
import { getSiteSettings, sanitizeRelated } from "@/domains/site";
import { PageHero } from "@/shared/components";
import { Stagger } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import { EmptyState, PenLine } from "@/shared/ui";

export async function loader() {
  const [site, rawArticles] = await Promise.all([getSiteSettings(), getArticles()]);
  // 序列化前净化 related，避免生产产物泄露 draft slug
  const articles = await sanitizeRelated(rawArticles);
  return { site, articles };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site } = data;
  return buildMeta({
    title: "Writing",
    description: "工程、Agent 与思考的长文——构建日志也是一等公民。",
    siteTitle: site.title,
    siteUrl: site.url,
    path: "/writing",
    ogImage: site.defaultOg,
    locale: site.locale,
  });
}

/** Writing：文章列表（title/summary/date/tags/readingTime/category） */
export default function Writing({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="writing"
        title="Writing"
        description="工程、Agent 与思考的长文——构建日志也是一等公民。"
      />
      {articles.length > 0 ? (
        <Stagger className="mt-block grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) =>
            article.visibility === "private" ? (
              // 私密文章（ADR-010）：统一中性占位卡，真实标题不进公开 HTML
              <PrivateArticleCard
                key={article.slug}
                slug={article.slug}
                createdAt={article.createdAt}
              />
            ) : (
              <ArticleCard key={article.slug} article={article} />
            ),
          )}
        </Stagger>
      ) : (
        <div className="mt-block">
          <EmptyState
            icon={<PenLine />}
            title="还没有文章"
            description="第一篇文章正在路上。"
          />
        </div>
      )}
    </div>
  );
}
