import { Badge, Bot, Clock } from "@/shared/ui";

import { TASK_STATUS_META, formatTaskTime } from "./task-status";

import type { Task } from "../types";

export interface TaskCardProps {
  task: Task;
  /** 任务所属 Agent 展示名（查不到时回退 agentId） */
  agentName?: string;
  /** 点击卡片：由页面写入 ?task=<id> 查询参数 */
  onSelect: (taskId: string) => void;
}

/**
 * 看板任务卡：状态徽标 + agent 名 + 时间 + prompt 摘要。
 * 整卡为 <button>（键盘可达，触控目标远超 44px），点击设置 ?task=。
 */
export function TaskCard({ task, agentName, onSelect }: TaskCardProps) {
  const meta = TASK_STATUS_META[task.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      className="w-full min-h-11 rounded-card border border-default bg-surface p-4 text-left transition-colors duration-(--motion-fast) hover:border-strong hover:bg-raised"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={meta.variant}>{meta.label}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-tertiary">
          <Bot aria-hidden="true" className="size-3.5" />
          {agentName ?? task.agentId}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-primary">{task.prompt}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-xs text-tertiary">
        <Clock aria-hidden="true" className="size-3.5" />
        <time dateTime={task.createdAt}>{formatTaskTime(task.createdAt)}</time>
      </p>
    </button>
  );
}
