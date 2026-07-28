/**
 * Workspace 页面主体（React.lazy 加载，仅客户端运行）。
 *
 * 流程：me() 探活 → 未登录渲染 LoginGate → 登录后并行拉 tasks/agents/runtimes
 * 快照 + subscribe 事件流增量更新 → 卸载退订。
 * 状态管理只用 React 内建（useReducer + useState），零新增运行时依赖。
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import {
  AgentRoster,
  LoginGate,
  RuntimeStatusBar,
  TaskBoard,
  TaskCreateForm,
  TaskDetailPanel,
  workspaceAgentSchema,
  workspaceTaskSchema,
  runtimeSchema,
} from "@/domains/workspace";
import { WorkspaceApiError, getWorkspaceGateway } from "@/services/workspace";
import { FadeIn } from "@/shared/motion";
import { Button, Skeleton } from "@/shared/ui";

import type {
  AuthPhase,
  Runtime,
  Task,
  TaskMessage,
  WorkspaceAgent,
  WsEvent,
} from "@/domains/workspace";

interface WorkspaceState {
  tasks: Task[];
  agents: WorkspaceAgent[];
  runtimes: Runtime[];
  /** taskId → 消息时间线（seq 升序） */
  messages: Record<string, TaskMessage[]>;
  loaded: boolean;
}

const INITIAL_STATE: WorkspaceState = {
  tasks: [],
  agents: [],
  runtimes: [],
  messages: {},
  loaded: false,
};

type WorkspaceAction =
  | {
      type: "snapshot";
      tasks: Task[];
      agents: WorkspaceAgent[];
      runtimes: Runtime[];
    }
  | { type: "task-snapshot"; task: Task; messages: TaskMessage[] }
  | { type: "upsert-task"; task: Task }
  | { type: "ws"; event: WsEvent };

function upsertTask(tasks: Task[], task: Task): Task[] {
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index < 0) return [task, ...tasks];
  return tasks.map((t, i) => (i === index ? task : t));
}

function patchTask(tasks: Task[], taskId: string, patch: Partial<Task>): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
}

/** 追加消息（按 seq 去重 + 保持升序） */
function appendMessage(
  messages: Record<string, TaskMessage[]>,
  message: TaskMessage,
): Record<string, TaskMessage[]> {
  const list = messages[message.taskId] ?? [];
  if (list.some((m) => m.seq === message.seq)) return messages;
  const next = [...list, message].sort((a, b) => a.seq - b.seq);
  return { ...messages, [message.taskId]: next };
}

function applyWsEvent(state: WorkspaceState, event: WsEvent): WorkspaceState {
  switch (event.type) {
    case "task:queued":
      return { ...state, tasks: upsertTask(state.tasks, event.payload.task) };
    case "task:dispatched":
      return {
        ...state,
        tasks: patchTask(state.tasks, event.payload.taskId, {
          status: "dispatched",
        }),
      };
    case "task:running":
      return {
        ...state,
        tasks: patchTask(state.tasks, event.payload.taskId, {
          status: "running",
          startedAt: event.payload.startedAt,
        }),
      };
    case "task:message": {
      const { taskId, seq, type, content, tool } = event.payload;
      const message: TaskMessage = {
        taskId,
        seq,
        type,
        content,
        ...(tool !== undefined ? { tool } : {}),
        // WS 负载无 createdAt，用信封 timestamp 代位
        createdAt: event.timestamp,
      };
      return {
        ...state,
        messages: appendMessage(state.messages, message),
        tasks: state.tasks.map((t) =>
          t.id === taskId && t.seqVersion < seq ? { ...t, seqVersion: seq } : t,
        ),
      };
    }
    case "task:completed":
      return {
        ...state,
        tasks: patchTask(state.tasks, event.payload.taskId, {
          status: "completed",
          result: event.payload.result,
          seqVersion: event.payload.seqVersion,
          completedAt: event.timestamp,
        }),
      };
    case "task:failed":
      return {
        ...state,
        tasks: patchTask(state.tasks, event.payload.taskId, {
          status: "failed",
          error: event.payload.error,
          seqVersion: event.payload.seqVersion,
          completedAt: event.timestamp,
        }),
      };
    case "task:cancelled":
      return {
        ...state,
        tasks: patchTask(state.tasks, event.payload.taskId, {
          status: "cancelled",
          completedAt: event.timestamp,
        }),
      };
    case "runtime:online": {
      const runtime = event.payload.runtime;
      const exists = state.runtimes.some((r) => r.id === runtime.id);
      return {
        ...state,
        runtimes: exists
          ? state.runtimes.map((r) => (r.id === runtime.id ? runtime : r))
          : [...state.runtimes, runtime],
      };
    }
    case "runtime:offline":
      return {
        ...state,
        runtimes: state.runtimes.map((r) =>
          r.id === event.payload.runtimeId ? { ...r, status: "offline" } : r,
        ),
      };
    default:
      // ready 在订阅回调层处理；未知事件忽略（契约 §5.2 向前兼容）
      return state;
  }
}

function reducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "snapshot":
      return {
        ...state,
        tasks: action.tasks,
        agents: action.agents,
        runtimes: action.runtimes,
        loaded: true,
      };
    case "task-snapshot":
      return {
        ...state,
        tasks: upsertTask(state.tasks, action.task),
        messages: { ...state.messages, [action.task.id]: action.messages },
      };
    case "upsert-task":
      return { ...state, tasks: upsertTask(state.tasks, action.task) };
    case "ws":
      return applyWsEvent(state, action.event);
  }
}

