import { z } from "zod";

import { baseContentSchema } from "@/content-io/validate";

/**
 * Tool 领域 schema（基线 §7）：Toolbox 是纯列表页（无详情页）。
 * recommendLevel 1-3；无 related 字段（工具可被他者引用，但自身不引用）。
 */
export const toolCategorySchema = z.enum([
  "dev",
  "ai",
  "productivity",
  "hardware",
  "method",
]);

export const toolSchema = baseContentSchema.extend({
  category: toolCategorySchema,
  url: z.string().optional(),
  useCase: z.string().min(1, { message: "useCase 必填" }),
  recommendLevel: z.number().int().min(1).max(3),
});
