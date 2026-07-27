import { getAgentReferenceRecords } from "@/domains/agents";
import { getArticleReferenceRecords } from "@/domains/articles";
import { getLabReferenceRecords } from "@/domains/lab";
import { getProjectReferenceRecords } from "@/domains/projects";
import { getToolReferenceRecords } from "@/domains/toolbox";
import { refKey } from "@/shared/types/reference";

import type { ContentRef } from "@/shared/types/base";
import type { ReferenceRecord, ResolvedRef } from "@/shared/types/reference";

/**
 * 跨领域反向关联聚合器（基线 §7 关联与聚合）。
 * 构建期从五个可引用领域（article/project/agent/lab/tool）拉取全量
 * ReferenceRecord（含正向 related），据此提供：
 *  - resolveRef / resolveRefs：ContentRef → ResolvedRef（title/href），渲染链接用；
 *  - getReferencesTo：谁引用了我（反查）。
 * 跨领域一律经对方 index.ts（基线 §6：禁 import 对方内部）。
 */

/** 拉取并合并全部领域的引用记录（不过滤 draft，反向图需覆盖全量） */
async function loadRecords(): Promise<ReferenceRecord[]> {
  const groups = await Promise.all([
    getArticleReferenceRecords(),
    getProjectReferenceRecords(),
    getAgentReferenceRecords(),
    getLabReferenceRecords(),
    getToolReferenceRecords(),
  ]);
  return groups.flat();
}

/** 去掉 related，只留展示级字段 */
function toResolved(record: ReferenceRecord): ResolvedRef {
  const { related: _related, ...resolved } = record;
  return resolved;
}

/** 解析单个引用为展示级结果；目标不存在时返回 undefined */
export async function resolveRef(
  ref: ContentRef,
): Promise<ResolvedRef | undefined> {
  const index = new Map(
    (await loadRecords()).map((r) => [refKey(r.kind, r.slug), r]),
  );
  const match = index.get(refKey(ref.kind, ref.slug));
  return match ? toResolved(match) : undefined;
}

/** 批量解析引用；自动跳过无法解析（悬空）的引用 */
export async function resolveRefs(
  refs: readonly ContentRef[],
): Promise<ResolvedRef[]> {
  const index = new Map(
    (await loadRecords()).map((r) => [refKey(r.kind, r.slug), r]),
  );
  return refs
    .map((ref) => index.get(refKey(ref.kind, ref.slug)))
    .filter((r): r is ReferenceRecord => r !== undefined)
    .map(toResolved);
}

/** 反查：返回所有 related 中包含 target 的内容（谁引用了我） */
export async function getReferencesTo(
  target: ContentRef,
): Promise<ResolvedRef[]> {
  const records = await loadRecords();
  return records
    .filter((record) =>
      record.related.some(
        (rel) => rel.kind === target.kind && rel.slug === target.slug,
      ),
    )
    .map(toResolved);
}
