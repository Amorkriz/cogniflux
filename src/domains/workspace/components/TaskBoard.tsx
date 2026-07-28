import { TaskCard } from "./TaskCard";

import { BOARD_COLUMNS } from "../types";

import type { Task } from "../types";

export interface TaskBoardProps {
  tasks: Task[];
  /** agentId → 展示名映射（TaskCard 显示用） */
  agentNameById: Record<string, string>;
  /** 点击任务卡：由页面写入 ?task=<id> */
  onSelectTask: (taskId: string) => void;
}

/**
 * 任务看板：四列（排队中/执行中/已完成/失败）。
 * dispatched 归入执行中列（卡片徽标“已派发”）；cancelled 归入失败列（徽标“已取消”）。
 */
export function TaskBoard({ tasks, agentNameById, onSelectTask }: TaskBoardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BOARD_COLUMNS.map((column) => {
        const columnTasks = tasks.filter((task) =>
          column.statuses.includes(task.status),
        );
        return (
          <section
            key={column.key}
            aria-label={`${column.title}任务列`}
            className="rounded-card border border-default bg-raised p-3"
          >
            <h3 className="flex items-center justify-between px-1 text-sm font-semibold text-primary">
              {column.title}
              <span className="font-mono text-xs text-tertiary">
                {columnTasks.length}
              </span>
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    agentName={agentNameById[task.agentId]}
                    onSelect={onSelectTask}
                  />
                ))
              ) : (
                <p className="px-1 py-4 text-center text-xs text-tertiary">暂无任务</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
