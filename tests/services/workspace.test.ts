import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MOCK_LIFECYCLE,
  WorkspaceApiError,
  WorkspaceWsClient,
  classifySeq,
  createMockWorkspaceGateway,
  needsCompensation,
  nextBackoffDelay,
} from "@/services/workspace";

import type { MessagesPage, WsEvent } from "@/services/workspace";

describe("mock workspace gateway", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("login：空口令 401 invalid_credentials，非空口令通过；me() 反映登录态", async () => {
    const gateway = createMockWorkspaceGateway();
    await expect(gateway.me()).resolves.toBe(false);
    await expect(gateway.login("  ")).rejects.toMatchObject({
      status: 401,
      code: "invalid_credentials",
    });
    await expect(gateway.login("any-pass")).resolves.toMatchObject({ ok: true });
    await expect(gateway.me()).resolves.toBe(true);
    await gateway.logout();
    await expect(gateway.me()).resolves.toBe(false);
  });

  it("种子数据：3 个 Agent、1 个在线 Runtime、任务覆盖全部 6 种状态", async () => {
    const gateway = createMockWorkspaceGateway();
    const agents = await gateway.listAgents();
    expect(agents).toHaveLength(3);
    expect(agents.map((a) => a.provider).sort()).toEqual([
      "claude-code",
      "codex",
      "qoder",
    ]);

    const runtimes = await gateway.listRuntimes();
    expect(runtimes).toHaveLength(1);
    expect(runtimes[0]?.status).toBe("online");

    const { tasks } = await gateway.listTasks({ limit: 100 });
    const statuses = new Set(tasks.map((t) => t.status));
    for (const status of [
      "queued",
      "dispatched",
      "running",
      "completed",
      "failed",
      "cancelled",
    ] as const) {
      expect(statuses.has(status)).toBe(true);
    }
  });

  it("subscribe：先收 ready 就绪帧；退订后不再收到事件", async () => {
    const gateway = createMockWorkspaceGateway();
    const events: WsEvent[] = [];
    const unsubscribe = gateway.subscribe((e) => events.push(e));

    await vi.advanceTimersByTimeAsync(0);
    expect(events[0]?.type).toBe("ready");

    unsubscribe();
    await gateway.createTask({ agentId: "agt_mock_claude", prompt: "test" });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(events).toHaveLength(1); // 只剩最初的 ready
  });

  it("createTask 生命周期：queued→dispatched→running→3 条消息（seq 严格自增）→completed", async () => {
    const gateway = createMockWorkspaceGateway();
    const events: WsEvent[] = [];
    gateway.subscribe((e) => events.push(e));
    await vi.advanceTimersByTimeAsync(0); // 吃掉 ready

    const task = await gateway.createTask({
      agentId: "agt_mock_claude",
      prompt: "演示完整生命周期",
    });
    expect(task.status).toBe("queued");
    expect(task.seqVersion).toBe(0);

    const { dispatchAfter, runAfter, messageEvery, messageCount } = MOCK_LIFECYCLE;
    await vi.advanceTimersByTimeAsync(runAfter + messageEvery * (messageCount + 1));

    const types = events.map((e) => e.type);
    expect(types).toEqual([
      "ready",
      "task:queued",
      "task:dispatched",
      "task:running",
      "task:message",
      "task:message",
      "task:message",
      "task:completed",
    ]);
    expect(dispatchAfter).toBeLessThan(runAfter);

    // seq 严格自增：1, 2, 3（无空洞、无重复）
    const seqs = events
      .filter((e) => e.type === "task:message")
      .map((e) => (e.type === "task:message" ? e.payload.seq : -1));
    expect(seqs).toEqual([1, 2, 3]);

    // 终态事件的 seqVersion 等于最大消息 seq（契约 §5.4）
    const completed = events.find((e) => e.type === "task:completed");
    expect(completed?.type === "task:completed" && completed.payload.seqVersion).toBe(
      messageCount,
    );

    // 落库状态一致：getTask 快照 seqVersion 与消息条数对齐
    const snapshot = await gateway.getTask(task.id);
    expect(snapshot.task.status).toBe("completed");
    expect(snapshot.seqVersion).toBe(messageCount);
    expect(snapshot.messages.map((m) => m.seq)).toEqual([1, 2, 3]);
  });

  it("cancelTask：清理后续定时器不再推进；对终态任务返回 409 invalid_state", async () => {
    const gateway = createMockWorkspaceGateway();
    const events: WsEvent[] = [];
    gateway.subscribe((e) => events.push(e));
    await vi.advanceTimersByTimeAsync(0);

    const task = await gateway.createTask({
      agentId: "agt_mock_qoder",
      prompt: "将被取消的任务",
    });
    await vi.advanceTimersByTimeAsync(MOCK_LIFECYCLE.dispatchAfter); // 已 dispatched

    const cancelled = await gateway.cancelTask(task.id);
    expect(cancelled.status).toBe("cancelled");

    // 快进到远超生命周期终点：不应再有该任务的任何事件
    const countAfterCancel = events.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(events).toHaveLength(countAfterCancel);
    expect(events.at(-1)?.type).toBe("task:cancelled");

    // 终态再取消 → 409
    await expect(gateway.cancelTask(task.id)).rejects.toMatchObject({
      status: 409,
      code: "invalid_state",
    });
    await expect(gateway.cancelTask("tsk_mock_completed")).rejects.toBeInstanceOf(
      WorkspaceApiError,
    );
  });

  it("getMessages(fromSeq)：只返回 seq > fromSeq 的增量且升序", async () => {
    const gateway = createMockWorkspaceGateway();
    const all = await gateway.getMessages("tsk_mock_completed");
    expect(all.messages.map((m) => m.seq)).toEqual([1, 2, 3]);
    expect(all.seqVersion).toBe(3);

    const partial = await gateway.getMessages("tsk_mock_completed", 1);
    expect(partial.messages.map((m) => m.seq)).toEqual([2, 3]);

    await expect(gateway.getMessages("tsk_missing")).rejects.toMatchObject({
      status: 404,
      code: "task_not_found",
    });
  });
});

