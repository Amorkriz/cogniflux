import { StatusCapsule, Tag } from "@/shared/ui";

import { formatTaskTime } from "./task-status";

import type { Runtime } from "../types";

export interface RuntimeStatusBarProps {
  runtimes: Runtime[];
}

/** Runtime 在线状态条：每台 Runtime 一枚胶囊 + 探测到的 CLI provider 标签 */
export function RuntimeStatusBar({ runtimes }: RuntimeStatusBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-default bg-surface px-4 py-3">
      <span className="text-xs font-medium text-secondary">Runtime</span>
      {runtimes.length > 0 ? (
        runtimes.map((runtime) => (
          <span key={runtime.id} className="flex flex-wrap items-center gap-2">
            <StatusCapsule
              tone={runtime.status === "online" ? "success" : "neutral"}
              animated={runtime.status === "online"}
            >
              {runtime.name}
            </StatusCapsule>
            {runtime.detectedAgents.map((provider) => (
              <Tag key={`${runtime.id}-${provider}`}>{provider}</Tag>
            ))}
            <span className="text-xs text-tertiary">
              最近心跳 {formatTaskTime(runtime.lastSeenAt)}
            </span>
          </span>
        ))
      ) : (
        <span className="text-xs text-tertiary">暂无已注册 Runtime</span>
      )}
    </div>
  );
}
