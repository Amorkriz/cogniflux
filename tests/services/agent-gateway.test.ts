import { describe, expect, it } from "vitest";

import { mockAgentGateway } from "@/services/agent/mock";

import type { AgentEvent, AgentResponse } from "@/services/agent/gateway";

describe("AgentGateway mock", () => {
  it("validateInput：拒绝空 agentSlug / 空 prompt", () => {
    expect(mockAgentGateway.validateInput({ agentSlug: "", prompt: "hi" }).ok).toBe(false);
    expect(mockAgentGateway.validateInput({ agentSlug: "a", prompt: " " }).ok).toBe(false);
  });

  it("validateInput：拒绝超长 prompt，接受合法输入", () => {
    expect(
      mockAgentGateway.validateInput({
        agentSlug: "a",
        prompt: "x".repeat(5000),
      }).ok,
    ).toBe(false);
    expect(
      mockAgentGateway.validateInput({ agentSlug: "refactor-navigator", prompt: "帮我看看" }).ok,
    ).toBe(true);
  });

  it("invoke：单响应返回固定演示文本", async () => {
    const res = (await mockAgentGateway.invoke({
      agentSlug: "pr-reviewer",
      prompt: "评审这段代码",
    })) as AgentResponse;
    expect(res.requestId).toBeTruthy();
    expect(res.text).toContain("演示响应");
    expect(res.meta?.model).toBe("mock");
  });

  it("invoke：流式返回 start…delta…done 事件序列", async () => {
    const stream = (await mockAgentGateway.invoke({
      agentSlug: "pr-reviewer",
      prompt: "评审这段代码",
      stream: true,
    })) as AsyncIterable<AgentEvent>;
    const types: string[] = [];
    for await (const event of stream) types.push(event.type);
    expect(types[0]).toBe("start");
    expect(types).toContain("delta");
    expect(types[types.length - 1]).toBe("done");
  });
});