export default function WorkspaceApp() {
  const gateway = useMemo(() => getWorkspaceGateway(), []);
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [auth, setAuth] = useState<AuthPhase>("checking");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTaskId = searchParams.get("task");
  const readyCountRef = useRef(0);

  /** 快照拉取：三资源并行；用 Zod schema 过滤非法响应条目（防御真实后端） */
  const loadSnapshot = useCallback(async () => {
    const [taskPage, agents, runtimes] = await Promise.all([
      gateway.listTasks({ limit: 100 }),
      gateway.listAgents(),
      gateway.listRuntimes(),
    ]);
    dispatch({
      type: "snapshot",
      tasks: taskPage.tasks.filter((t) => workspaceTaskSchema.safeParse(t).success),
      agents: agents.filter((a) => workspaceAgentSchema.safeParse(a).success),
      runtimes: runtimes.filter((r) => runtimeSchema.safeParse(r).success),
    });
  }, [gateway]);

  // 挂载后 me() 探活
  useEffect(() => {
    let cancelled = false;
    gateway
      .me()
      .then((ok) => {
        if (!cancelled) setAuth(ok ? "authed" : "anon");
      })
      .catch(() => {
        if (!cancelled) setAuth("anon");
      });
    return () => {
      cancelled = true;
    };
  }, [gateway]);

  // 登录后：拉快照 + 订阅事件流；卸载退订
  useEffect(() => {
    if (auth !== "authed") return;
    void loadSnapshot();
    const unsubscribe = gateway.subscribe((event) => {
      if (event.type === "ready") {
        readyCountRef.current += 1;
        // 重连成功（非首个 ready）：拉快照整体覆盖本地状态（契约 §5.4 第 4 条）
        if (readyCountRef.current > 1) void loadSnapshot();
        return;
      }
      dispatch({ type: "ws", event });
    });
    return unsubscribe;
  }, [auth, gateway, loadSnapshot]);

  // 选中任务变化：拉全量快照补齐历史消息（?task=<id>）
  useEffect(() => {
    if (auth !== "authed" || !selectedTaskId) return;
    let stale = false;
    gateway
      .getTask(selectedTaskId)
      .then((snapshot) => {
        if (stale) return;
        dispatch({
          type: "task-snapshot",
          task: snapshot.task,
          messages: snapshot.messages,
        });
      })
      .catch(() => {
        // 任务不存在等：保持列表数据，面板展示已有信息
      });
    return () => {
      stale = true;
    };
  }, [auth, gateway, selectedTaskId]);

  const agentNameById = useMemo(
    () => Object.fromEntries(state.agents.map((a) => [a.id, a.name])),
    [state.agents],
  );

  const selectedTask = selectedTaskId
    ? (state.tasks.find((t) => t.id === selectedTaskId) ?? null)
    : null;

  const selectTask = useCallback(
    (taskId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("task", taskId);
      setSearchParams(next, { preventScrollReset: true });
    },
    [searchParams, setSearchParams],
  );

  const closeDetail = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("task");
    setSearchParams(next, { preventScrollReset: true });
  }, [searchParams, setSearchParams]);

  async function handleLogin(password: string) {
    setLoginPending(true);
    setLoginError(null);
    try {
      await gateway.login(password);
      setAuth("authed");
    } catch (error) {
      setLoginError(
        error instanceof WorkspaceApiError && error.code === "invalid_credentials"
          ? "口令不正确，请重试。"
          : "登录失败，请稍后再试。",
      );
    } finally {
      setLoginPending(false);
    }
  }

  async function handleLogout() {
    try {
      await gateway.logout();
    } finally {
      setAuth("anon");
    }
  }

  async function handleCreateTask(input: { agentId: string; prompt: string }) {
    setCreating(true);
    setCreateError(null);
    try {
      const task = await gateway.createTask(input);
      dispatch({ type: "upsert-task", task });
    } catch (error) {
      setCreateError(
        error instanceof WorkspaceApiError
          ? `创建失败：${error.code}`
          : "创建失败，请稍后再试。",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCancelTask(taskId: string) {
    setCancelling(true);
    try {
      const task = await gateway.cancelTask(taskId);
      dispatch({ type: "upsert-task", task });
    } catch {
      // 已终态（409）等：等待事件流/快照对齐即可
    } finally {
      setCancelling(false);
    }
  }

  if (auth === "checking") {
    return (
      <div className="mt-block flex flex-col gap-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (auth === "anon") {
    return (
      <div className="mt-block">
        <LoginGate onSubmit={handleLogin} error={loginError} pending={loginPending} />
      </div>
    );
  }

  return (
    <FadeIn className="mt-block flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <RuntimeStatusBar runtimes={state.runtimes} />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          退出登录
        </Button>
      </div>

      <TaskCreateForm
        agents={state.agents}
        onSubmit={handleCreateTask}
        submitting={creating}
        error={createError}
      />

      <section aria-label="任务看板">
        {state.loaded ? (
          <TaskBoard
            tasks={state.tasks}
            agentNameById={agentNameById}
            onSelectTask={selectTask}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}
      </section>

      <section aria-label="Agent 列表" className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-primary">Agents</h2>
        <AgentRoster agents={state.agents} />
      </section>

      <TaskDetailPanel
        task={selectedTask}
        messages={selectedTask ? (state.messages[selectedTask.id] ?? []) : []}
        agentName={selectedTask ? agentNameById[selectedTask.agentId] : undefined}
        onClose={closeDetail}
        onCancel={handleCancelTask}
        cancelling={cancelling}
      />
    </FadeIn>
  );
}
