/**
 * 私密文章中性注册表（ADR-010）。
 * 私密 MDX 不进任何 eager glob（正文字节不得进入公开 chunk），
 * 列表/详情所需元数据一律由本注册表构造（src/domains/articles/repository.ts）。
 * 只允许中性信息（slug 编号 + 日期），严禁真实标题/摘要。
 * 与文章目录的双向一致性由 scripts/validate-content.ts 校验。
 */
export interface PrivateArticleRegistryEntry {
  /** 中性 slug 编号（p-年份-序号），与 content/articles/{年}/{slug}/ 目录名一致 */
  slug: string;
  /** 创建日期（ISO），须与该文章 frontmatter 的 createdAt 一致 */
  createdAt: string;
}

export const privateArticles: PrivateArticleRegistryEntry[] = [
  { slug: "p-2026-001", createdAt: "2026-07-31" },
];
