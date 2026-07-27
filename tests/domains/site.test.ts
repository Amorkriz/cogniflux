import { describe, expect, it } from "vitest";

import {
  getNavigation,
  getReferencesTo,
  getSiteSettings,
  getSpotlight,
  resolveRef,
  resolveRefs,
  sanitizeRelated,
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

  it("getReferencesTo：dev 语义（includeDrafts）下反向图覆盖草稿来源", async () => {
    // flux-agent-runtime 被 agent / lab / 草稿文章共同引用；写作预览需全部可见。
    const refs = await getReferencesTo(
      { kind: "project", slug: "flux-agent-runtime" },
      { includeDrafts: true },
    );
    const slugs = refs.map((r) => r.slug);
    expect(slugs).toContain("refactor-navigator");
    expect(slugs).toContain("streaming-agent-latency");
    expect(slugs).toContain("designing-agent-contracts");
  });

  it("生产语义：resolveRef/resolveRefs 跳过 draft 目标", async () => {
    // draft 项目在生产不预渲染，解析为链接会 404，必须过滤。
    expect(
      await resolveRef(
        { kind: "project", slug: "flux-agent-runtime" },
        { includeDrafts: false },
      ),
    ).toBeUndefined();
    const resolved = await resolveRefs(
      [
        { kind: "project", slug: "flux-agent-runtime" },
        { kind: "project", slug: "cogniflux-platform" },
      ],
      { includeDrafts: false },
    );
    expect(resolved.map((r) => r.slug)).toEqual(["cogniflux-platform"]);
  });

  it("生产语义：getReferencesTo 不返回 draft 来源，保留 published 来源", async () => {
    const refs = await getReferencesTo(
      { kind: "project", slug: "flux-agent-runtime" },
      { includeDrafts: false },
    );
    const slugs = refs.map((r) => r.slug);
    expect(slugs).toContain("refactor-navigator");
    expect(slugs).toContain("streaming-agent-latency");
    expect(slugs).not.toContain("designing-agent-contracts");
  });

  it("dev 语义：resolveRefs 保留 draft 目标（写作预览）", async () => {
    const resolved = await resolveRefs(
      [{ kind: "project", slug: "flux-agent-runtime" }],
      { includeDrafts: true },
    );
    expect(resolved.map((r) => r.slug)).toEqual(["flux-agent-runtime"]);
  });

  it("sanitizeRelated：生产语义剔除 draft 引用，dev 语义保留", async () => {
    const items = [
      {
        slug: "refactor-navigator",
        related: [
          { kind: "project" as const, slug: "flux-agent-runtime" },
          { kind: "article" as const, slug: "hello-cogniflux" },
        ],
      },
    ];
    const prod = await sanitizeRelated(items, { includeDrafts: false });
    expect(prod[0]?.related.map((r) => r.slug)).toEqual(["hello-cogniflux"]);
    const dev = await sanitizeRelated(items, { includeDrafts: true });
    expect(dev[0]?.related.map((r) => r.slug)).toEqual([
      "flux-agent-runtime",
      "hello-cogniflux",
    ]);
  });
});
