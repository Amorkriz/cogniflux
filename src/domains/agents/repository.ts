import { agents as agentsData } from "@content/data/agents";

import { refHref } from "@/shared/types/reference";
import {
  byDateDesc,
  draftsVisibleByDefault,
  filterVisible,
  isVisible,
} from "@/shared/utils/content";

import { agentSchema } from "./schema";

import type { ReferenceRecord } from "@/shared/types/reference";
import type { DraftOptions } from "@/shared/utils/content";
import type { Agent } from "./types";

/**
 * Agents 本地适配器（基线 §6/§7）：结构化数据 import 自 @content/data。
 */
function buildAll(): Agent[] {
  return agentSchema.array().parse(agentsData);
}

/** Agent 列表（默认按环境过滤 draft，按 createdAt 倒序） */
export function getAgents(options?: DraftOptions): Promise<Agent[]> {
  const visible = filterVisible(buildAll(), options).sort((a, b) =>
    byDateDesc(a.createdAt, b.createdAt),
  );
  return Promise.resolve(visible);
}

/** 按 slug 取单个 Agent */
export function getAgentBySlug(
  slug: string,
  options?: DraftOptions,
): Promise<Agent | undefined> {
  const agent = buildAll().find((item) => item.slug === slug);
  if (!agent) return Promise.resolve(undefined);
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  if (!isVisible(agent.status, includeDrafts)) {
    return Promise.resolve(undefined);
  }
  return Promise.resolve(agent);
}

/** 反向关联索引单元（构建期扫描全量 related） */
export function getAgentReferenceRecords(): Promise<ReferenceRecord[]> {
  const records = buildAll().map((agent) => ({
    kind: "agent" as const,
    slug: agent.slug,
    title: agent.title,
    href: refHref("agent", agent.slug),
    status: agent.status,
    related: agent.related,
  }));
  return Promise.resolve(records);
}
