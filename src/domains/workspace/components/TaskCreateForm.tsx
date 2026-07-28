import { useState } from "react";

import { Button } from "@/shared/ui";

import type { FormEvent } from "react";
import type { WorkspaceAgent } from "../types";

export interface TaskCreateFormProps {
  agents: WorkspaceAgent[];
  onSubmit: (input: { agentId: string; prompt: string }) => void;
  submitting?: boolean;
  error?: string | null;
}

/** 创建任务表单：选 Agent + prompt 输入 + 提交（无 Agent 时禁用并提示） */
export function TaskCreateForm({
  agents,
  onSubmit,
  submitting = false,
  error = null,
}: TaskCreateFormProps) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const effectiveAgentId =
    agentId && agents.some((a) => a.id === agentId) ? agentId : (agents[0]?.id ?? "");
  const disabled = submitting || agents.length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || !prompt.trim() || !effectiveAgentId) return;
    onSubmit({ agentId: effectiveAgentId, prompt: prompt.trim() });
    setPrompt("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-default bg-surface p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm text-secondary">
          目标 Agent
          <select
            value={effectiveAgentId}
            onChange={(event) => setAgentId(event.target.value)}
            disabled={disabled}
            className="h-11 min-w-40 rounded-control border border-default bg-surface px-3 text-sm text-primary transition-colors duration-(--motion-fast) hover:border-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}（{agent.provider}）
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm text-secondary">
          任务指令
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="用自然语言描述要执行的编码任务…"
            className="min-h-11 w-full resize-y rounded-control border border-default bg-surface px-3 py-2.5 text-sm text-primary transition-colors duration-(--motion-fast) placeholder:text-tertiary hover:border-strong disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <Button type="submit" disabled={disabled || !prompt.trim()}>
          {submitting ? "创建中…" : "创建任务"}
        </Button>
      </div>
      {agents.length === 0 ? (
        <p className="mt-2 text-xs text-tertiary">暂无可用 Agent，无法创建任务。</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
