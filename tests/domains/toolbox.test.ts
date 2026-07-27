import { describe, expect, it } from "vitest";

import {
  getToolReferenceRecords,
  getToolBySlug,
  getTools,
  toolSchema,
} from "@/domains/toolbox";

describe("toolbox repository", () => {
  it("取列表：按 recommendLevel 降序", async () => {
    const list = await getTools({ includeDrafts: false });
    const levels = list.map((t) => t.recommendLevel);
    expect([...levels]).toEqual([...levels].sort((a, b) => b - a));
    expect(list[0]?.recommendLevel).toBe(3);
    expect(list.every((t) => t.status === "published")).toBe(true);
  });

  it("取单条：命中并含 category/useCase", async () => {
    const tool = await getToolBySlug("vite");
    expect(tool?.category).toBe("dev");
    expect(tool?.useCase.length).toBeGreaterThan(0);
    expect(await getToolBySlug("nope")).toBeUndefined();
  });

  it("反向关联：工具无自身 related（related 恒为空）", async () => {
    const records = await getToolReferenceRecords();
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((r) => r.related.length === 0)).toBe(true);
    expect(records[0]?.href).toBe("/toolbox");
  });

  it("schema 拒绝坏数据（recommendLevel 越界）", () => {
    expect(() =>
      toolSchema.parse({
        slug: "bad",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-26",
        category: "dev",
        useCase: "z",
        recommendLevel: 4,
      }),
    ).toThrow();
  });
});
