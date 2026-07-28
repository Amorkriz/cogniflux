import type { TaskStatus } from "../types";
import type { BadgeProps } from "@/shared/ui";

/** 任务状态 → 徽标文案与 Badge 变体（dispatched 显示“已派发”，cancelled 与 failed 区分） */
export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  queued: { label: "排队中", variant: "neutral" },
  dispatched: { label: "已派发", variant: "info" },
  running: { label: "执行中", variant: "accent" },
  completed: { label: "已完成", variant: "success" },
  failed: { label: "失败", variant: "danger" },
  cancelled: { label: "已取消", variant: "warning" },
};

/** ISO 时间 → 本地短格式（列表/详情共用） */
export function formatTaskTime(isoTime: string): string {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return isoTime;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
