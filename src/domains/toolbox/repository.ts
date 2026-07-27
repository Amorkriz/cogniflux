import { tools as toolsData } from "@content/data/tools";

import { refHref } from "@/shared/types/reference";
import { filterVisible, isVisible, draftsVisibleByDefault } from "@/shared/utils/content";

import { toolSchema } from "./schema";

import type { ReferenceRecord } from "@/shared/types/reference";
import type { DraftOptions } from "@/shared/utils/content";
import type { Tool } from "./types";

/**
 * Toolbox 本地适配器（基线 §6/§7）：结构化数据 import 自 @content/data。
 */
function buildAll(): Tool[] {
  return toolSchema.array().parse(toolsData);
}

/** 工具列表（默认按环境过滤 draft；按推荐等级降序、同级按标题） */
export function getTools(options?: DraftOptions): Promise<Tool[]> {
  const visible = filterVisible(buildAll(), options).sort(
    (a, b) =>
      b.recommendLevel - a.recommendLevel || a.title.localeCompare(b.title),
  );
  return Promise.resolve(visible);
}

/** 按 slug 取单个工具 */
export function getToolBySlug(
  slug: string,
  options?: DraftOptions,
): Promise<Tool | undefined> {
  const tool = buildAll().find((item) => item.slug === slug);
  if (!tool) return Promise.resolve(undefined);
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  if (!isVisible(tool.status, includeDrafts)) {
    return Promise.resolve(undefined);
  }
  return Promise.resolve(tool);
}

/** 反向关联索引单元：工具无自身 related，但可作为他者引用目标 */
export function getToolReferenceRecords(): Promise<ReferenceRecord[]> {
  const records = buildAll().map((tool) => ({
    kind: "tool" as const,
    slug: tool.slug,
    title: tool.title,
    href: refHref("tool", tool.slug),
    related: [],
  }));
  return Promise.resolve(records);
}
