import type { articleSchema, articleCategorySchema } from "./schema";
import type { z } from "zod";

/** frontmatter 校验后的文章字段（不含派生的 readingTime） */
export type ArticleFrontmatter = z.infer<typeof articleSchema>;

export type ArticleCategory = z.infer<typeof articleCategorySchema>;

/** 完整文章领域对象：frontmatter + 构建期派生字段 */
export interface Article extends ArticleFrontmatter {
  /** 构建期由正文字数估算的阅读时长（分钟，≥1） */
  readingTime: number;
}
