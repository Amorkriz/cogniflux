/**
 * Articles 领域唯一公开出口（基线 §6：对外只经 index.ts）。
 */
export type {
  Article,
  ArticleFrontmatter,
  ArticleCategory,
} from "./types";
export { articleSchema, articleCategorySchema } from "./schema";
export {
  getArticles,
  getArticleBySlug,
  getArticleReferenceRecords,
} from "./repository";
export type { ArticleDetail } from "./repository";
export { ArticleCard, ARTICLE_CATEGORY_LABEL } from "./components/ArticleCard";
