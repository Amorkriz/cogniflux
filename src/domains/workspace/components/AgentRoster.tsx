import { Bot, Card, StatusCapsule, Tag } from "@/shared/ui";

import type { WorkspaceAgent, WorkspaceAgentStatus } from "../types";
import type { StatusCapsuleProps } from "@/shared/ui";

/** Agent 运行状态 → 胶囊文案与色调（working 呼吸点动画，offline 静止） */
const AGENT_STATUS_META: Record<
  WorkspaceAgentStatus,
  { label: string; tone: NonNullable<StatusCapsuleProps["tone"]>; animated: boolean }
> = {
  idle: { label: "idle", tone: "success", animated: false },
  working: { label: "working", tone: "accent", animated: true },
  offline: { label: "offline", tone: "neutral", animated: false },
};

export interface AgentRosterProps {
  agents: WorkspaceAgent[];
}

/** Agent 卡片列表：名称 + provider 标签 + 状态点 + 描述 */
export function AgentRoster({ agents }: AgentRosterProps) {
  if (agents.length === 0) {
    return <p className="text-sm text-tertiary">暂无 Agent，请先创建。</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => {
        const meta = AGENT_STATUS_META[agent.status];
        return (
          <li key={agent.id}>
            <Card padding="sm" className="h-full">
              <div className="flex flex-wrap items-center gap-2">
                <Bot aria-hidden="true" className="size-4 text-accent" />
                <span className="text-sm font-semibold text-primary">
                  {agent.name}
                </span>
                <StatusCapsule tone={meta.tone} animated={meta.animated}>
                  {meta.label}
                </StatusCapsule>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-tertiary">
                {agent.description || "（无描述）"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Tag>{agent.provider}</Tag>
                <Tag>并发 ×{agent.maxConcurrentTasks}</Tag>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
