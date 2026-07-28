import { describe, expect, it } from "vitest";

import {
  runtimeSchema,
  taskMessageSchema,
  workspaceAgentSchema,
  workspaceTaskSchema,
  wsEnvelopeSchema,
  wsEventSchema,
} from "@/domains/workspace";

/** 合法样本取自契约 docs/WORKSPACE_API.md 的示例 */
const validTask = {
  id: "tsk_01HXCCC333",
  agentId: "agt_01HXAAA111",
  status: "running",
  prompt: "为 About 页面补充单元测试",
  context: { source: "direct" },
  seqVersion: 12,
  createdAt: "2026-07-28T08:30:00.000Z",
  startedAt: "2026-07-28T08:30:05.000Z",
};

describe("workspace schema：Task", () => {
  it("接受契约合法样本（含可选 result/error 缺省）", () => {
    const parsed = workspaceTaskSchema.parse(validTask);
    expect(parsed.status).toBe("running");
    expect(parsed.seqVersion).toBe(12);
    expect(parsed.result).toBeUndefined();
  });

  it("接受终态样本（result / completedAt）", () => {
    const parsed = workspaceTaskSchema.parse({
      ...validTask,
      status: "completed",
      result: { summary: "新增 3 个测试用例，全部通过" },
      completedAt: "2026-07-28T08:41:12.000Z",
    });
    expect(parsed.result).toEqual({ summary: "新增 3 个测试用例，全部通过" });
  });

  it("拒绝非法状态 / 负 seqVersion / 缺失必填字段", () => {
    expect(() =>
      workspaceTaskSchema.parse({ ...validTask, status: "paused" }),
    ).toThrow();
    expect(() =>
      workspaceTaskSchema.parse({ ...validTask, seqVersion: -1 }),
    ).toThrow();
    const { prompt: _prompt, ...withoutPrompt } = validTask;
    expect(() => workspaceTaskSchema.parse(withoutPrompt)).toThrow();
  });
});

describe("workspace schema：TaskMessage", () => {
  const validMessage = {
    taskId: "tsk_01HXCCC333",
    seq: 2,
    type: "tool_call",
    content: '{"pattern":"About"}',
    tool: "grep",
    createdAt: "2026-07-28T08:30:08.000Z",
  };

  it("接受合法样本", () => {
    expect(taskMessageSchema.parse(validMessage).seq).toBe(2);
  });

  it("拒绝 seq < 1 / 非法 type", () => {
    expect(() => taskMessageSchema.parse({ ...validMessage, seq: 0 })).toThrow();
    expect(() =>
      taskMessageSchema.parse({ ...validMessage, type: "stdout" }),
    ).toThrow();
  });
});

describe("workspace schema：Agent / Runtime", () => {
  const validAgent = {
    id: "agt_01HXAAA111",
    name: "Claude 主力",
    slug: "claude-main",
    description: "日常编码任务",
    instructions: "遵循仓库 AGENTS.md 规范，先读后写。",
    provider: "claude-code",
    status: "idle",
    maxConcurrentTasks: 1,
    customEnv: { HTTP_PROXY: "http://127.0.0.1:7890" },
    createdAt: "2026-07-01T00:00:00.000Z",
  };

  it("Agent：接受合法样本；provider 开放字符串兼容未来 CLI", () => {
    expect(workspaceAgentSchema.parse(validAgent).provider).toBe("claude-code");
    expect(
      workspaceAgentSchema.parse({ ...validAgent, provider: "future-cli" }).provider,
    ).toBe("future-cli");
  });

  it("Agent：拒绝非法 status / 缺 instructions", () => {
    expect(() =>
      workspaceAgentSchema.parse({ ...validAgent, status: "busy" }),
    ).toThrow();
    const { instructions: _i, ...withoutInstructions } = validAgent;
    expect(() => workspaceAgentSchema.parse(withoutInstructions)).toThrow();
  });

  const validRuntime = {
    id: "rt_01HXDDD444",
    name: "MacBook-Pro.local",
    status: "online",
    detectedAgents: ["claude-code", "codex"],
    lastSeenAt: "2026-07-28T08:41:00.000Z",
    metadata: { os: "darwin 26.5.1", daemonVersion: "0.3.2" },
  };

  it("Runtime：接受合法样本，拒绝非法 status / 缺 metadata", () => {
    expect(runtimeSchema.parse(validRuntime).status).toBe("online");
    expect(() => runtimeSchema.parse({ ...validRuntime, status: "away" })).toThrow();
    const { metadata: _m, ...withoutMetadata } = validRuntime;
    expect(() => runtimeSchema.parse(withoutMetadata)).toThrow();
  });
});

describe("workspace schema：WS 信封与事件", () => {
  it("已知事件：task:message 合法负载通过", () => {
    const parsed = wsEventSchema.parse({
      type: "task:message",
      timestamp: "2026-07-28T08:30:08.000Z",
      payload: {
        taskId: "tsk_01HXCCC333",
        seq: 2,
        type: "tool_call",
        content: '{"pattern":"About"}',
        tool: "grep",
      },
    });
    expect(parsed.type).toBe("task:message");
  });

  it("已知事件：终态负载缺 seqVersion 被拒绝", () => {
    expect(() =>
      wsEventSchema.parse({
        type: "task:completed",
        timestamp: "2026-07-28T08:41:12.000Z",
        payload: { taskId: "tsk_01HXCCC333", result: {} },
      }),
    ).toThrow();
  });

  it("未知事件 type：不在已知联合中（消费方按信封忽略）", () => {
    const unknown = {
      type: "task:paused",
      timestamp: "2026-07-28T08:30:00.000Z",
      payload: {},
    };
    expect(() => wsEventSchema.parse(unknown)).toThrow();
    // 信封 schema 仍可解析：type 只约束为字符串（向前兼容的降级路径）
    expect(wsEnvelopeSchema.parse(unknown).type).toBe("task:paused");
  });

  it("信封：缺 timestamp 被拒绝", () => {
    expect(() => wsEnvelopeSchema.parse({ type: "ready" })).toThrow();
  });
});
