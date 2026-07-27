import { describe, expect, it } from "vitest";

import {
  getLatestNowUpdate,
  getNowUpdateBySlug,
  getNowUpdates,
  nowUpdateSchema,
} from "@/domains/now";

describe("now repository", () => {
  it("取列表：按 date 倒序", async () => {
    const list = await getNowUpdates({ includeDrafts: false });
    expect(list.map((n) => n.slug)).toEqual(["2026-07", "2026-06"]);
  });

  it("最新一条：2026-07", async () => {
    const latest = await getLatestNowUpdate({ includeDrafts: false });
    expect(latest?.slug).toBe("2026-07");
    expect(latest?.entries.length).toBeGreaterThan(0);
  });

  it("取单条：按 slug 命中", async () => {
    expect((await getNowUpdateBySlug("2026-06"))?.focus.length).toBeGreaterThan(0);
    expect(await getNowUpdateBySlug("1999-01")).toBeUndefined();
  });

  it("schema 拒绝坏数据（非法 entry.category）", () => {
    expect(() =>
      nowUpdateSchema.parse({
        slug: "2026-07",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-01",
        date: "2026-07",
        entries: [{ category: "sleeping", text: "z" }],
      }),
    ).toThrow();
  });
});
