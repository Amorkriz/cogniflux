import { describe, expect, it } from "vitest";

import { loadArticleEntries } from "@/content-io/loader";
import { frontmatter } from "@content/articles/2026/hello-cogniflux/index.mdx";

/** 走真实 vite MDX 管线（frontmatter 提取 + 编译），验证内容链路跑通 */
describe("MDX 内容管线", () => {
  it("种子文章 frontmatter 被提取为具名导出", () => {
    expect(frontmatter).toMatchObject({
      slug: "hello-cogniflux",
      status: "published",
    });
  });

  it("loader 扫描到种子文章并通过 Zod 校验", () => {
    const entries = loadArticleEntries();
    const seed = entries.find((e) => e.meta.slug === "hello-cogniflux");
    expect(seed).toBeDefined();
    expect(seed?.filePath).toContain(
      "/content/articles/2026/hello-cogniflux/index.mdx",
    );
  });

  it("MDX 正文可编译为组件（含 Shiki 高亮）", async () => {
    const entries = loadArticleEntries();
    const seed = entries.find((e) => e.meta.slug === "hello-cogniflux");
    const mod = await seed?.load();
    expect(typeof mod?.default).toBe("function");
  });
});
