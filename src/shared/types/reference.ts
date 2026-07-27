/**
 * 跨内容引用解析类型（基线 §7 关联与聚合）。
 * ContentRef 只存 kind+slug；渲染时由 repository 解析为 ResolvedRef
 * （带 title/href），反向索引由构建期扫描 ReferenceRecord 生成。
 * 放在 shared 层：所有领域共用，且不产生对 domains 的反向依赖。
 */
import type { ContentRef, ContentStatus } from "./base";

export type ContentKind = ContentRef["kind"];

/** 一个可引用内容的展示级解析结果（渲染 related 链接时用） */
export interface ResolvedRef {
  kind: ContentKind;
  slug: string;
  title: string;
  href: string;
}

/** 构建期反向关联索引的单元：解析结果 + 可见性状态 + 其正向 related 列表 */
export interface ReferenceRecord extends ResolvedRef {
  status: ContentStatus;
  related: ContentRef[];
}

/** 各内容类型的路由基路径（与 content/data/site.ts 导航一致） */
const BASE_PATH: Record<ContentKind, string> = {
  article: "/writing",
  project: "/projects",
  agent: "/agents",
  lab: "/lab",
  tool: "/toolbox",
};

/** 由 kind+slug 生成站内链接；tool 无详情页，统一回 Toolbox 列表 */
export function refHref(kind: ContentKind, slug: string): string {
  if (kind === "tool") return BASE_PATH.tool;
  return `${BASE_PATH[kind]}/${slug}`;
}

/** 引用唯一键（用于建图/去重） */
export function refKey(kind: ContentKind, slug: string): string {
  return `${kind}:${slug}`;
}
