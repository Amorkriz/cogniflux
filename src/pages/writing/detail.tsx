import { lazy, Suspense } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/detail";
import {
  ARTICLE_CATEGORY_LABEL,
  getArticleBySlug,
  getArticles,
} from "@/domains/articles";
import { getProfile } from "@/domains/profile";
import {
  getReferencesTo,
  getSiteSettings,
  resolveRefs,
  sanitizeRelated,
} from "@/domains/site";
import { Prose, RelatedRefs } from "@/shared/components";
import { FadeIn, SlideUp } from "@/shared/motion";
import { blogPostingJsonLd, buildMeta } from "@/shared/seo";
import {
  ArrowLeft,
  ArrowRight,
  Badge,
  Clock,
  Separator,
  Skeleton,
  Tag,
} from "@/shared/ui";
import { formatDate } from "@/shared/utils";

import type { ComponentType } from "react";

/** 构建期取数：详情 meta + TOC + 关联/被引用 + 上一篇/下一篇（正文经 lazy 单独分包） */
export async function loader({ params }: Route.LoaderArgs) {
  const detail = await getArticleBySlug(params.slug);
  if (!detail) {
    throw new Response("Not Found", { status: 404 });
  }
  const { article, headings } = detail;
  const [site, related, referencedBy, articles, profile, [safeArticle]] =
    await Promise.all([
      getSiteSettings(),
      resolveRefs(article.related),
      getReferencesTo({ kind: "article", slug: article.slug }),
      getArticles(),
      getProfile(),
      // 序列化前净化 related，避免生产产物泄露 draft slug
      sanitizeRelated([article]),
    ]);
  const index = articles.findIndex((item) => item.slug === article.slug);
  const newer = index > 0 ? articles[index - 1] : undefined;
  const older =
    index >= 0 && index < articles.length - 1 ? articles[index + 1] : undefined;
  return {
    site,
    article: safeArticle ?? article,
    headings,
    related,
    referencedBy,
    authorName: profile.name,
    newer: newer ? { slug: newer.slug, title: newer.title } : null,
    older: older ? { slug: older.slug, title: older.title } : null,
  };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site, article } = data;
  const path = `/writing/${article.slug}`;
  const description = article.seo?.description ?? article.summary;
  const ogImage = article.seo?.ogImage ?? article.cover?.src ?? site.defaultOg;
  return [
    ...buildMeta({
      title: article.seo?.title ?? article.title,
      description,
      siteTitle: site.title,
      siteUrl: site.url,
      path,
      ogImage,
      type: "article",
      locale: site.locale,
    }),
    blogPostingJsonLd({
      headline: article.title,
      description,
      siteUrl: site.url,
      path,
      datePublished: article.createdAt,
      dateModified: article.updatedAt,
      authorName: data.authorName,
      image: ogImage,
      inLanguage: site.locale,
    }),
  ];
}

type MdxContent = ComponentType<{
  components?: Record<string, ComponentType<never>>;
}>;

/** 正文懒加载缓存：同一 slug 只创建一次 lazy 组件（避免重渲染丢 Suspense 状态） */
const bodyCache = new Map<string, MdxContent>();

function articleBody(slug: string): MdxContent {
  const cached = bodyCache.get(slug);
  if (cached) return cached;
  const Body = lazy(async () => {
    const detail = await getArticleBySlug(slug);
    if (!detail) throw new Error(`文章正文缺失：${slug}`);
    const mod = await detail.load();
    return { default: mod.default };
  });
  bodyCache.set(slug, Body);
  return Body;
}

function BodyFallback() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-11/12" />
      <Skeleton className="h-5 w-4/5" />
    </div>
  );
}

/** 文章详情：MDX 正文（Shiki 高亮）+ TOC + related/被引用 + 上一篇/下一篇 */
export default function WritingDetail({ loaderData }: Route.ComponentProps) {
  const { article, headings, related, referencedBy, newer, older } = loaderData;
  const Body = articleBody(article.slug);

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <SlideUp>
        <header>
          <Link
            to="/writing"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tertiary transition-colors duration-(--motion-fast) hover:text-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回 Writing
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {ARTICLE_CATEGORY_LABEL[article.category]}
            </Badge>
            {article.status === "draft" ? (
              <Badge variant="warning">DRAFT</Badge>
            ) : null}
          </div>
          <h1 className="mt-3 max-w-prose-container text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 max-w-prose-container text-lg text-secondary">
            {article.summary}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-tertiary">
            <time dateTime={article.createdAt}>
              {formatDate(article.createdAt)}
            </time>
            {article.updatedAt ? (
              <span>更新于 {formatDate(article.updatedAt)}</span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-4" />
              {article.readingTime} 分钟
            </span>
            {article.tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        </header>
      </SlideUp>

      <div className="mt-block gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_14rem]">
        <FadeIn delay={0.12}>
          <Suspense fallback={<BodyFallback />}>
            <Prose body={Body} />
          </Suspense>
        </FadeIn>

        {headings.length > 0 ? (
          <FadeIn delay={0.2} className="hidden lg:block">
            <nav aria-label="目录" className="sticky top-24">
              <p className="font-mono text-xs text-tertiary">目录</p>
              <ul className="mt-3 flex flex-col gap-1 border-l border-default">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={`block border-l-2 border-transparent py-1 pl-3 text-sm text-secondary transition-colors duration-(--motion-fast) hover:border-accent hover:text-accent ${
                        heading.depth === 3 ? "pl-6" : ""
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </FadeIn>
        ) : null}
      </div>

      <RelatedRefs id="article-related" title="相关内容" refs={related} />
      <RelatedRefs id="article-referenced" title="被这些内容引用" refs={referencedBy} />

      {newer || older ? (
        <>
          <Separator className="mt-section" />
          <nav
            aria-label="文章导航"
            className="mt-block flex flex-col gap-4 sm:flex-row sm:justify-between"
          >
            {older ? (
              <Link
                to={`/writing/${older.slug}`}
                className="group inline-flex min-h-11 items-center gap-2 text-sm text-secondary transition-colors duration-(--motion-fast) hover:text-accent"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                <span>
                  <span className="block font-mono text-xs text-tertiary">
                    上一篇
                  </span>
                  {older.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link
                to={`/writing/${newer.slug}`}
                className="group inline-flex min-h-11 items-center gap-2 text-sm text-secondary transition-colors duration-(--motion-fast) hover:text-accent sm:text-right"
              >
                <span>
                  <span className="block font-mono text-xs text-tertiary">
                    下一篇
                  </span>
                  {newer.title}
                </span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
          </nav>
        </>
      ) : null}
    </div>
  );
}