describe("ws-client 纯函数：seq 去重与补偿判定", () => {
  it("classifySeq：连续接受、重复丢弃、跳号补齐", () => {
    expect(classifySeq(0, 1)).toBe("accept");
    expect(classifySeq(4, 5)).toBe("accept");
    expect(classifySeq(5, 5)).toBe("duplicate");
    expect(classifySeq(5, 3)).toBe("duplicate");
    expect(classifySeq(2, 4)).toBe("gap");
    expect(classifySeq(0, 7)).toBe("gap");
  });

  it("needsCompensation：本地最大 seq 落后于终态 seqVersion 即需补齐", () => {
    expect(needsCompensation(10, 12)).toBe(true);
    expect(needsCompensation(12, 12)).toBe(false);
    expect(needsCompensation(13, 12)).toBe(false);
    expect(needsCompensation(0, 0)).toBe(false);
  });

  it("nextBackoffDelay：1s 起指数增长、上限 60s、抖动 0–30%", () => {
    const noJitter = () => 0;
    expect(nextBackoffDelay(0, noJitter)).toBe(1_000);
    expect(nextBackoffDelay(1, noJitter)).toBe(2_000);
    expect(nextBackoffDelay(2, noJitter)).toBe(4_000);
    expect(nextBackoffDelay(6, noJitter)).toBe(60_000); // 64s 被封顶
    expect(nextBackoffDelay(20, noJitter)).toBe(60_000);

    const fullJitter = () => 1;
    expect(nextBackoffDelay(0, fullJitter)).toBe(1_300); // +30%
    expect(nextBackoffDelay(6, fullJitter)).toBe(60_000); // 抖动后仍封顶 60s

    // 抖动区间：任意 random ∈ [0,1) 结果落在 [exp, exp*1.3]
    const delay = nextBackoffDelay(3, () => 0.5);
    expect(delay).toBeGreaterThanOrEqual(8_000);
    expect(delay).toBeLessThanOrEqual(10_400);
  });
});

