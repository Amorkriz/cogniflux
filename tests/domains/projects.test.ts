import { describe, expect, it } from "vitest";

import {
  getProjectReferenceRecords,
  getProjectBySlug,
  getProjects,
  projectSchema,
} from "@/domains/projects";

describe("projects repository", () => {
  it("取列表 + draft 过滤：flux-agent-runtime 为草稿", async () => {
    const published = await getProjects({ includeDrafts: false });
    const withDrafts = await getProjects({ includeDrafts: true });
    expect(published.map((p) => p.slug)).toEqual(["cogniflux-platform"]);
    expect(withDrafts.map((p) => p.slug)).toContain("flux-agent-runtime");
    expect(published.every((p) => p.status === "published")).toBe(true);
  });

  it("取单条 + draft 语义", async () => {
    const proj = await getProjectBySlug("cogniflux-platform");
    expect(proj?.projectStatus).toBe("in-progress");
    expect(proj?.techStack.length).toBeGreaterThan(0);
    expect(
      await getProjectBySlug("flux-agent-runtime", { includeDrafts: false }),
    ).toBeUndefined();
    expect(
      await getProjectBySlug("flux-agent-runtime", { includeDrafts: true }),
    ).toBeDefined();
  });

  it("related 正向：项目回指种子文章（构成互引对）", async () => {
    const records = await getProjectReferenceRecords();
    const platform = records.find((r) => r.slug === "cogniflux-platform");
    expect(platform?.related).toContainEqual({
      kind: "article",
      slug: "hello-cogniflux",
    });
  });

  it("schema 拒绝坏数据（缺 projectStatus）", () => {
    expect(() =>
      projectSchema.parse({
        slug: "bad",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-26",
        period: { start: "2026-07" },
      }),
    ).toThrow();
  });
});
