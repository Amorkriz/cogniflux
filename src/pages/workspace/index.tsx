import { Suspense, lazy, useSyncExternalStore } from "react";

import type { Route } from "./+types/index";
import { PageHero } from "@/shared/components";
import { Skeleton } from "@/shared/ui";

/** 页面主体经 React.lazy 分割：prerender 只输出轻量壳，主体在客户端按需加载 */
const WorkspaceApp = lazy(() => import("./workspace-app"));

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Workspace · Cogniflux" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

/** 加载骨架：prerender 壳与 Suspense fallback 共用 */
function WorkspaceSkeleton() {
  return (
    <div className="mt-block flex flex-col gap-4">
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

const noopSubscribe = () => () => {};

/** 水合检测：SSG/服务端渲染为 false，客户端水合完成后为 true */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Workspace 私有页：不做构建期 loader 取数（噪声内容不进产物），
 * 挂载后才渲染主体（me() 探活 → LoginGate / 任务看板，见 workspace-app.tsx）。
 */
export default function Workspace() {
  // prerender（SSG）阶段 mounted 恒为 false ⇒ HTML 只含轻量壳
  const mounted = useHydrated();

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="workspace"
        title="Workspace"
        description="私有任务工作台——向本机编码 Agent 派发任务并实时跟踪执行。"
      />
      {mounted ? (
        <Suspense fallback={<WorkspaceSkeleton />}>
          <WorkspaceApp />
        </Suspense>
      ) : (
        <WorkspaceSkeleton />
      )}
    </div>
  );
}
