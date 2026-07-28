/**
 * Workspace 真实 WS 客户端（契约 §5 前端实时通道）。
 *
 * - 指数退避重连：1s 起、上限 60s、加抖动（契约 §5.5）
 * - 按 taskId 维护 localMaxSeq：seq 去重 + 跳号主动补齐（契约 §5.4 第 1/3 条）
 * - 终态事件比对 seqVersion：落后则先 getMessages(fromSeq) 补齐再落终态（§5.4 第 2 条）
 * - 重连成功（收到 ready）后通知上层拉快照（§5.4 第 4 条）
 * - 心跳：服务端 30s protocol-level ping，浏览器 WebSocket 自动回 pong，
 *   客户端无需（也无法）手工应答；断开由 close 事件驱动重连（§5.5）
 */
import type { MessagesPage } from "./gateway";
import type { ConnectionState, TaskMessage, WsEvent } from "./types";

const BACKOFF_BASE_MS = 1_000;
const BACKOFF_CAP_MS = 60_000;
/** 抖动比例：在指数值上再加 0–30% 随机量，避免重连风暴 */
const BACKOFF_JITTER_RATIO = 0.3;

/**
 * 第 attempt 次重连（从 0 计）的退避时长：min(60s, 1s·2^attempt) + 抖动，总量仍封顶 60s。
 * random 可注入以便测试。
 */
export function nextBackoffDelay(
  attempt: number,
  random: () => number = Math.random,
): number {
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
  const jitter = exp * BACKOFF_JITTER_RATIO * random();
  return Math.min(BACKOFF_CAP_MS, Math.round(exp + jitter));
}

/** 终态事件补偿判断（契约 §5.4 第 2 条）：本地最大 seq 落后于 seqVersion 即需补齐 */
export function needsCompensation(localMaxSeq: number, seqVersion: number): boolean {
  return localMaxSeq < seqVersion;
}

export type SeqDecision = "accept" | "duplicate" | "gap";

/** seq 去重/跳号判定（契约 §5.4 第 1/3 条）：重复丢弃、连续接受、跳号需补齐 */
export function classifySeq(localMaxSeq: number, incomingSeq: number): SeqDecision {
  if (incomingSeq <= localMaxSeq) return "duplicate";
  if (incomingSeq === localMaxSeq + 1) return "accept";
  return "gap";
}

export interface WorkspaceWsClientOptions {
  /** 完整 WS 地址（ws:// 或 wss://，含 /api/v1/realtime） */
  url: string;
  /** 增量补偿拉取（GET /api/v1/tasks/:taskId/messages?fromSeq=） */
  fetchMessages: (taskId: string, fromSeq: number) => Promise<MessagesPage>;
  /** 事件出口（已去重/补齐后的有序事件） */
  onEvent: (event: WsEvent) => void;
  /** 重连成功（非首连的 ready）通知：上层应对非终态任务逐一拉全量快照 */
  onReconnected?: () => void;
  onStateChange?: (state: ConnectionState) => void;
  /** 注入随机源（测试用） */
  random?: () => number;
}

/** 补偿拉回的 TaskMessage → task:message 事件（信封 timestamp 用消息自身时间） */
function toMessageEvent(message: TaskMessage): WsEvent {
  return {
    type: "task:message",
    timestamp: message.createdAt,
    payload: {
      taskId: message.taskId,
      seq: message.seq,
      type: message.type,
      content: message.content,
      ...(message.tool !== undefined ? { tool: message.tool } : {}),
    },
  };
}

export class WorkspaceWsClient {
  private readonly options: WorkspaceWsClientOptions;
  private socket: WebSocket | null = null;
  private state: ConnectionState = "idle";
  private attempt = 0;
  private everReady = false;
  private closedByUser = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** taskId → 本地最大 seq */
  private readonly localMaxSeq = new Map<string, number>();

  constructor(options: WorkspaceWsClientOptions) {
    this.options = options;
  }

  getState(): ConnectionState {
    return this.state;
  }

  connect(): void {
    if (this.socket || this.closedByUser) return;
    this.setState(this.everReady ? "reconnecting" : "connecting");
    const socket = new WebSocket(this.options.url);
    this.socket = socket;
    socket.onmessage = (event: MessageEvent) => {
      void this.handleRaw(typeof event.data === "string" ? event.data : "");
    };
    socket.onclose = () => {
      this.socket = null;
      if (this.closedByUser) return;
      this.setState("reconnecting");
      this.scheduleReconnect();
    };
    socket.onerror = () => {
      // 统一交给 onclose 驱动重连（浏览器会随后触发 close）
    };
  }

  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
    this.setState("disconnected");
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.options.onStateChange?.(state);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    // random 为可选字段：显式兜底 Math.random，保证所有调用路径（含未注入的真实客户端）安全
    const random = this.options.random ?? Math.random;
    const delay = nextBackoffDelay(this.attempt, random);
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /** 解析信封并按契约处理；未知事件 type 一律忽略（§5.2 向前兼容） */
  private async handleRaw(raw: string): Promise<void> {
    let envelope: { type?: unknown; timestamp?: unknown; payload?: unknown };
    try {
      envelope = JSON.parse(raw) as typeof envelope;
    } catch {
      return;
    }
    if (typeof envelope.type !== "string") return;
    const event = envelope as unknown as WsEvent;

    switch (event.type) {
      case "ready": {
        const isReconnect = this.everReady;
        this.everReady = true;
        this.attempt = 0;
        this.setState("connected");
        this.options.onEvent(event);
        // 重连成功：上层拉快照整体覆盖本地状态，随后以快照 seqVersion 归位
        if (isReconnect) this.options.onReconnected?.();
        return;
      }
      case "task:message": {
        const { taskId, seq } = event.payload;
        const localMax = this.localMaxSeq.get(taskId) ?? 0;
        const decision = classifySeq(localMax, seq);
        if (decision === "duplicate") return;
        if (decision === "gap") {
          await this.compensate(taskId, localMax);
          return;
        }
        this.localMaxSeq.set(taskId, seq);
        this.options.onEvent(event);
        return;
      }
      case "task:completed":
      case "task:failed": {
        const { taskId, seqVersion } = event.payload;
        const localMax = this.localMaxSeq.get(taskId) ?? 0;
        if (needsCompensation(localMax, seqVersion)) {
          await this.compensate(taskId, localMax);
        }
        this.localMaxSeq.delete(taskId); // 终态后不再追踪
        this.options.onEvent(event);
        return;
      }
      case "task:cancelled": {
        this.localMaxSeq.delete(event.payload.taskId);
        this.options.onEvent(event);
        return;
      }
      case "task:queued":
      case "task:dispatched":
      case "task:running":
      case "runtime:online":
      case "runtime:offline": {
        this.options.onEvent(event);
        return;
      }
      default:
        // 未知事件：忽略（向前兼容）
        return;
    }
  }

  /** 用 fromSeq 增量补齐缺口，并把补回的消息按序转成事件下发 */
  private async compensate(taskId: string, fromSeq: number): Promise<void> {
    try {
      const page = await this.options.fetchMessages(taskId, fromSeq);
      let localMax = this.localMaxSeq.get(taskId) ?? fromSeq;
      for (const message of page.messages) {
        if (message.seq <= localMax) continue;
        localMax = message.seq;
        this.localMaxSeq.set(taskId, localMax);
        this.options.onEvent(toMessageEvent(message));
      }
    } catch {
      // 补偿失败不致命：后续终态事件或重连快照会再次对齐
    }
  }
}