/** 测试用 fake WebSocket：记录实例、可手动触发 onmessage/onclose */
class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  close(): void {
    this.onclose?.();
  }

  /** 模拟服务端下发一帧（信封 JSON） */
  emit(event: unknown): void {
    this.onmessage?.({ data: JSON.stringify(event) });
  }

  /** 模拟服务端/网络断开 */
  drop(): void {
    this.onclose?.();
  }
}

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("WorkspaceWsClient 行为（fake WebSocket 注入）", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function createClient(overrides?: {
    fetchMessages?: (taskId: string, fromSeq: number) => Promise<MessagesPage>;
    onReconnected?: () => void;
    random?: () => number;
  }) {
    const events: WsEvent[] = [];
    const client = new WorkspaceWsClient({
      url: "ws://test/api/v1/realtime",
      fetchMessages:
        overrides?.fetchMessages ??
        (() => Promise.resolve({ messages: [], seqVersion: 0 })),
      onEvent: (event) => events.push(event),
      ...(overrides?.onReconnected ? { onReconnected: overrides.onReconnected } : {}),
      ...(overrides?.random ? { random: overrides.random } : {}),
    });
    return { client, events };
  }

  it("不传 random 时断线后能正常调度重连（Critical 回归：不抛异常且定时器被设置）", async () => {
    vi.useFakeTimers();
    const { client } = createClient(); // 故意不注入 random（真实客户端路径）
    client.connect();
    expect(FakeWebSocket.instances).toHaveLength(1);

    // 模拟断线：不应抛异常，且重连定时器被设置
    expect(() => FakeWebSocket.instances[0]!.drop()).not.toThrow();
    expect(client.getState()).toBe("reconnecting");
    expect(vi.getTimerCount()).toBe(1);

    // 快进超过首次退避上限（1s + 30% 抖动 ≤ 1.3s）：应发起新连接
    await vi.advanceTimersByTimeAsync(1_300);
    expect(FakeWebSocket.instances).toHaveLength(2);

    client.close();
  });

  it("消息跳号触发 fromSeq 补偿：fetchMessages 以本地最大 seq 被调用并按序补齐", async () => {
    const fetchMessages = vi.fn((taskId: string, fromSeq: number) =>
      Promise.resolve({
        messages: [1, 2, 3]
          .filter((seq) => seq > fromSeq)
          .map((seq) => ({
            taskId,
            seq,
            type: "log" as const,
            content: `line-${seq}`,
            createdAt: "2026-07-28T08:30:08.000Z",
          })),
        seqVersion: 3,
      }),
    );
    const { client, events } = createClient({ fetchMessages });
    client.connect();
    const socket = FakeWebSocket.instances[0]!;
    socket.emit({ type: "ready", timestamp: "2026-07-28T08:30:00.000Z" });

    // 本地最大 seq=0，直接收到 seq=3 → 跳号，应以 fromSeq=0 补偿
    socket.emit({
      type: "task:message",
      timestamp: "2026-07-28T08:30:08.000Z",
      payload: { taskId: "tsk_x", seq: 3, type: "log", content: "jump" },
    });
    await flushMicrotasks();

    expect(fetchMessages).toHaveBeenCalledTimes(1);
    expect(fetchMessages).toHaveBeenCalledWith("tsk_x", 0);

    // 补偿回的消息按 seq 升序下发；后续重复 seq 被去重
    const seqs = events
      .filter((e) => e.type === "task:message")
      .map((e) => (e.type === "task:message" ? e.payload.seq : -1));
    expect(seqs).toEqual([1, 2, 3]);

    socket.emit({
      type: "task:message",
      timestamp: "2026-07-28T08:30:09.000Z",
      payload: { taskId: "tsk_x", seq: 2, type: "log", content: "dup" },
    });
    await flushMicrotasks();
    expect(
      events.filter((e) => e.type === "task:message"),
    ).toHaveLength(3); // 重复帧被丢弃

    client.close();
  });

  it("重连后收到第二个 ready 时触发快照对齐回调 onReconnected", async () => {
    vi.useFakeTimers();
    const onReconnected = vi.fn();
    const { client, events } = createClient({ onReconnected });
    client.connect();

    // 首连 ready：不应触发 onReconnected
    FakeWebSocket.instances[0]!.emit({
      type: "ready",
      timestamp: "2026-07-28T08:30:00.000Z",
    });
    expect(client.getState()).toBe("connected");
    expect(onReconnected).not.toHaveBeenCalled();

    // 断线 → 退避后重连 → 新连接 ready → 触发对齐回调
    FakeWebSocket.instances[0]!.drop();
    await vi.advanceTimersByTimeAsync(1_300);
    expect(FakeWebSocket.instances).toHaveLength(2);
    FakeWebSocket.instances[1]!.emit({
      type: "ready",
      timestamp: "2026-07-28T08:31:00.000Z",
    });

    expect(onReconnected).toHaveBeenCalledTimes(1);
    expect(client.getState()).toBe("connected");
    expect(events.filter((e) => e.type === "ready")).toHaveLength(2);

    client.close();
  });
});
