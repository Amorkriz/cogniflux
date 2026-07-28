/**
 * Agent 事件 → 看板娘状态的纯函数映射（仅类型依赖 agent 网关，无副作用）。
 * 未来 Workspace/Agent 对话流可用它驱动看板娘表情，UI 不感知事件细节。
 */

import { COMPANION_STATES } from "./types";

import type { CompanionState } from "./types";
import type { AgentEvent } from "@/services/agent/gateway";

/** 将 Agent 流式事件映射为看板娘状态 */
export function agentEventToCompanionState(event: AgentEvent): CompanionState {
  switch (event.type) {
    case "start":
      return COMPANION_STATES.thinking;
    case "delta":
      return COMPANION_STATES.speaking;
    case "tool":
      return COMPANION_STATES.thinking;
    case "done":
      return COMPANION_STATES.idle;
    case "error":
      return COMPANION_STATES.idle;
  }
}
