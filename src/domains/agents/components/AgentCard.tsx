import { Link } from "react-router";

import {
  ArrowRight,
  Badge,
  Bot,
  Brain,
  Card,
  GitPullRequest,
  Tag,
  Wrench,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import { AgentStatusBadge } from "./AgentStatusBadge";

import type { Agent, AgentAccentTag } from "../types";
import type { LucideIcon } from "@/shared/ui";

/** accentTag → 色标背景（语义令牌）；缺省回退主 accent */
const ACCENT_TAG_DOT: Record<AgentAccentTag, string> = {
  purple: "bg-accent-secondary",
  cyan: "bg-accent-tertiary",
  warm: "bg-accent-warm",
  pink: "bg-accent-pink",
};

/** accentTag → 图标文本色（语义令牌）；缺省回退主 accent */
const ACCENT_TAG_TEXT: Record<AgentAccentTag, string> = {
  purple: "text-accent-secondary",
  cyan: "text-accent-tertiary",
  warm: "text-accent-warm",
  pink: "text-accent-pink",
};

/**
 * icon 字符串 → lucide 组件白名单（防任意注入，视觉改版 §二）：
 * 仅收录种子数据会用到的图标；未命中一律兜底 Bot。
 */
const AGENT_ICON: Record<string, LucideIcon> = {
  bot: Bot,
  "git-pull-request": GitPullRequest,
  brain: Brain,
  wrench: Wrench,
};

export interface AgentCardProps {
  agent: Agent;
}

/**
 * Agent 列表卡（视觉改版重做）：顶部 accentTag 色标 + 白名单 icon（hover
 * 发光为 opacity 叠层，只动 opacity）+ 状态胶囊；中部 title/role；底部
 * stack 前 3 标签 + 右下箭头（hover 右移，只动 transform）。
 * 整卡 glowBorder 渐变描边 + interactive 微抬升；stretched-link 整卡可点。
 */
export function AgentCard({ agent }: AgentCardProps) {
  const Icon = (agent.icon ? AGENT_ICON[agent.icon] : undefined) ?? Bot;
  const dotColor = agent.accentTag ? ACCENT_TAG_DOT[agent.accentTag] : "bg-accent";
  const iconColor = agent.accentTag
    ? ACCENT_TAG_TEXT[agent.accentTag]
    : "text-accent";

  return (
    <Card interactive glowBorder className="group relative h-full">
      <article className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* accentTag 色标：小圆点，色随映射（缺省回退主 accent） */}
          <span aria-hidden="true" className={cn("size-2 rounded-full", dotColor)} />
          {/* 白名单 icon：hover 发光 = bg-glow 叠层只动 opacity（红线合规） */}
          <span className="relative inline-flex">
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-full bg-glow opacity-0 transition-opacity duration-(--motion-base) group-hover:opacity-100 motion-reduce:transition-none"
            />
            <Icon aria-hidden="true" className={cn("relative size-5", iconColor)} />
          </span>
          <AgentStatusBadge status={agent.agentStatus} />
          {agent.status === "draft" ? <Badge variant="warning">DRAFT</Badge> : null}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">
            {/* stretched-link：整卡可点，链接文本仍是标题（键盘/读屏可达） */}
            <Link
              to={`/agents/${agent.slug}`}
              className="transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
            >
              {agent.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-tertiary">{agent.role}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {agent.stack.slice(0, 3).map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
          {/* 右下箭头：hover 右移只动 transform，reduced-motion 无过渡 */}
          <ArrowRight
            aria-hidden="true"
            className="size-4 shrink-0 text-tertiary transition-transform duration-(--motion-fast) group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </div>
      </article>
    </Card>
  );
}
