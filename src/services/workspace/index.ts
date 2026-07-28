/**
 * Workspace 服务层唯一公开出口。
 * 工厂按 VITE_WORKSPACE_API 选择实现："real" → fetch+WS 客户端，否则内存 mock。
 */
export type {
  ConnectionState,
  Runtime,
  Task,
  TaskContext,
  TaskMessage,
  TaskMessageEventPayload,
  TaskMessageType,
  TaskStatus,
  WorkspaceAgent,
  WorkspaceAgentStatus,
  WsEvent,
} from "./types";
export { TERMINAL_TASK_STATUSES, isTerminalStatus } from "./types";
export type {
  CreateAgentInput,
  CreateTaskInput,
  ListTasksParams,
  MessagesPage,
  TaskSnapshot,
  UpdateAgentInput,
  WorkspaceEventHandler,
  WorkspaceGateway,
} from "./gateway";
export { WorkspaceApiError } from "./gateway";
export { createMockWorkspaceGateway, MOCK_LIFECYCLE } from "./mock";
export { createWorkspaceClient } from "./client";
export {
  WorkspaceWsClient,
  classifySeq,
  needsCompensation,
  nextBackoffDelay,
  type SeqDecision,
  type WorkspaceWsClientOptions,
} from "./ws-client";

import { createWorkspaceClient } from "./client";
import { createMockWorkspaceGateway } from "./mock";

import type { WorkspaceGateway } from "./gateway";

/** 按环境变量选择实现（缺省 mock，保证无后端也可完整演示） */
export function createWorkspaceGateway(): WorkspaceGateway {
  return import.meta.env.VITE_WORKSPACE_API === "real"
    ? createWorkspaceClient()
    : createMockWorkspaceGateway();
}

let singleton: WorkspaceGateway | null = null;

/** 应用级单例（页面多次挂载共享同一份 mock 状态/WS 连接） */
export function getWorkspaceGateway(): WorkspaceGateway {
  singleton ??= createWorkspaceGateway();
  return singleton;
}
