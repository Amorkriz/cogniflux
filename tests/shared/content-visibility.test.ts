import { describe, expect, it } from "vitest";

import {
  byDateDesc,
  filterVisible,
  isPubliclyListable,
  isVisible,
} from "@/shared/utils/content";

describe("content visibility (draft 过滤核心逻辑)", () => {
  it("published 始终可见；archived 始终隐藏", () => {
    expect(isVisible("published", false)).toBe(true);
    expect(isVisible("published", true)).toBe(true);
    expect(isVisible("archived", true)).toBe(false);
    expect(isVisible("archived", false)).toBe(false);
  });

  it("draft 仅在 includeDrafts 时可见", () => {
    expect(isVisible("draft", true)).toBe(true);
    expect(isVisible("draft", false)).toBe(false);
  });

  it("filterVisible 依 includeDrafts 过滤草稿", () => {
    const items = [
      { status: "published" as const, id: 1 },
      { status: "draft" as const, id: 2 },
      { status: "archived" as const, id: 3 },
    ];
    expect(filterVisible(items, { includeDrafts: false }).map((i) => i.id)).toEqual([1]);
    expect(filterVisible(items, { includeDrafts: true }).map((i) => i.id)).toEqual([1, 2]);
  });

  it("byDateDesc 新→旧排序", () => {
    expect(["2026-06", "2026-07", "2026-05"].sort(byDateDesc)).toEqual([
      "2026-07",
      "2026-06",
      "2026-05",
    ]);
  });

  it("isPubliclyListable 与 status 正交：只看 visibility", () => {
    // 缺省/显式 public 可列出；private 不可列出
    expect(isPubliclyListable({})).toBe(true);
    expect(isPubliclyListable({ visibility: "public" })).toBe(true);
    expect(isPubliclyListable({ visibility: "private" })).toBe(false);
    // 与 status 无关：published+private 仍不可列出，draft+public 仍可列出
    const privatePublished = {
      status: "published" as const,
      visibility: "private" as const,
    };
    const publicDraft = { status: "draft" as const, visibility: undefined };
    expect(isVisible(privatePublished.status, false)).toBe(true);
    expect(isPubliclyListable(privatePublished)).toBe(false);
    expect(isVisible(publicDraft.status, false)).toBe(false);
    expect(isPubliclyListable(publicDraft)).toBe(true);
  });
});
