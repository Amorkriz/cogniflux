/**
 * AgentGateway 的 mock 实现（基线 §13：阶段 1 仅接口 + mock）。
 * 返回固定演示响应，不做任何网络/LLM 调用，无密钥。
 */
import { AGENT_INPUT_LIMITS } from "./gateway";

import type {
  AgentEvent,
  AgentGateway,
  AgentRequest,
  AgentResponse,
  ValidationResult,
} from "./gateway";

function makeRequestId(): string {
  return `mock-${Date.now().toString(36)}`;
}

function demoText(req: AgentRequest): string {
  return `（演示响应）已收到面向「${req.agentSlug}」的请求：${req.prompt.slice(0, 40)} …… 真实推理将在阶段 3 由 BFF 转发至 LLM runtime。`;
}

async function* streamEvents(req: AgentRequest): AsyncIterable<AgentEvent> {
  const requestId = makeRequestId();
  yield { type: "start", requestId };
  for (const chunk of demoText(req).match(/.{1,12}/gu) ?? []) {
    yield { type: "delta", text: chunk };
  }
  yield { type: "done", requestId };
}

export const mockAgentGateway: AgentGateway = {
  validateInput(req: AgentRequest): ValidationResult {
    const errors: string[] = [];
    if (!req.agentSlug.trim()) errors.push("agentSlug 不能为空");
    if (!req.prompt.trim()) errors.push("prompt 不能为空");
    if (req.prompt.length > AGENT_INPUT_LIMITS.promptMaxLength) {
      errors.push(`prompt 超过 ${AGENT_INPUT_LIMITS.promptMaxLength} 字上限`);
    }
    return { ok: errors.length === 0, errors };
  },

  invoke(
    req: AgentRequest,
  ): Promise<AgentResponse | AsyncIterable<AgentEvent>> {
    if (req.stream) {
      return Promise.resolve(streamEvents(req));
    }
    const response: AgentResponse = {
      requestId: makeRequestId(),
      text: demoText(req),
      meta: { model: "mock", latencyMs: 0 },
    };
    return Promise.resolve(response);
  },
} as AgentGateway;
