import { describe, expect, it } from "vitest";

import {
  getNavigation,
  getReferencesTo,
  getSiteSettings,
  getSpotlight,
  resolveRef,
  resolveRefs,
} from "@/domains/site";

describe("site repository", () => {
  it("站点配置与导航（导航按 order 升序）", async () => {
    const settings = await getSiteSettings();
    expect(settings.title).toBe("Cogniflux");
    const nav = await getNavigation();
    const orders = nav.main.map((i) => i.order);
    expect([...orders]).toEqual([...orders].sort((a, b) => a - b));
    expect(nav.main).toHaveLength(8);
  });

  it("spotlight 解析为展示级链接", async () => {
    const spot = await getSpotlight();
    expect(spot).toEqual({
      kind: "project",
      slug: "cogniflux-platform",
      title: "Cogniflux 个人工作台",
      href: "/projects/cogniflux-platform",
    });
  });
});

describe("references 聚合器（正向解析 + 反向查询）", () => {
  it("resolveRef：article/project 生成正确 href，tool 回列表页", async () => {
    expect((await resolveRef({ kind: "article", slug: "hello-cogniflux" }))?.href).toBe(
      "/writing/hello-cogniflux",
    );
    expect((await resolveRef({ kind: "project", slug: "cogniflux-platform" }))?.href).toBe(
      "/projects/cogniflux-platform",
    );
    expect((await resolveRef({ kind: "tool", slug: "vite" }))?.href).toBe("/toolbox");
  });

  it("resolveRef：悬空引用返回 undefined", async () => {
    expect(await resolveRef({ kind: "article", slug: "ghost" })).toBeUndefined();
  });

  it("resolveRefs：批量解析并跳过悬空", async () => {
    const resolved = await resolveRefs([
      { kind: "project", slug: "cogniflux-platform" },
      { kind: "article", slug: "ghost" },
    ]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.slug).toBe("cogniflux-platform");
  });

  it("getReferencesTo：互引对反查（文章 ← 项目）", async () => {
    // 项目 cogniflux-platform 的 related 指向文章 hello-cogniflux，
    // 故反查“谁引用了 hello-cogniflux”应命中该项目。
    const refs = await getReferencesTo({ kind: "article", slug: "hello-cogniflux" });
    expect(refs.map((r) => r.slug)).toContain("cogniflux-platform");
  });

  it("getReferencesTo：反向图覆盖草稿（不受 draft 过滤影响）", async () => {
    // flux-agent-runtime 被 agent / lab / 草稿文章共同引用。
    const refs = await getReferencesTo({ kind: "project", slug: "flux-agent-runtime" });
    const slugs = refs.map((r) => r.slug);
    expect(slugs).toContain("refactor-navigator");
    expect(slugs).toContain("streaming-agent-latency");
    expect(slugs).toContain("designing-agent-contracts");
  });
});
