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
});
