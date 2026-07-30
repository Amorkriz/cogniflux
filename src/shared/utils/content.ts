/**
 * 内容可见性与草稿过滤（基线 §7/§8）。
 * 规则：published 始终可见；draft 仅在 includeDrafts（默认取 dev 环境）时可见；
 * archived 从列表中隐藏（仍可按 slug 存在于反向关联图中）。
 * 生产构建 import.meta.env.DEV === false ⇒ 自动过滤草稿。
 */
import type { ContentStatus } from "@/shared/types/base";

export interface DraftOptions {
  /** 覆盖默认草稿可见性（测试/预览用）；缺省取 import.meta.env.DEV */
  includeDrafts?: boolean;
}

/** 默认是否展示草稿：dev 可见、production 过滤 */
export function draftsVisibleByDefault(): boolean {
  return import.meta.env.DEV === true;
}

export function isVisible(status: ContentStatus, includeDrafts: boolean): boolean {
  if (status === "published") return true;
  if (status === "draft") return includeDrafts;
  return false; // archived 不进列表
}

export function filterVisible<T extends { status: ContentStatus }>(
  items: readonly T[],
  options?: DraftOptions,
): T[] {
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  return items.filter((item) => isVisible(item.status, includeDrafts));
}

/** 按 ISO 日期字符串倒序（新→旧）比较器 */
export function byDateDesc(a: string, b: string): number {
  return a < b ? 1 : a > b ? -1 : 0;
}

/**
 * 聚合出口可列出性（ADR-010）：visibility=private 的内容不得把
 * slug/title 带到其他公开页面（首页最新/反向关联/related 链路等）。
 * 与 status 正交：只看 visibility，draft 过滤仍由 isVisible 负责。
 */
export function isPubliclyListable(item: {
  visibility?: "public" | "private";
}): boolean {
  return item.visibility !== "private";
}
