/**
 * 内容共享基座（基线 §7）：所有可发布内容继承 BaseContent，
 * 保证列表页 / 详情页 / SEO 处理逻辑可复用。
 * 对应 Zod schema 见 src/content-io/validate.ts（z.infer 保证不漂移）。
 */

export type ContentStatus = "draft" | "published" | "archived";

export interface BaseContent {
  /** URL 标识，小写连字符 */
  slug: string;
  title: string;
  /** 列表页摘要，≤160 字，兼作默认 SEO description */
  summary: string;
  status: ContentStatus;
  /** 可见性（ADR-010）：private 由 nginx auth_request 拦截；缺省视为 public */
  visibility?: "public" | "private";
  /** ISO 日期 */
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  cover?: { src: string; alt: string };
  /** 精选（首页跨类型聚合） */
  featured?: boolean;
  featuredOrder?: number;
  seo?: { title?: string; description?: string; ogImage?: string };
}

/** 内容引用：只存 kind + slug，渲染时由 repository 解析（避免改标题后引用过期） */
export interface ContentRef {
  kind: "article" | "project" | "agent" | "lab" | "tool";
  slug: string;
}
