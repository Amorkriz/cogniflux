import { describe, expect, it } from "vitest";

import {
  getLabReferenceRecords,
  getLabExperimentBySlug,
  getLabExperiments,
  labSchema,
} from "@/domains/lab";

describe("lab repository", () => {
  it("取列表：含种子实验", async () => {
    const list = await getLabExperiments({ includeDrafts: false });
    expect(list.map((e) => e.slug)).toContain("streaming-agent-latency");
    expect(list.every((e) => e.status === "published")).toBe(true);
  });

  it("取单条：命中并含 hypothesis/outcome/正文加载器", async () => {
    const detail = await getLabExperimentBySlug("streaming-agent-latency");
    expect(detail?.experiment.outcome).toBe("success");
    expect(detail?.experiment.hypothesis.length).toBeGreaterThan(0);
    expect(detail?.experiment.learnings.length).toBeGreaterThan(0);
    expect(typeof detail?.load).toBe("function");
    expect(await getLabExperimentBySlug("nope")).toBeUndefined();
  });

  it("related 正向：实验引用项目", async () => {
    const records = await getLabReferenceRecords();
    const exp = records.find((r) => r.slug === "streaming-agent-latency");
    expect(exp?.related).toContainEqual({
      kind: "project",
      slug: "flux-agent-runtime",
    });
  });

  it("schema 拒绝坏数据（非法 outcome）", () => {
    expect(() =>
      labSchema.parse({
        slug: "bad",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-26",
        hypothesis: "h",
        outcome: "maybe",
      }),
    ).toThrow();
  });
});
