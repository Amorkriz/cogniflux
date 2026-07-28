/**
 * WorkspaceGateway 真实 fetch 实现（契约 §2/§3）+ WS 事件流（ws-client.ts）。
 *
 * - 所有请求 credentials: "include"（HttpOnly Cookie 鉴权，前端不持有任何 Key）
 * - 基址 import.meta.env.VITE_API_BASE ?? ""（同域反代时为空，走相对路径）
 * - 非 2xx 统一解析契约错误体 { error, detail? } → WorkspaceApiError
 */
import { WorkspaceApiError } from "./gateway";
import { WorkspaceWsClient } from "./ws-client";

import type {
  CreateAgentInput,
  CreateTaskInput,
  ListTasksParams,
  MessagesPage,
  TaskSnapshot,
  UpdateAgentInput,
  WorkspaceEventHandler,
  WorkspaceGateway,
} from "./gateway";
import type {
  ConnectionState,
  Runtime,
  Task,
  WorkspaceAgent,
  WsEvent,
} from "./types";

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
}

/** WS 地址：基址为空时取当前站点 host（同域反代场景） */
function realtimeUrl(): string {
  const base = apiBase();
  if (base) return `${base.replace(/^http/, "ws")}/api/v1/realtime`;
  const { protocol, host } = window.location;
  return `${protocol === "https:" ? "wss:" : "ws:"}//${host}/api/v1/realtime`;
}

async function parseError(res: Response): Promise<WorkspaceApiError> {
  let code = "internal_error";
  let detail: string | undefined;
  try {
    const body = (await res.json()) as { error?: string; detail?: string };
    if (typeof body.error === "string") code = body.error;
    if (typeof body.detail === "string") detail = body.detail;
  } catch {
    // 非 JSON 错误体：保留兜底错误码
  }
  return new WorkspaceApiError(res.status, code, detail);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}/api/v1${path}`, {
    credentials: "include",
    headers: init?.body
      ? { "Content-Type": "application/json; charset=utf-8" }
      : undefined,
    ...init,
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

/** 创建真实网关（VITE_WORKSPACE_API=real 时由工厂选用） */
export function createWorkspaceClient(): WorkspaceGateway {
  const handlers = new Set<WorkspaceEventHandler>();
  let ws: WorkspaceWsClient | null = null;

  function getMessages(taskId: string, fromSeq = 0): Promise<MessagesPage> {
    const query = fromSeq > 0 ? `?fromSeq=${fromSeq}` : "";
    return request<MessagesPage>(
      `/tasks/${encodeURIComponent(taskId)}/messages${query}`,
    );
  }

  function ensureWs(): WorkspaceWsClient {
    if (!ws) {
      ws = new WorkspaceWsClient({
        url: realtimeUrl(),
        fetchMessages: getMessages,
        onEvent: (event: WsEvent) => {
          for (const handler of handlers) handler(event);
        },
        // 重连成功：复用 ready 事件通知上层（订阅方收到非首个 ready 即拉快照）
      });
      ws.connect();
    }
    return ws;
  }

  return {
    login(password: string) {
      return request<{ ok: true; expiresAt: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
    },

    async logout() {
      await request<{ ok: true }>("/auth/logout", { method: "POST" });
    },

    async me() {
      try {
        await request<{ ok: true }>("/auth/me");
        return true;
      } catch (error) {
        if (error instanceof WorkspaceApiError && error.status === 401) return false;
        throw error;
      }
    },

    listTasks(params?: ListTasksParams) {
      const query = new URLSearchParams();
      if (params?.status?.length) query.set("status", params.status.join(","));
      if (params?.limit !== undefined) query.set("limit", String(params.limit));
      if (params?.before) query.set("before", params.before);
      const suffix = query.size > 0 ? `?${query.toString()}` : "";
      return request<{ tasks: Task[]; total: number }>(`/tasks${suffix}`);
    },

    getTask(taskId: string) {
      return request<TaskSnapshot>(`/tasks/${encodeURIComponent(taskId)}`);
    },

    async createTask(input: CreateTaskInput) {
      const body = await request<{ task: Task }>("/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return body.task;
    },

    async cancelTask(taskId: string) {
      const body = await request<{ task: Task }>(
        `/tasks/${encodeURIComponent(taskId)}/cancel`,
        { method: "POST" },
      );
      return body.task;
    },

    getMessages,

    async listAgents() {
      const body = await request<{ agents: WorkspaceAgent[] }>("/agents");
      return body.agents;
    },

    async createAgent(input: CreateAgentInput) {
      const body = await request<{ agent: WorkspaceAgent }>("/agents", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return body.agent;
    },

    async updateAgent(agentId: string, patch: UpdateAgentInput) {
      const body = await request<{ agent: WorkspaceAgent }>(
        `/agents/${encodeURIComponent(agentId)}`,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      return body.agent;
    },

    async deleteAgent(agentId: string) {
      await request<{ ok: true }>(`/agents/${encodeURIComponent(agentId)}`, {
        method: "DELETE",
      });
    },

    async listRuntimes() {
      const body = await request<{ runtimes: Runtime[] }>("/runtimes");
      return body.runtimes;
    },

    subscribe(handler: WorkspaceEventHandler) {
      handlers.add(handler);
      ensureWs();
      return () => {
        handlers.delete(handler);
        if (handlers.size === 0 && ws) {
          ws.close();
          ws = null;
        }
      };
    },

    getConnectionState(): ConnectionState {
      return ws?.getState() ?? "idle";
    },
  };
}
