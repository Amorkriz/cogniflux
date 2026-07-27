import { loadLabEntries } from "@/content-io/loader";
import { refHref } from "@/shared/types/reference";
import {
  byDateDesc,
  draftsVisibleByDefault,
  filterVisible,
  isVisible,
} from "@/shared/utils/content";

import { labSchema } from "./schema";

import type { MdxModule } from "@/content-io/loader";
import type { ReferenceRecord } from "@/shared/types/reference";
import type { DraftOptions } from "@/shared/utils/content";
import type { LabExperiment } from "./types";

/**
 * Lab 本地适配器（基线 §6/§7）：MDX 经 content-io 读取并经 labSchema 校验。
 */

/** 详情页所需：实验元数据 + 懒加载过程记录正文 */
export interface LabDetail {
  experiment: LabExperiment;
  load: () => Promise<MdxModule>;
}

function buildAll(): LabDetail[] {
  return loadLabEntries().map((entry) => ({
    experiment: labSchema.parse(entry.frontmatter),
    load: entry.load,
  }));
}

/** 实验列表（默认按环境过滤 draft，按 createdAt 倒序） */
export function getLabExperiments(
  options?: DraftOptions,
): Promise<LabExperiment[]> {
  const all = buildAll().map((detail) => detail.experiment);
  const visible = filterVisible(all, options).sort((a, b) =>
    byDateDesc(a.createdAt, b.createdAt),
  );
  return Promise.resolve(visible);
}

/** 按 slug 取单条实验（含正文加载器） */
export function getLabExperimentBySlug(
  slug: string,
  options?: DraftOptions,
): Promise<LabDetail | undefined> {
  const detail = buildAll().find((item) => item.experiment.slug === slug);
  if (!detail) return Promise.resolve(undefined);
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  if (!isVisible(detail.experiment.status, includeDrafts)) {
    return Promise.resolve(undefined);
  }
  return Promise.resolve(detail);
}

/** 反向关联索引单元（构建期扫描全量 related） */
export function getLabReferenceRecords(): Promise<ReferenceRecord[]> {
  const records = buildAll().map(({ experiment }) => ({
    kind: "lab" as const,
    slug: experiment.slug,
    title: experiment.title,
    href: refHref("lab", experiment.slug),
    related: experiment.related,
  }));
  return Promise.resolve(records);
}
