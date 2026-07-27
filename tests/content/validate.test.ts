import { describe, expect, it } from "vitest";

import {
  ContentValidationError,
  validateBaseContent,
} from "@/content-io/validate";

const validFrontmatter = {
  slug: "hello-cogniflux",
  title: "Hello, Cogniflux",
  summary: "一段不超过 160 字的摘要。",
  status: "published",
  createdAt: "2026-07-26",
  tags: ["buildlog"],
};

describe("validateBaseContent", () => {
  it("接受合法的 BaseContent frontmatter", () => {
    const meta = validateBaseContent(validFrontmatter, "content/x/index.mdx");
    expect(meta.slug).toBe("hello-cogniflux");
    expect(meta.tags).toEqual(["buildlog"]);
  });

  it("tags 缺省时回填空数组", () => {
    const { tags: _tags, ...rest } = validFrontmatter;
    const meta = validateBaseContent(rest, "content/x/index.mdx");
    expect(meta.tags).toEqual([]);
  });

  it("缺少 summary 时抛错且报错含文件路径", () => {
    const { summary: _summary, ...rest } = validFrontmatter;
    const filePath = "content/articles/2026/hello-cogniflux/index.mdx";
    expect(() => validateBaseContent(rest, filePath)).toThrowError(
      ContentValidationError,
    );
    expect(() => validateBaseContent(rest, filePath)).toThrowError(
      new RegExp(filePath),
    );
  });

  it("拒绝非法 slug 与非法 status", () => {
    expect(() =>
      validateBaseContent(
        { ...validFrontmatter, slug: "Bad Slug" },
        "content/x/index.mdx",
      ),
    ).toThrowError(ContentValidationError);
    expect(() =>
      validateBaseContent(
        { ...validFrontmatter, status: "wip" },
        "content/x/index.mdx",
      ),
    ).toThrowError(ContentValidationError);
  });

  it("cover 存在时 alt 必填", () => {
    expect(() =>
      validateBaseContent(
        { ...validFrontmatter, cover: { src: "./cover.png", alt: "" } },
        "content/x/index.mdx",
      ),
    ).toThrowError(ContentValidationError);
  });
});
