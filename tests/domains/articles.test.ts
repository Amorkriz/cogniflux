import { describe, expect, it } from "vitest";

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
