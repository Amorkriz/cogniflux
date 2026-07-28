/**
 * WorkspaceGateway 内存 mock 实现（缺省网关，无任何网络调用/密钥）。
 *
 * - 内置样本：3 个 Agent（claude-code / codex / qoder）、1 个在线 Runtime、
 *   6 个任务覆盖 queued/dispatched/running/completed/failed/cancelled 全部状态。
 * - createTask 后用定时器模拟完整生命周期推进：
 *   queued → dispatched → running → 若干条 task:message（seq 严格自增）→ task:completed，
 *   事件经 subscribe 推给订阅者（信封格式与契约 §5.2 一致）。
 * - login 任意非空口令通过（契约错误体语义保持一致）。
 */
import { WorkspaceApiError } from "./gateway";

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
  TaskMessage,
  WorkspaceAgent,
  WsEvent,
} from "./types";
import { isTerminalStatus } from "./types";

/** 生命周期推进节拍（ms）；测试用 fake timers 快进 */
export const MOCK_LIFECYCLE = {
  dispatchAfter: 500,
  runAfter: 1000,
  messageEvery: 500,
  messageCount: 3,
} as const;

function iso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** 把同步抛错（如 findTask 的 404）统一转为 rejected Promise，对齐真实网关语义 */
function attempt<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (error) {
    return Promise.reject(error as Error);
  }
}

interface MockSeed {
  agents: WorkspaceAgent[];
  runtimes: Runtime[];
  tasks: Task[];
  messages: Record<string, TaskMessage[]>;
}

