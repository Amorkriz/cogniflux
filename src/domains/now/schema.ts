import { z } from "zod";

import { baseContentSchema } from "@/content-io/validate";

/**
 * NowUpdate 领域 schema（基线 §7）：每月一条记录，slug 形如 `2026-07`，
 * 按月倒序时间线展示。
 */
export const nowEntryCategorySchema = z.enum([
  "building",
  "learning",
  "reading",
  "thinking",
]);

export const nowEntrySchema = z.object({
  category: nowEntryCategorySchema,
  text: z.string().min(1),
  link: z.string().optional(),
});

export const nowUpdateSchema = baseContentSchema.extend({
  date: z.string().min(1),
  focus: z.array(z.string()).default([]),
  /** 正在学习（视觉改版：首页 NowStrip 的 CURRENTLY LEARNING 行） */
  currentlyLearning: z.array(z.string()).default([]),
  /** 开放合作方向（视觉改版：首页 NowStrip 的 OPEN TO 行） */
  openTo: z.array(z.string()).default([]),
  entries: z.array(nowEntrySchema).default([]),
});
