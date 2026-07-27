import rehypeShiki from "@shikijs/rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

import type { CompileOptions } from "@mdx-js/mdx";

/**
 * MDX 编译管线（构建期，零运行时高亮 JS，基线 §7）：
 * - remark-frontmatter + remark-mdx-frontmatter：frontmatter 提取为
 *   模块具名导出 `frontmatter`（loader 读取后交 Zod 校验）。
 * - @shikijs/rehype：构建期代码高亮，双主题输出 CSS 变量，
 *   随 data-theme 切换（--shiki-dark 系列）。
 */
export const mdxOptions: CompileOptions = {
  remarkPlugins: [
    remarkFrontmatter,
    [remarkMdxFrontmatter, { name: "frontmatter" }],
  ],
  rehypePlugins: [
    [
      rehypeShiki,
      {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: "light",
      },
    ],
  ],
};
