/**
 * Workspace 领域视图类型：re-export 服务层 DTO + 看板等 UI 态类型。
 * 依赖方向合规：domains → services（services 可被 pages/domains 引用）。
 */
import type { TaskStatus } from "@/services/workspace";

export type {
  ConnectionState,
  Runtime,
  Task,
  TaskContext,
  TaskMessage,
  TaskMessageType,
  TaskStatus,
  WorkspaceAgent,
  WorkspaceAgentStatus,
  WsEvent,
} from "@/services/workspace";

/** 看板列标识：排队中 / 执行中 / 已完成 / 失败 */
export type BoardColumnKey = "queued" | "active" | "done" | "failed";

/** 看板列定义：statuses 决定任务归属列 */
export interface BoardColumn {
  key: BoardColumnKey;
  title: string;
  statuses: TaskStatus[];
}

/**
 * 看板四列（任务口径）：dispatched 归入执行中列（卡片显示“已派发”徽标）；
 * cancelled 归入失败列（卡片显示“已取消”徽标，与 failed 区分）。
 */
export const BOARD_COLUMNS: readonly BoardColumn[] = [
  { key: "queued", title: "排队中", statuses: ["queued"] },
  { key: "active", title: "执行中", statuses: ["dispatched", "running"] },
  { key: "done", title: "已完成", statuses: ["completed"] },
  { key: "failed", title: "失败", statuses: ["failed", "cancelled"] },
];

/** 页面鉴权阶段：探活中 / 未登录 / 已登录 */
export type AuthPhase = "checking" | "anon" | "authed";
