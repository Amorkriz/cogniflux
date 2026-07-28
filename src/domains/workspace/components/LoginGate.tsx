import { useState } from "react";

import { FadeIn } from "@/shared/motion";
import { Button, Card, Input } from "@/shared/ui";

import type { FormEvent } from "react";

export interface LoginGateProps {
  onSubmit: (password: string) => void;
  error?: string | null;
  pending?: boolean;
}

/** 居中口令登录表单：私有页入口（口令经 HTTPS 提交，凭证为 HttpOnly Cookie） */
export function LoginGate({ onSubmit, error = null, pending = false }: LoginGateProps) {
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !password) return;
    onSubmit(password);
  }

  return (
    <div className="flex min-h-96 items-center justify-center">
      <FadeIn className="w-full max-w-sm">
        <Card elevated>
          <h2 className="text-lg font-semibold text-primary">Workspace 登录</h2>
          <p className="mt-1 text-sm text-tertiary">
            这是私有工作台，请输入站点口令继续。
          </p>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <label htmlFor="workspace-password" className="sr-only">
              站点口令
            </label>
            <Input
              id="workspace-password"
              type="password"
              autoComplete="current-password"
              placeholder="站点口令"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
            />
            {error ? (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending || !password}>
              {pending ? "登录中…" : "登录"}
            </Button>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