/** 样本数据：时间统一相对“现在”回拨，保证列表倒序稳定 */
function buildSeed(): MockSeed {
  const agents: WorkspaceAgent[] = [
    {
      id: "agt_mock_claude",
      name: "Claude 主力",
      slug: "claude-main",
      description: "日常编码与重构任务",
      instructions: "遵循仓库 AGENTS.md 规范，先读后写。",
      provider: "claude-code",
      status: "idle",
      maxConcurrentTasks: 1,
      createdAt: iso(-40 * 86400_000),
    },
    {
      id: "agt_mock_codex",
      name: "Codex 评审",
      slug: "codex-review",
      description: "PR 评审与测试补全",
      instructions: "只评审不改动，输出结构化意见。",
      provider: "codex",
      status: "working",
      maxConcurrentTasks: 2,
      customEnv: { NO_COLOR: "1" },
      createdAt: iso(-30 * 86400_000),
    },
    {
      id: "agt_mock_qoder",
      name: "Qoder 助理",
      slug: "qoder-assist",
      description: "文档与脚手架杂务",
      instructions: "小步提交，改动最小化。",
      provider: "qoder",
      status: "idle",
      maxConcurrentTasks: 1,
      createdAt: iso(-20 * 86400_000),
    },
  ];

  const runtimes: Runtime[] = [
    {
      id: "rt_mock_local",
      name: "MacBook-Pro.local",
      status: "online",
      detectedAgents: ["claude-code", "codex", "qoder"],
      lastSeenAt: iso(-15_000),
      metadata: { os: "darwin 26.5.1", daemonVersion: "0.3.2" },
    },
  ];

  const tasks: Task[] = [
    {
      id: "tsk_mock_queued",
      agentId: "agt_mock_claude",
      status: "queued",
      prompt: "为 About 页面补充无障碍回归用例",
      context: { source: "direct" },
      seqVersion: 0,
      createdAt: iso(-2 * 60_000),
    },
    {
      id: "tsk_mock_dispatched",
      agentId: "agt_mock_qoder",
      status: "dispatched",
      prompt: "梳理 docs/adr 目录并生成索引",
      context: { source: "direct" },
      seqVersion: 0,
      createdAt: iso(-5 * 60_000),
    },
    {
      id: "tsk_mock_running",
      agentId: "agt_mock_codex",
      status: "running",
      prompt: "评审 feature/workspace 分支的最新提交",
      context: { source: "chat", sessionId: "ses_mock_001" },
      seqVersion: 2,
      createdAt: iso(-10 * 60_000),
      startedAt: iso(-8 * 60_000),
    },
    {
      id: "tsk_mock_completed",
      agentId: "agt_mock_claude",
      status: "completed",
      prompt: "为 Toolbox 页面补充单元测试",
      context: { source: "direct" },
      result: { summary: "新增 3 个测试用例，全部通过" },
      seqVersion: 3,
      createdAt: iso(-3 * 3600_000),
      startedAt: iso(-3 * 3600_000 + 5_000),
      completedAt: iso(-3 * 3600_000 + 60_000),
    },
    {
      id: "tsk_mock_failed",
      agentId: "agt_mock_codex",
      status: "failed",
      prompt: "升级 eslint 至最新主版本并修复告警",
      context: { source: "direct" },
      error: "CLI 进程异常退出（exit 1）",
      seqVersion: 1,
      createdAt: iso(-6 * 3600_000),
      startedAt: iso(-6 * 3600_000 + 5_000),
      completedAt: iso(-6 * 3600_000 + 90_000),
    },
    {
      id: "tsk_mock_cancelled",
      agentId: "agt_mock_qoder",
      status: "cancelled",
      prompt: "重写站点 README 的部署章节",
      context: { source: "direct" },
      seqVersion: 0,
      createdAt: iso(-24 * 3600_000),
      completedAt: iso(-24 * 3600_000 + 30_000),
    },
  ];

  const messages: Record<string, TaskMessage[]> = {
    tsk_mock_running: [
      {
        taskId: "tsk_mock_running",
        seq: 1,
        type: "log",
        content: "开始拉取分支并分析 diff",
        createdAt: iso(-8 * 60_000 + 2_000),
      },
      {
        taskId: "tsk_mock_running",
        seq: 2,
        type: "tool_call",
        content: '{"cmd":"git diff main...HEAD"}',
        tool: "bash",
        createdAt: iso(-8 * 60_000 + 8_000),
      },
    ],
    tsk_mock_completed: [
      {
        taskId: "tsk_mock_completed",
        seq: 1,
        type: "log",
        content: "分析 Toolbox 页面结构",
        createdAt: iso(-3 * 3600_000 + 10_000),
      },
      {
        taskId: "tsk_mock_completed",
        seq: 2,
        type: "tool_call",
        content: '{"file":"tests/domains/toolbox.test.ts"}',
        tool: "write",
        createdAt: iso(-3 * 3600_000 + 30_000),
      },
      {
        taskId: "tsk_mock_completed",
        seq: 3,
        type: "tool_result",
        content: "3 passed",
        tool: "bash",
        createdAt: iso(-3 * 3600_000 + 55_000),
      },
    ],
    tsk_mock_failed: [
      {
        taskId: "tsk_mock_failed",
        seq: 1,
        type: "error",
        content: "eslint@next 与现有插件不兼容",
        createdAt: iso(-6 * 3600_000 + 80_000),
      },
    ],
  };

  return { agents, runtimes, tasks, messages };
}

