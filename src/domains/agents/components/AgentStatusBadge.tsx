import { StatusCapsule, type StatusCapsuleProps } from "@/shared/ui";

import type { AgentStatus } from "../types";

/**
 * Agent 状态展示文案（视觉改版：游戏化大写等宽标签；领域词汇归领域，基线 §10）。
 * agents/detail.tsx 的正文引用同步呈现该文案。
 */
export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  concept: "CONCEPT",
  building: "BUILDING",
  usable: "ONLINE",
  retired: "ARCHIVED",
};

/** 状态 → StatusCapsule tone（语义令牌色一律经共享层胶囊消费） */
const STATUS_TONE: Record<
  AgentStatus,
  NonNullable<StatusCapsuleProps["tone"]>
> = {
  concept: "neutral",
  building: "warning",
  usable: "success",
  retired: "neutral",
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
 * Agent 状态徽章（视觉改版）：内部委托 shared/ui StatusCapsule 渲染，
 * 本组件只保留 agents 领域的状态→文案/tone/呼吸映射。
 * 【使用边界】本组件是 AgentStatus → StatusCapsule 的唯一映射
 * （docs/DESIGN.md §9）；其他领域状态（draft、outcome、projectStatus 等）
 * 请继续用 Badge/Tag，勿新增领域状态到 StatusCapsule 的映射。
 * reduced-motion 时呼吸点经 motion-reduce:animate-none 静止呈现。
 */
export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  return (
    <StatusCapsule
      tone={STATUS_TONE[status]}
      animated={BREATHING[status]}
      className={className}
    >
      {AGENT_STATUS_LABEL[status]}
    </StatusCapsule>
  );
}
