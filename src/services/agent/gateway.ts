/**
 * AgentGateway 接口预留（基线 §9 安全边界 / §13 / ADR-008）。
 *
 * 第一阶段只定义接口 + mock：前端永不持有模型 Key、不引 LLM SDK。
 * 阶段 3 的调用链：输入校验(前端 UX) → BFF(持 Key/鉴权/限流/审计) → LLM runtime。
 * 未来把实现从 mock 换成 fetch 版即可，页面调用签名不变。
 */

/** 一次 Agent 调用的输入 */
export interface AgentRequest {
  /** 目标 Agent 的标识（对应 agents 领域的 slug） */
  agentSlug: string;
  /** 用户输入文本 */
  prompt: string;
  /** 是否要求以事件流（增量）返回；false/缺省则单响应 */
  stream?: boolean;
  /** 透传的轻量上下文（无密钥） */
  context?: Record<string, string>;
}

/** 流式事件（stream 模式逐个产出，供 UI 增量渲染） */
export type AgentEvent =
  | { type: "start"; requestId: string }
  | { type: "delta"; text: string }
  | { type: "tool"; name: string; detail?: string }
  | { type: "done"; requestId: string }
  | { type: "error"; message: string };

/** 单响应（非流式）结果 */
export interface AgentResponse {
  requestId: string;
  text: string;
  /** 调用元信息（演示/审计用，无敏感数据） */
  meta?: { model?: string; latencyMs?: number };
}

/** 输入校验结果 */
export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * 网关接口：invoke 依据 req.stream 返回单响应或事件流。
 * 采用重载签名，保证调用方在类型层面拿到确切返回形态。
 */
export interface AgentGateway {
  /** 前端 UX 级输入校验（非安全边界，真正校验在阶段 3 的 BFF） */
  validateInput(req: AgentRequest): ValidationResult;
  /** 事件流调用 */
  invoke(req: AgentRequest & { stream: true }): Promise<AsyncIterable<AgentEvent>>;
  /** 单响应调用 */
  invoke(req: AgentRequest & { stream?: false }): Promise<AgentResponse>;
  invoke(
    req: AgentRequest,
  ): Promise<AgentResponse | AsyncIterable<AgentEvent>>;
}

/** 共享的 UX 级输入约束（mock 与未来实现复用） */
export const AGENT_INPUT_LIMITS = {
  promptMaxLength: 4000,
} as const;
