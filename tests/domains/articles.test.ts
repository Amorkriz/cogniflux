import { describe, expect, it } from "vitest";

import { privateArticles } from "@content/data/private-articles";

import {
  articleSchema,
  getArticleReferenceRecords,
  getArticleBySlug,
  getArticles,
} from "@/domains/articles";

describe("articles repository", () => {
  it("取列表：默认过滤草稿（仅 published）", async () => {
    const list = await getArticles({ includeDrafts: false });
    const slugs = list.map((a) => a.slug);
    expect(slugs).toContain("hello-cogniflux");
    expect(slugs).not.toContain("designing-agent-contracts");
    expect(list.every((a) => a.status === "published")).toBe(true);
  });

  it("取列表：includeDrafts 时草稿可见（超集）", async () => {
    const published = await getArticles({ includeDrafts: false });
    const withDrafts = await getArticles({ includeDrafts: true });
    expect(withDrafts.length).toBeGreaterThan(published.length);
    expect(withDrafts.map((a) => a.slug)).toContain("designing-agent-contracts");
  });

  it("取单条：published 命中并派生 readingTime", async () => {
    const detail = await getArticleBySlug("hello-cogniflux");
    expect(detail).toBeDefined();
    expect(detail?.article.category).toBe("buildlog");
    expect(detail?.article.lang).toBe("zh");
    expect(detail?.article.readingTime).toBeGreaterThan(0);
    expect(typeof detail?.load).toBe("function");
  });

  it("取单条：草稿在 production 语义下不可达", async () => {
    expect(
      await getArticleBySlug("designing-agent-contracts", {
        includeDrafts: false,
      }),
    ).toBeUndefined();
    expect(
      await getArticleBySlug("designing-agent-contracts", {
        includeDrafts: true,
      }),
    ).toBeDefined();
    expect(await getArticleBySlug("does-not-exist")).toBeUndefined();
  });

  it("related 正向：种子文章互引项目", async () => {
    const records = await getArticleReferenceRecords();
    const hello = records.find((r) => r.slug === "hello-cogniflux");
    expect(hello?.related).toContainEqual({
      kind: "project",
      slug: "cogniflux-platform",
    });
  });

  it("聚合出口排除私密（ADR-010）：引用记录不含 visibility=private 文章", async () => {
    const [records, articles] = await Promise.all([
      getArticleReferenceRecords(),
      getArticles({ includeDrafts: true }),
    ]);
    const recordSlugs = records.map((r) => r.slug);
    // 列表中的私密文章（占位卡需要）一律不得进引用图
    for (const article of articles) {
      if (article.visibility === "private") {
        expect(recordSlugs).not.toContain(article.slug);
      }
    }
    // 保护路径形态防线：引用图不允许出现 p-数字 slug
    expect(recordSlugs.some((slug) => /^p-\d/.test(slug))).toBe(false);
  });

  it("私密文章仍进列表（占位卡）且 frontmatter 为中性文案", async () => {
    const articles = await getArticles({ includeDrafts: false });
    const privates = articles.filter((a) => a.visibility === "private");
    // 列表不排除私密（由页面渲染中性占位卡）；中性约定由 validate-content 保障
    for (const article of privates) {
      expect(article.title).toBe("私密文章");
      expect(article.slug).toMatch(/^p-\d{4}-\d{3}$/);
    }
  });

  it("列表含注册表全部私密占位条目（中性字段）且整体按 createdAt 倒序", async () => {
    const list = await getArticles({ includeDrafts: false });
    for (const entry of privateArticles) {
      const item = list.find((a) => a.slug === entry.slug);
      expect(item).toBeDefined();
      expect(item?.title).toBe("私密文章");
      expect(item?.summary).toBe("");
      expect(item?.status).toBe("published");
      expect(item?.visibility).toBe("private");
      expect(item?.tags).toEqual([]);
      expect(item?.readingTime).toBe(1);
      expect(item?.createdAt).toBe(entry.createdAt);
    }
    const dates = list.map((a) => a.createdAt);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it("详情可取到私密条目（headings 空、正文仅懒加载）", async () => {
    for (const entry of privateArticles) {
      const detail = await getArticleBySlug(entry.slug);
      expect(detail).toBeDefined();
      expect(detail?.article.visibility).toBe("private");
      expect(detail?.article.title).toBe("私密文章");
      expect(detail?.headings).toEqual([]);
      expect(typeof detail?.load).toBe("function");
    }
  });

  it("schema 拒绝坏数据（非法 category）", () => {
    expect(() =>
      articleSchema.parse({
        slug: "bad",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-26",
        category: "not-a-category",
      }),
    ).toThrow();
  });
});
