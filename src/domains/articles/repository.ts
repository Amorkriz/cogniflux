import { loadArticleEntries } from "@/content-io/loader";
import { refHref } from "@/shared/types/reference";
import {
  byDateDesc,
  draftsVisibleByDefault,
  filterVisible,
  isVisible,
} from "@/shared/utils/content";
import { extractHeadings } from "@/shared/utils/headings";

import { articleSchema } from "./schema";

import type { MdxModule } from "@/content-io/loader";
import type { ReferenceRecord } from "@/shared/types/reference";
import type { DraftOptions } from "@/shared/utils/content";
import type { HeadingItem } from "@/shared/utils/headings";
import type { Article } from "./types";

/**
 * Articles 本地适配器（基线 §3/§6/§7）：MDX 经 content-io 读取，
 * 经 articleSchema 校验，构建期估算 readingTime。接口签名统一 Promise 返回，
 * 未来换 CMS 只替换本文件实现，页面不改。
 */

/** 详情页所需：文章元数据 + 构建期 TOC 数据 + 懒加载正文组件 */
export interface ArticleDetail {
  article: Article;
  /** 正文 h2/h3 标题（TOC 用，锚点 id 与 Prose 渲染侧同源规则） */
  headings: HeadingItem[];
  /** 懒加载 MDX 正文组件（路由级代码分割） */
  load: () => Promise<MdxModule>;
}

/** 构建期由字数估算阅读时长：中文按字符（~400/分）、英文按单词（~200/分）混合 */
function estimateReadingTime(body: string): number {
  const text = body.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = (
    text.replace(/[\u4e00-\u9fff]/g, " ").match(/[A-Za-z0-9]+/g) ?? []
  ).length;
  return Math.max(1, Math.ceil(cjk / 400 + words / 200));
}

/** 读取并构建全部文章（含 draft，供列表过滤与反向关联扫描复用） */
function buildAll(): ArticleDetail[] {
  return loadArticleEntries().map((entry) => {
    const parsed = articleSchema.parse(entry.frontmatter);
    const article: Article = {
      ...parsed,
      readingTime: estimateReadingTime(entry.body),
    };
    return { article, headings: extractHeadings(entry.body), load: entry.load };
  });
}

/** 文章列表（默认按环境过滤 draft，按 createdAt 倒序） */
export function getArticles(options?: DraftOptions): Promise<Article[]> {
  const all = buildAll().map((detail) => detail.article);
  const visible = filterVisible(all, options).sort((a, b) =>
    byDateDesc(a.createdAt, b.createdAt),
  );
  return Promise.resolve(visible);
}

/** 按 slug 取单篇（含正文加载器）；不可见（如 draft 在生产）时返回 undefined */
export function getArticleBySlug(
  slug: string,
  options?: DraftOptions,
): Promise<ArticleDetail | undefined> {
  const detail = buildAll().find((item) => item.article.slug === slug);
  if (!detail) return Promise.resolve(undefined);
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  if (!isVisible(detail.article.status, includeDrafts)) {
    return Promise.resolve(undefined);
  }
  return Promise.resolve(detail);
}

/** 反向关联索引单元（构建期扫描全量 related，携带 status 供聚合器按可见性过滤） */
export function getArticleReferenceRecords(): Promise<ReferenceRecord[]> {
  const records = buildAll().map(({ article }) => ({
    kind: "article" as const,
    slug: article.slug,
    title: article.title,
    href: refHref("article", article.slug),
    status: article.status,
    related: article.related,
  }));
  return Promise.resolve(records);
}
