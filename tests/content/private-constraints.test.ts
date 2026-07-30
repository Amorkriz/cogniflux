import { describe, expect, it } from "vitest";

import {
  collectPrivateConstraintIssues,
  PRIVATE_SUMMARY,
  PRIVATE_TITLE,
} from "../../scripts/validate-content";

import type { BaseContent } from "@/shared/types/base";

/** 合规私密文章 meta 基座（ADR-010 中性约定） */
const privateMeta: BaseContent = {
  slug: "p-2026-001",
  title: PRIVATE_TITLE,
  summary: PRIVATE_SUMMARY,
  status: "published",
  visibility: "private",
  createdAt: "2026-07-30",
  tags: [],
};

describe("validate-content 私密约束（ADR-010）", () => {
  it("合规私密文章无违规", () => {
    expect(collectPrivateConstraintIssues(privateMeta, {})).toEqual([]);
  });

  it("summary 置空也合规", () => {
    expect(
      collectPrivateConstraintIssues({ ...privateMeta, summary: "" }, {}),
    ).toEqual([]);
  });

  it("私密文章非 published 报错", () => {
    const issues = collectPrivateConstraintIssues(
      { ...privateMeta, status: "draft" },
      {},
    );
    expect(issues.some((i) => i.includes("published"))).toBe(true);
  });

  it("私密文章 slug 不合规报错", () => {
    const issues = collectPrivateConstraintIssues(
      { ...privateMeta, slug: "my-secret-post" },
      {},
    );
    expect(issues.some((i) => i.startsWith("slug:"))).toBe(true);
  });

  it("私密文章 title 非中性文案报错", () => {
    const issues = collectPrivateConstraintIssues(
      { ...privateMeta, title: "真实标题" },
      {},
    );
    expect(issues.some((i) => i.startsWith("title:"))).toBe(true);
  });

  it("私密文章 summary 携带真实摘要报错", () => {
    const issues = collectPrivateConstraintIssues(
      { ...privateMeta, summary: "泄露真实摘要" },
      {},
    );
    expect(issues.some((i) => i.startsWith("summary:"))).toBe(true);
  });

  it("私密文章不得设置 cover/seo/related", () => {
    const issues = collectPrivateConstraintIssues(privateMeta, {
      cover: { src: "./cover.png", alt: "x" },
      seo: { title: "x" },
      related: [{ kind: "project", slug: "x" }],
    });
    expect(issues.some((i) => i.startsWith("cover:"))).toBe(true);
    expect(issues.some((i) => i.startsWith("seo:"))).toBe(true);
    expect(issues.some((i) => i.startsWith("related:"))).toBe(true);
  });

  it("公开文章 slug 以 p-数字 形态开头报错（防误撞保护路径）", () => {
    const issues = collectPrivateConstraintIssues(
      {
        ...privateMeta,
        visibility: "public",
        slug: "p-2026-002",
        title: "普通文章",
        summary: "普通摘要",
      },
      {},
    );
    expect(issues.some((i) => i.includes("/writing/p-"))).toBe(true);
  });

  it("公开文章普通 slug 不受影响（p 开头但非 p-数字 也合法）", () => {
    const base = {
      ...privateMeta,
      visibility: "public" as const,
      title: "普通文章",
      summary: "普通摘要",
    };
    expect(
      collectPrivateConstraintIssues({ ...base, slug: "hello-cogniflux" }, {}),
    ).toEqual([]);
    expect(
      collectPrivateConstraintIssues({ ...base, slug: "p-adic-numbers" }, {}),
    ).toEqual([]);
  });
});
