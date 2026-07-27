import { z } from "zod";

import { baseContentSchema, contentRefSchema } from "@/content-io/validate";

/**
 * Article 领域 schema（基线 §7）：基座 + 文章扩展字段。
 * readingTime 为构建期由正文字数估算，不在 frontmatter 中，故不入本 schema
 * （由 repository 计算后合入 Article 类型）。
 */
export const articleCategorySchema = z.enum([
  "engineering",
  "agents",
  "thinking",
  "buildlog",
]);

export const articleSchema = baseContentSchema.extend({
  category: articleCategorySchema,
  series: z.string().optional(),
  seriesIndex: z.number().int().positive().optional(),
  lang: z.string().default("zh"),
  related: contentRefSchema.array().default([]),
});
