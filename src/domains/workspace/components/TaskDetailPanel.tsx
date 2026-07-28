import { useEffect, useRef } from "react";

import { isTerminalStatus } from "@/services/workspace";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

import { TASK_STATUS_META, formatTaskTime } from "./task-status";

import type { Task, TaskMessage } from "../types";

/** 消息渲染上限：超出只渲染最近 200 条并顶部提示（防长任务拖垮 DOM） */
export const MAX_RENDERED_MESSAGES = 200;

export interface TaskDetailPanelProps {
  /** 当前选中任务；null 时面板关闭 */
  task: Task | null;
  messages: TaskMessage[];
  agentName?: string;
  onClose: () => void;
  /** 取消任务（仅非终态显示按钮） */
  onCancel: (taskId: string) => void;
  cancelling?: boolean;
}

/**
 * 任务详情面板（Radix Dialog）：任务信息 + 消息时间线。
 * 消息超上限只渲染最近 200 条；新消息自动滚底；运行中显示取消按钮。
 */
export function TaskDetailPanel({
  task,
  messages,
  agentName,
  onClose,
  onCancel,
  cancelling = false,
}: TaskDetailPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新消息自动滚底（仅滚动消息容器自身，不打扰页面）
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, task?.id]);

  if (!task) return null;
  const meta = TASK_STATUS_META[task.status];
  const truncated = messages.length > MAX_RENDERED_MESSAGES;
  const visibleMessages = truncated
    ? messages.slice(-MAX_RENDERED_MESSAGES)
    : messages;

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      {/* Dialog 本体为 fixed 定位，max-h-5/6 相对视口解析（标准比例类，无任意值） */}
      <DialogContent className="flex max-h-5/6 max-w-2xl flex-col">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span className="font-mono text-xs text-tertiary">{task.id}</span>
          </div>
          <DialogTitle className="line-clamp-3">{task.prompt}</DialogTitle>
          <DialogDescription>
            {agentName ?? task.agentId} · 创建于 {formatTaskTime(task.createdAt)}
            {task.startedAt ? ` · 启动于 ${formatTaskTime(task.startedAt)}` : ""}
            {task.completedAt ? ` · 结束于 ${formatTaskTime(task.completedAt)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {task.error ? (
          <p className="mt-3 rounded-control border border-default bg-raised p-3 text-sm text-danger">
            {task.error}
          </p>
        ) : null}

        <div
          ref={scrollRef}
          className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-control border border-default bg-raised p-3"
        >
          {truncated ? (
            <p className="mb-2 text-center text-xs text-tertiary">
              消息较多，仅显示最近 {MAX_RENDERED_MESSAGES} 条（共 {messages.length} 条）
            </p>
          ) : null}
          {visibleMessages.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {visibleMessages.map((message) => (
                <li key={message.seq} className="font-mono text-xs">
                  <span className="text-tertiary">#{message.seq}</span>{" "}
                  <span
                    className={
                      message.type === "error" ? "text-danger" : "text-secondary"
                    }
                  >
                    [{message.type}
                    {message.tool ? `:${message.tool}` : ""}]
                  </span>{" "}
                  <span className="break-all whitespace-pre-wrap text-primary">
                    {message.content}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-6 text-center text-xs text-tertiary">暂无执行消息</p>
          )}
        </div>

        {!isTerminalStatus(task.status) ? (
          <div className="mt-4 flex justify-end">
            <Button
              variant="danger"
              disabled={cancelling}
              onClick={() => onCancel(task.id)}
            >
              {cancelling ? "取消中…" : "取消任务"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
