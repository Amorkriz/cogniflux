import { Link } from "react-router";

import { Badge, Card, Check } from "@/shared/ui";

import { AgentStatusBadge } from "./AgentStatusBadge";

import type { Agent } from "../types";

export interface AgentCardProps {
  agent: Agent;
}

/** Agent 列表卡：name/role/agentStatus 徽章/capabilities 前 3（基线 §7 列表页用） */
export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card interactive className="relative h-full">
      <article className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <AgentStatusBadge status={agent.agentStatus} />
          {agent.status === "draft" ? <Badge variant="warning">DRAFT</Badge> : null}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">
            <Link
              to={`/agents/${agent.slug}`}
              className="transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
            >
              {agent.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-tertiary">{agent.role}</p>
        </div>
        <ul className="mt-auto flex flex-col gap-1.5">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <li
              key={capability}
              className="flex items-start gap-2 text-sm text-secondary"
            >
              <Check
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-accent"
              />
              {capability}
            </li>
          ))}
        </ul>
      </article>
    </Card>
  );
}
