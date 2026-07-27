import { describe, expect, it } from "vitest";

import {
  agentSchema,
  getAgentReferenceRecords,
  getAgentBySlug,
  getAgents,
} from "@/domains/agents";

describe("agents repository", () => {
  it("取列表：按 createdAt 倒序，草稿过滤契约", async () => {
    const list = await getAgents({ includeDrafts: false });
    expect(list.map((a) => a.slug)).toEqual(["pr-reviewer", "refactor-navigator"]);
    expect(list.every((a) => a.status === "published")).toBe(true);
  });

  it("取单条：命中并含 agentStatus/demo", async () => {
    const agent = await getAgentBySlug("refactor-navigator");
    expect(agent?.agentStatus).toBe("building");
    expect(agent?.demo?.type).toBe("link");
    expect(await getAgentBySlug("nope")).toBeUndefined();
  });

  it("related 正向：Agent 引用项目", async () => {
    const records = await getAgentReferenceRecords();
    const nav = records.find((r) => r.slug === "refactor-navigator");
    expect(nav?.related).toContainEqual({
      kind: "project",
      slug: "flux-agent-runtime",
    });
  });

  it("schema 接受合法 accentTag/icon（视觉改版新字段）", () => {
    const parsed = agentSchema.parse({
      slug: "ok",
      title: "x",
      summary: "y",
      status: "published",
      createdAt: "2026-07-26",
      role: "r",
      agentStatus: "usable",
      accentTag: "purple",
      icon: "bot",
    });
    expect(parsed.accentTag).toBe("purple");
    expect(parsed.icon).toBe("bot");
  });

  it("schema 拒绝非法 accentTag 枚举值", () => {
    expect(() =>
      agentSchema.parse({
        slug: "bad",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-26",
        role: "r",
        agentStatus: "usable",
        accentTag: "red",
      }),
    ).toThrow();
  });

  it("accentTag 缺省时 parse 结果为 undefined（无 default 污染）", () => {
    const parsed = agentSchema.parse({
      slug: "ok",
      title: "x",
      summary: "y",
      status: "published",
      createdAt: "2026-07-26",
      role: "r",
      agentStatus: "usable",
    });
    expect(parsed.accentTag).toBeUndefined();
    expect(parsed.icon).toBeUndefined();
  });

  it("schema 拒绝坏数据（非法 agentStatus / 缺 role）", () => {
    expect(() =>
      agentSchema.parse({
        slug: "bad",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-26",
        role: "x",
        agentStatus: "unknown",
      }),
    ).toThrow();
    expect(() =>
      agentSchema.parse({
        slug: "bad",
        title: "x",
        summary: "y",
        status: "published",
        createdAt: "2026-07-26",
        agentStatus: "usable",
      }),
    ).toThrow();
  });
});