/** 创建一个独立的内存 mock 网关（测试可各自实例化，互不串扰） */
export function createMockWorkspaceGateway(): WorkspaceGateway {
  const seed = buildSeed();
  const agents = seed.agents;
  const runtimes = seed.runtimes;
  const tasks = seed.tasks;
  const messages = seed.messages;

  const handlers = new Set<WorkspaceEventHandler>();
  /** 每个任务的待触发定时器（取消任务时清理） */
  const timers = new Map<string, ReturnType<typeof setTimeout>[]>();
  let authed = false;
  let idCounter = 0;

  function nextId(prefix: string): string {
    idCounter += 1;
    return `${prefix}_mock_${idCounter.toString(36).padStart(4, "0")}`;
  }

  function emit(event: WsEvent): void {
    for (const handler of handlers) handler(event);
  }

  function findTask(taskId: string): Task {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new WorkspaceApiError(404, "task_not_found");
    return task;
  }

  function findAgent(agentId: string): WorkspaceAgent {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) throw new WorkspaceApiError(404, "agent_not_found");
    return agent;
  }

  function schedule(taskId: string, delay: number, fn: () => void): void {
    const timer = setTimeout(() => {
      const list = timers.get(taskId);
      if (list) timers.set(taskId, list.filter((t) => t !== timer));
      fn();
    }, delay);
    const list = timers.get(taskId) ?? [];
    list.push(timer);
    timers.set(taskId, list);
  }

  function clearTaskTimers(taskId: string): void {
    for (const timer of timers.get(taskId) ?? []) clearTimeout(timer);
    timers.delete(taskId);
  }

  /** 模拟完整生命周期：dispatched → running → N 条消息 → completed */
  function driveLifecycle(task: Task): void {
    const { dispatchAfter, runAfter, messageEvery, messageCount } = MOCK_LIFECYCLE;
    schedule(task.id, dispatchAfter, () => {
      task.status = "dispatched";
      emit({
        type: "task:dispatched",
        timestamp: iso(),
        payload: { taskId: task.id, runtimeId: runtimes[0]?.id ?? "rt_mock_local" },
      });
    });
    schedule(task.id, runAfter, () => {
      task.status = "running";
      task.startedAt = iso();
      emit({
        type: "task:running",
        timestamp: iso(),
        payload: { taskId: task.id, startedAt: task.startedAt },
      });
    });
    const sampleLines: { type: TaskMessage["type"]; content: string; tool?: string }[] = [
      { type: "log", content: "开始分析仓库结构" },
      { type: "tool_call", content: '{"pattern":"TODO"}', tool: "grep" },
      { type: "tool_result", content: "已完成修改并通过自检", tool: "bash" },
    ];
    for (let i = 0; i < messageCount; i += 1) {
      schedule(task.id, runAfter + messageEvery * (i + 1), () => {
        const seq = task.seqVersion + 1;
        task.seqVersion = seq;
        const line = sampleLines[i % sampleLines.length] ?? sampleLines[0]!;
        const message: TaskMessage = {
          taskId: task.id,
          seq,
          type: line.type,
          content: line.content,
          ...(line.tool ? { tool: line.tool } : {}),
          createdAt: iso(),
        };
        const list = messages[task.id] ?? [];
        list.push(message);
        messages[task.id] = list;
        emit({
          type: "task:message",
          timestamp: message.createdAt,
          payload: {
            taskId: task.id,
            seq,
            type: message.type,
            content: message.content,
            ...(message.tool ? { tool: message.tool } : {}),
          },
        });
      });
    }
    schedule(task.id, runAfter + messageEvery * (messageCount + 1), () => {
      task.status = "completed";
      task.completedAt = iso();
      task.result = { summary: "任务已完成（mock 演示）" };
      emit({
        type: "task:completed",
        timestamp: task.completedAt,
        payload: { taskId: task.id, result: task.result, seqVersion: task.seqVersion },
      });
    });
  }

  return {
    login(password: string) {
      if (!password.trim()) {
        return Promise.reject(new WorkspaceApiError(401, "invalid_credentials"));
      }
      authed = true;
      return Promise.resolve({ ok: true as const, expiresAt: iso(90 * 86400_000) });
    },

    logout() {
      authed = false;
      return Promise.resolve();
    },

    me() {
      return Promise.resolve(authed);
    },

    listTasks(params?: ListTasksParams) {
      let list = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (params?.status?.length) {
        list = list.filter((t) => params.status!.includes(t.status));
      }
      const total = list.length;
      if (params?.before) {
        const index = list.findIndex((t) => t.id === params.before);
        if (index >= 0) list = list.slice(index + 1);
      }
      const limit = Math.min(params?.limit ?? 20, 100);
      return Promise.resolve({ tasks: clone(list.slice(0, limit)), total });
    },

    getTask(taskId: string): Promise<TaskSnapshot> {
      return attempt(() => {
        const task = findTask(taskId);
        return {
          task: clone(task),
          messages: clone(messages[taskId] ?? []),
          seqVersion: task.seqVersion,
        };
      });
    },

    createTask(input: CreateTaskInput) {
      return attempt(() => {
        if (!input.prompt.trim()) {
          throw new WorkspaceApiError(400, "invalid_request", "prompt 不能为空");
        }
        findAgent(input.agentId);
        const task: Task = {
          id: nextId("tsk"),
          agentId: input.agentId,
          status: "queued",
          prompt: input.prompt,
          context: input.context ?? { source: "direct" },
          seqVersion: 0,
          createdAt: iso(),
        };
        tasks.unshift(task);
        emit({ type: "task:queued", timestamp: task.createdAt, payload: { task: clone(task) } });
        driveLifecycle(task);
        return clone(task);
      });
    },

    cancelTask(taskId: string) {
      return attempt(() => {
        const task = findTask(taskId);
        if (isTerminalStatus(task.status)) {
          throw new WorkspaceApiError(409, "invalid_state", "任务已处于终态");
        }
        clearTaskTimers(taskId);
        task.status = "cancelled";
        task.completedAt = iso();
        emit({ type: "task:cancelled", timestamp: task.completedAt, payload: { taskId } });
        return clone(task);
      });
    },

    getMessages(taskId: string, fromSeq = 0): Promise<MessagesPage> {
      return attempt(() => {
        const task = findTask(taskId);
        const list = (messages[taskId] ?? [])
          .filter((m) => m.seq > fromSeq)
          .sort((a, b) => a.seq - b.seq);
        return { messages: clone(list), seqVersion: task.seqVersion };
      });
    },

    listAgents() {
      return Promise.resolve(clone(agents));
    },

    createAgent(input: CreateAgentInput) {
      if (agents.some((a) => a.slug === input.slug)) {
        return Promise.reject(new WorkspaceApiError(409, "slug_conflict"));
      }
      const agent: WorkspaceAgent = {
        id: nextId("agt"),
        name: input.name,
        slug: input.slug,
        description: input.description ?? "",
        instructions: input.instructions,
        provider: input.provider,
        status: "idle",
        maxConcurrentTasks: input.maxConcurrentTasks ?? 1,
        ...(input.customEnv ? { customEnv: input.customEnv } : {}),
        createdAt: iso(),
      };
      agents.push(agent);
      return Promise.resolve(clone(agent));
    },

    updateAgent(agentId: string, patch: UpdateAgentInput) {
      return attempt(() => {
        const agent = findAgent(agentId);
        if (patch.slug && agents.some((a) => a.id !== agentId && a.slug === patch.slug)) {
          throw new WorkspaceApiError(409, "slug_conflict");
        }
        Object.assign(agent, {
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.instructions !== undefined ? { instructions: patch.instructions } : {}),
          ...(patch.provider !== undefined ? { provider: patch.provider } : {}),
          ...(patch.maxConcurrentTasks !== undefined
            ? { maxConcurrentTasks: patch.maxConcurrentTasks }
            : {}),
          ...(patch.customEnv !== undefined ? { customEnv: patch.customEnv } : {}),
        });
        return clone(agent);
      });
    },

    deleteAgent(agentId: string) {
      return attempt(() => {
        const agent = findAgent(agentId);
        const busy = tasks.some(
          (t) => t.agentId === agentId && !isTerminalStatus(t.status),
        );
        if (busy) {
          throw new WorkspaceApiError(409, "agent_busy", "该 Agent 尚有非终态任务");
        }
        agents.splice(agents.indexOf(agent), 1);
      });
    },

    listRuntimes() {
      return Promise.resolve(clone(runtimes));
    },

    subscribe(handler: WorkspaceEventHandler) {
      handlers.add(handler);
      // 契约 §5.1：连接成功后先发 ready 就绪帧（异步，模拟握手）
      const readyTimer = setTimeout(() => {
        if (handlers.has(handler)) handler({ type: "ready", timestamp: iso() });
      }, 0);
      return () => {
        clearTimeout(readyTimer);
        handlers.delete(handler);
      };
    },

    getConnectionState(): ConnectionState {
      return "connected";
    },
  };
}
