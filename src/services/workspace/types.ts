/**
 * Workspace 服务层 DTO（唯一契约：docs/WORKSPACE_API.md 第 4 节）。
 * 字段名逐字对齐契约（camelCase），禁止自行发明字段。
 */

/** 任务状态（契约 §1.3 状态机） */
export type TaskStatus =
  | "queued" // 已创建，等待 Daemon 认领
  | "dispatched" // 已下发/被认领，CLI 尚未启动
  | "running" // CLI 进程执行中
  | "completed" // 成功终态
  | "failed" // 失败终态
  | "cancelled"; // 取消终态

/** 终态集合（契约：终态不可再迁移） */
export const TERMINAL_TASK_STATUSES: readonly TaskStatus[] = [
  "completed",
  "failed",
  "cancelled",
];

export function isTerminalStatus(status: TaskStatus): boolean {
  return TERMINAL_TASK_STATUSES.includes(status);
}

/** 任务来源上下文（契约 §3.1） */
export interface TaskContext {
  source?: "direct" | "chat";
  sessionId?: string;
}

/** 任务（契约 §4 Task） */
export interface Task {
  id: string;
  agentId: string;
  status: TaskStatus;
  prompt: string;
  context: TaskContext;
  /** 终态 completed 时的结构化结果 */
  result?: object;
  /** 终态 failed 时的错误描述 */
  error?: string;
  /** 该任务当前最大消息 seq（无消息时为 0） */
  seqVersion: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/** 任务消息类型（契约 §4 TaskMessage.type） */
export type TaskMessageType = "log" | "tool_call" | "tool_result" | "error";

/** 任务消息（执行过程流水，契约 §4 TaskMessage） */
export interface TaskMessage {
  taskId: string;
  /** 严格自增，从 1 开始，任务内唯一且无空洞 */
  seq: number;
  type: TaskMessageType;
  content: string;
  /** type 为 tool_call / tool_result 时的工具名 */
  tool?: string;
  createdAt: string;
}

/** Agent 运行状态（契约 §4 Agent.status，由后端推导） */
export type WorkspaceAgentStatus = "idle" | "working" | "offline";

/** Agent（编码代理配置，契约 §4 Agent） */
export interface WorkspaceAgent {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  /** CLI 提供方；开放字符串以兼容未来新 CLI */
  provider: "claude-code" | "codex" | "qoder" | (string & {});
  status: WorkspaceAgentStatus;
  maxConcurrentTasks: number;
  customEnv?: Record<string, string>;
  createdAt: string;
}

/** Runtime（Daemon 注册的运行环境，契约 §4 Runtime） */
export interface Runtime {
  id: string;
  name: string;
  status: "online" | "offline";
  /** Daemon 本机探测到的可用 CLI provider 列表（非 Agent id） */
  detectedAgents: string[];
  lastSeenAt: string;
  metadata: {
    os: string;
    daemonVersion: string;
  };
}

/* ---------------- WS 实时事件（契约 §5） ---------------- */

/** `task:message` 事件负载（契约 §5.3，与 TaskMessage 字段对齐但无 createdAt） */
export interface TaskMessageEventPayload {
  taskId: string;
  seq: number;
  type: TaskMessageType;
  content: string;
  tool?: string;
}

/** 统一信封 + 9 个业务事件 + ready 就绪帧（契约 §5.1–5.3） */
export type WsEvent =
  | { type: "ready"; timestamp: string }
  | { type: "task:queued"; timestamp: string; payload: { task: Task } }
  | {
      type: "task:dispatched";
      timestamp: string;
      payload: { taskId: string; runtimeId: string };
    }
  | {
      type: "task:running";
      timestamp: string;
      payload: { taskId: string; startedAt: string };
    }
  | { type: "task:message"; timestamp: string; payload: TaskMessageEventPayload }
  | {
      type: "task:completed";
      timestamp: string;
      payload: { taskId: string; result: object; seqVersion: number };
    }
  | {
      type: "task:failed";
      timestamp: string;
      payload: { taskId: string; error: string; seqVersion: number };
    }
  | { type: "task:cancelled"; timestamp: string; payload: { taskId: string } }
  | { type: "runtime:online"; timestamp: string; payload: { runtime: Runtime } }
  | { type: "runtime:offline"; timestamp: string; payload: { runtimeId: string } };

/** 实时通道连接状态（供 UI 展示） */
export type ConnectionState =
  | "idle" // 尚未建立（mock 下常驻 connected）
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";
