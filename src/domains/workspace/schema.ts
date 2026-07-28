import { z } from "zod";

/**
 * Workspace 领域 schema：运行时校验 API 响应 / WS 信封
 * （字段与 docs/WORKSPACE_API.md §4/§5 逐字对齐；z.infer 与 types 对齐）。
 */
export const taskStatusSchema = z.enum([
  "queued",
  "dispatched",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const taskMessageTypeSchema = z.enum([
  "log",
  "tool_call",
  "tool_result",
  "error",
]);

export const taskContextSchema = z.object({
  source: z.enum(["direct", "chat"]).optional(),
  sessionId: z.string().optional(),
});

export const workspaceTaskSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  status: taskStatusSchema,
  prompt: z.string().min(1),
  context: taskContextSchema,
  result: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  seqVersion: z.number().int().min(0),
  createdAt: z.string().min(1),
  startedAt: z.string().min(1).optional(),
  completedAt: z.string().min(1).optional(),
});

export const taskMessageSchema = z.object({
  taskId: z.string().min(1),
  /** 严格自增，从 1 开始 */
  seq: z.number().int().min(1),
  type: taskMessageTypeSchema,
  content: z.string(),
  tool: z.string().optional(),
  createdAt: z.string().min(1),
});

export const workspaceAgentStatusSchema = z.enum(["idle", "working", "offline"]);

export const workspaceAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string(),
  instructions: z.string(),
  /** 开放字符串以兼容未来新 CLI provider（契约 §3.7） */
  provider: z.string().min(1),
  status: workspaceAgentStatusSchema,
  maxConcurrentTasks: z.number().int().min(1),
  customEnv: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().min(1),
});

export const runtimeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["online", "offline"]),
  detectedAgents: z.array(z.string()),
  lastSeenAt: z.string().min(1),
  metadata: z.object({
    os: z.string(),
    daemonVersion: z.string(),
  }),
});

/** WS 统一信封（契约 §5.2）：未知事件 type 由消费方忽略，故此处 type 只约束为字符串 */
export const wsEnvelopeSchema = z.object({
  type: z.string().min(1),
  timestamp: z.string().min(1),
  payload: z.unknown().optional(),
});

/** `task:message` 事件负载（与 TaskMessage 字段对齐，无 createdAt） */
export const taskMessageEventPayloadSchema = z.object({
  taskId: z.string().min(1),
  seq: z.number().int().min(1),
  type: taskMessageTypeSchema,
  content: z.string(),
  tool: z.string().optional(),
});

/** 已知 9 个业务事件 + ready 就绪帧（契约 §5.1/§5.3） */
export const wsEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready"), timestamp: z.string().min(1) }),
  z.object({
    type: z.literal("task:queued"),
    timestamp: z.string().min(1),
    payload: z.object({ task: workspaceTaskSchema }),
  }),
  z.object({
    type: z.literal("task:dispatched"),
    timestamp: z.string().min(1),
    payload: z.object({ taskId: z.string().min(1), runtimeId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("task:running"),
    timestamp: z.string().min(1),
    payload: z.object({ taskId: z.string().min(1), startedAt: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("task:message"),
    timestamp: z.string().min(1),
    payload: taskMessageEventPayloadSchema,
  }),
  z.object({
    type: z.literal("task:completed"),
    timestamp: z.string().min(1),
    payload: z.object({
      taskId: z.string().min(1),
      result: z.record(z.string(), z.unknown()),
      seqVersion: z.number().int().min(0),
    }),
  }),
  z.object({
    type: z.literal("task:failed"),
    timestamp: z.string().min(1),
    payload: z.object({
      taskId: z.string().min(1),
      error: z.string(),
      seqVersion: z.number().int().min(0),
    }),
  }),
  z.object({
    type: z.literal("task:cancelled"),
    timestamp: z.string().min(1),
    payload: z.object({ taskId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("runtime:online"),
    timestamp: z.string().min(1),
    payload: z.object({ runtime: runtimeSchema }),
  }),
  z.object({
    type: z.literal("runtime:offline"),
    timestamp: z.string().min(1),
    payload: z.object({ runtimeId: z.string().min(1) }),
  }),
]);
