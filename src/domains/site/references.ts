import { getAgentReferenceRecords } from "@/domains/agents";
import { getArticleReferenceRecords } from "@/domains/articles";
import { getLabReferenceRecords } from "@/domains/lab";
import { getProjectReferenceRecords } from "@/domains/projects";
import { getToolReferenceRecords } from "@/domains/toolbox";
import { refKey } from "@/shared/types/reference";
import { draftsVisibleByDefault, isVisible } from "@/shared/utils/content";

import type { ContentRef } from "@/shared/types/base";
import type { ReferenceRecord, ResolvedRef } from "@/shared/types/reference";
import type { DraftOptions } from "@/shared/utils/content";

/**
 * 跨领域反向关联聚合器（基线 §7 关联与聚合）。
 * 构建期从五个可引用领域（article/project/agent/lab/tool）拉取
 * ReferenceRecord（含正向 related 与 status），据此提供：
 *  - resolveRef / resolveRefs：ContentRef → ResolvedRef（title/href），渲染链接用；
 *  - getReferencesTo：谁引用了我（反查）。
 * 跨领域一律经对方 index.ts（基线 §6：禁 import 对方内部）。
 * 可见性与各领域列表语义一致（shared/utils/content）：draft 缺省仅 dev
 * 可见、生产过滤；archived 不可见，避免生产链接/序列化数据泄露 draft slug。
 */

/** 拉取并合并全部领域的引用记录，按可见性过滤（与列表页 draft 语义一致） */
async function fetchRecords(includeDrafts: boolean): Promise<ReferenceRecord[]> {
  const groups = await Promise.all([
    getArticleReferenceRecords(),
    getProjectReferenceRecords(),
    getAgentReferenceRecords(),
    getLabReferenceRecords(),
    getToolReferenceRecords(),
  ]);
  return groups.flat().filter((r) => isVisible(r.status, includeDrafts));
}

/**
 * 进程级缓存（按 includeDrafts 维度）：内容为构建期静态数据，
 * 同一进程内多次解析/反查无需重复全量拉取与过滤；
 * dev/prod 两种 draft 语义各自缓存，语义与无缓存时完全一致。
 * 缓存 Promise 而非结果，并发首次调用也只拉取一次。
 */
const recordsCache = new Map<boolean, Promise<ReferenceRecord[]>>();

function loadRecords(options?: DraftOptions): Promise<ReferenceRecord[]> {
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  let cached = recordsCache.get(includeDrafts);
  if (!cached) {
    cached = fetchRecords(includeDrafts);
    recordsCache.set(includeDrafts, cached);
  }
  return cached;
}

/** 去掉 status/related，只留展示级字段 */
function toResolved(record: ReferenceRecord): ResolvedRef {
  const { related: _related, status: _status, ...resolved } = record;
  return resolved;
}

/** 解析单个引用为展示级结果；目标不存在或不可见时返回 undefined */
export async function resolveRef(
  ref: ContentRef,
  options?: DraftOptions,
): Promise<ResolvedRef | undefined> {
  const index = new Map(
    (await loadRecords(options)).map((r) => [refKey(r.kind, r.slug), r]),
  );
  const match = index.get(refKey(ref.kind, ref.slug));
  return match ? toResolved(match) : undefined;
}

/** 批量解析引用；自动跳过无法解析（悬空或不可见）的引用 */
export async function resolveRefs(
  refs: readonly ContentRef[],
  options?: DraftOptions,
): Promise<ResolvedRef[]> {
  const index = new Map(
    (await loadRecords(options)).map((r) => [refKey(r.kind, r.slug), r]),
  );
  return refs
    .map((ref) => index.get(refKey(ref.kind, ref.slug)))
    .filter((r): r is ReferenceRecord => r !== undefined)
    .map(toResolved);
}

/** 反查：返回所有 related 中包含 target 的可见内容（谁引用了我） */
export async function getReferencesTo(
  target: ContentRef,
  options?: DraftOptions,
): Promise<ResolvedRef[]> {
  const records = await loadRecords(options);
  return records
    .filter((record) =>
      record.related.some(
        (rel) => rel.kind === target.kind && rel.slug === target.slug,
      ),
    )
    .map(toResolved);
}

/**
 * 净化实体的原始 related 引用列表：仅保留指向可见目标的引用。
 * loader 序列化实体前调用，避免生产产物（HTML/.data）泄露 draft slug。
 */
export async function sanitizeRelated<T extends { related: ContentRef[] }>(
  items: readonly T[],
  options?: DraftOptions,
): Promise<T[]> {
  const visible = new Set(
    (await loadRecords(options)).map((r) => refKey(r.kind, r.slug)),
  );
  return items.map((item) => ({
    ...item,
    related: item.related.filter((ref) => visible.has(refKey(ref.kind, ref.slug))),
  }));
}
