declare module "*.mdx" {
  import type { ComponentType } from "react";

  /** remark-mdx-frontmatter 导出的 frontmatter（校验前视为 unknown） */
  export const frontmatter: unknown;
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
}
