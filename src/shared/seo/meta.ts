import type { MetaDescriptor } from "react-router";

/**
 * 页面级 meta 组装工具（基线 §12 SEO）：title 模板 `{页面} · {站名}`、
 * description、canonical、OG/Twitter 卡。配合 RR 路由 meta 导出使用。
 */
export interface PageMetaArgs {
  /** 页面名（不含站名；absoluteTitle 时作为完整标题使用） */
  title: string;
  description: string;
  /** 站名（title 模板后缀） */
  siteTitle: string;
  /** 站点绝对 URL（如 https://example.com，无尾斜杠） */
  siteUrl: string;
  /** 当前路径（以 / 开头，如 /writing/slug） */
  path: string;
  /** OG 图（相对 public 或绝对 URL），缺省由调用方传站点默认图 */
  ogImage?: string;
  /** OG 类型：内容详情页用 article */
  type?: "website" | "article";
  /** true 时不套 `{页面} · {站名}` 模板（首页用） */
  absoluteTitle?: boolean;
  locale?: string;
}

/** 相对路径 → 绝对 URL（已是绝对 URL 时原样返回） */
export function toAbsoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function buildMeta({
  title,
  description,
  siteTitle,
  siteUrl,
  path,
  ogImage,
  type = "website",
  absoluteTitle = false,
  locale,
}: PageMetaArgs): MetaDescriptor[] {
  const fullTitle = absoluteTitle ? title : `${title} · ${siteTitle}`;
  const canonical = toAbsoluteUrl(siteUrl, path === "/" ? "/" : path.replace(/\/$/, ""));
  const image = ogImage ? toAbsoluteUrl(siteUrl, ogImage) : undefined;

  const descriptors: MetaDescriptor[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: siteTitle },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
  ];
  if (locale) descriptors.push({ property: "og:locale", content: locale });
  if (image) {
    descriptors.push(
      { property: "og:image", content: image },
      { name: "twitter:image", content: image },
    );
  }
  return descriptors;
}
