import { nowUpdates as nowData } from "@content/data/now";

import {
  byDateDesc,
  draftsVisibleByDefault,
  filterVisible,
  isVisible,
} from "@/shared/utils/content";

import { nowUpdateSchema } from "./schema";

import type { DraftOptions } from "@/shared/utils/content";
import type { NowUpdate } from "./types";

/**
 * Now 本地适配器（基线 §6/§7）：结构化数据 import 自 @content/data，
 * 按月倒序时间线。NowUpdate 非 ContentRef 类型，无反向关联。
 */
function buildAll(): NowUpdate[] {
  return nowUpdateSchema.array().parse(nowData);
}

/** 近况列表（默认按环境过滤 draft，按 date 倒序） */
export function getNowUpdates(options?: DraftOptions): Promise<NowUpdate[]> {
  const visible = filterVisible(buildAll(), options).sort((a, b) =>
    byDateDesc(a.date, b.date),
  );
  return Promise.resolve(visible);
}

/** 最新一条近况（首页/Now 页头部展示用） */
export function getLatestNowUpdate(
  options?: DraftOptions,
): Promise<NowUpdate | undefined> {
  return getNowUpdates(options).then((list) => list[0]);
}

/** 按 slug（形如 2026-07）取单条 */
export function getNowUpdateBySlug(
  slug: string,
  options?: DraftOptions,
): Promise<NowUpdate | undefined> {
  const update = buildAll().find((item) => item.slug === slug);
  if (!update) return Promise.resolve(undefined);
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  if (!isVisible(update.status, includeDrafts)) {
    return Promise.resolve(undefined);
  }
  return Promise.resolve(update);
}
