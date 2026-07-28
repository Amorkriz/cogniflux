/**
 * WorkspaceGateway 接口（唯一契约：docs/WORKSPACE_API.md §2–§5）。
 *
 * 页面/领域层只依赖此接口；实现二选一（见 index.ts 工厂）：
 * - mock.ts：内存实现，定时器模拟任务生命周期（缺省）
 * - client.ts + ws-client.ts：真实 fetch + WS（VITE_WORKSPACE_API=real）
 * 密钥红线：前端永不持有任何 Key，鉴权凭证为 HttpOnly Cookie（浏览器不可读）。
 */
import type {
  ConnectionState,
  Runtime,
  Task,
  TaskContext,
  TaskMessage,
  TaskStatus,
  WorkspaceAgent,
  WsEvent,
} from "./types";

/** 统一契约错误（契约 §7.1 错误体 + HTTP 状态码） */
export class WorkspaceApiError extends Error {
  /** HTTP 状态码（如 401/404/409） */
  readonly status: number;
  /** 机器可读错误码（snake_case，如 "unauthorized"、"invalid_state"） */
  readonly code: string;
  /** 人类可读补充（契约错误体 detail，可选） */
  readonly detail?: string;

  constructor(status: number, code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "WorkspaceApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

/** 创建任务入参（契约 §3.1） */
export interface CreateTaskInput {
  agentId: string;
  prompt: string;
  context?: TaskContext;
}

/** 任务列表查询参数（契约 §3.2） */
export interface ListTasksParams {
  status?: TaskStatus[];
  limit?: number;
  before?: string;
}

/** 创建 Agent 入参（契约 §3.7） */
export interface CreateAgentInput {
  name: string;
  slug: string;
  description?: string;
  instructions: string;
  provider: string;
  maxConcurrentTasks?: number;
  customEnv?: Record<string, string>;
}

/** 更新 Agent 入参（契约 §3.8：字段同创建但全部可选） */
export type UpdateAgentInput = Partial<CreateAgentInput>;

/** 任务详情（全量快照，契约 §3.3） */
export interface TaskSnapshot {
  task: Task;
  messages: TaskMessage[];
  seqVersion: number;
}

/** 增量消息拉取结果（契约 §3.4） */
export interface MessagesPage {
  messages: TaskMessage[];
  seqVersion: number;
}

/** 事件订阅处理器；WsEvent 之外还会收到重连成功通知（上层据此拉快照，契约 §5.4 第 4 条） */
export type WorkspaceEventHandler = (event: WsEvent) => void;

export interface WorkspaceGateway {
  /* ---- 鉴权（契约 §2） ---- */
  login(password: string): Promise<{ ok: true; expiresAt: string }>;
  logout(): Promise<void>;
  /** 会话探活：有效 true / 无效 false（401 不抛错） */
  me(): Promise<boolean>;

  /* ---- 任务（契约 §3.1–3.5） ---- */
  listTasks(params?: ListTasksParams): Promise<{ tasks: Task[]; total: number }>;
  getTask(taskId: string): Promise<TaskSnapshot>;
  createTask(input: CreateTaskInput): Promise<Task>;
  cancelTask(taskId: string): Promise<Task>;
  /** 断线补偿：返回 seq > fromSeq 的全部消息（fromSeq 缺省 0 即全量） */
  getMessages(taskId: string, fromSeq?: number): Promise<MessagesPage>;

  /* ---- Agent（契约 §3.6–3.9） ---- */
  listAgents(): Promise<WorkspaceAgent[]>;
  createAgent(input: CreateAgentInput): Promise<WorkspaceAgent>;
  updateAgent(agentId: string, patch: UpdateAgentInput): Promise<WorkspaceAgent>;
  deleteAgent(agentId: string): Promise<void>;

  /* ---- Runtime（契约 §3.10） ---- */
  listRuntimes(): Promise<Runtime[]>;

  /* ---- 实时事件流（契约 §5） ---- */
  /** 订阅事件流，返回退订函数；首个事件为 ready 就绪帧 */
  subscribe(handler: WorkspaceEventHandler): () => void;
  /** 实时通道连接状态（UI 展示用） */
  getConnectionState(): ConnectionState;
}
