import { z } from "zod";

import { baseContentSchema, contentRefSchema } from "@/content-io/validate";

/**
 * Lab 领域 schema（基线 §7）：失败实验是一等公民（outcome:'failed' 正常展示）。
 */
export const labOutcomeSchema = z.enum([
  "success",
  "failed",
  "ongoing",
  "paused",
]);

export const labSchema = baseContentSchema.extend({
  hypothesis: z.string().min(1, { message: "hypothesis 必填" }),
  outcome: labOutcomeSchema,
  learnings: z.array(z.string()).default([]),
  related: contentRefSchema.array().default([]),
  /** 可选音频作品（如 AI 音乐实验）：src 指向 public 下静态资源 */
  audio: z
    .object({
      src: z.string().min(1),
      duration: z.number().positive().optional(),
      caption: z.string().optional(),
    })
    .optional(),
});
