import { cn } from "@/shared/utils";

import type { AgentStatus } from "../types";

/** Agent 状态展示标签与语义色（agentStatus 驱动徽章，基线 §7） */
export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  concept: "构想中",
  building: "构建中",
  usable: "可用",
  retired: "已退役",
};

const DOT_COLOR: Record<AgentStatus, string> = {
  concept: "bg-info",
  building: "bg-warning",
  usable: "bg-success",
  retired: "bg-strong",
};

const TEXT_COLOR: Record<AgentStatus, string> = {
  concept: "text-info",
  building: "text-warning",
  usable: "text-success",
  retired: "text-tertiary",
};

/** 呼吸点只给“活着”的状态（构建中/可用）；退役与构想为静态点 */
const BREATHING: Record<AgentStatus, boolean> = {
  concept: false,
  building: true,
  usable: true,
  retired: false,
};

export interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

/**
 * Agent 状态徽章（基线 §11 领域专属动效）：呼吸点消费动效令牌
 * （animate-breathe，时长派生自 --motion-narrative），
 * reduced-motion 时经 motion-reduce:animate-none 静止呈现。
 */
export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-default bg-surface px-2.5 py-0.5 text-xs font-medium",
        TEXT_COLOR[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          DOT_COLOR[status],
          BREATHING[status] ? "animate-breathe motion-reduce:animate-none" : "",
        )}
      />
      {AGENT_STATUS_LABEL[status]}
    </span>
  );
}
