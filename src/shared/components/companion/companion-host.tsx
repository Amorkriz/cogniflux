import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { CompanionPoster } from "./companion-poster";

import {
  canRenderCanvas,
  detectCompanionAsset,
  getCompanionPrefs,
  setCompanionDismissed,
  setCompanionMinimized,
} from "@/services/companion";
import { FadeIn } from "@/shared/motion";
import { Bot, Minus, X } from "@/shared/ui";
import { cn } from "@/shared/utils";

import type { CompanionStageProps } from "./companion-stage";

/** chunk 加载失败时的兜底组件：与运行期出错同样降级为静态 poster */
function CompanionStageFallback(_props: CompanionStageProps) {
  return <CompanionPoster />;
}

/**
 * Rive 舞台独立 chunk：仅在资产探测通过后才加载。
 * 动态 import 失败（网络异常/产物缺失）时 lazy 的 reject 会抛给最近的
 * Error Boundary 导致整页崩溃，故在工厂内 catch 并兜底渲染 poster。
 */
const CompanionStage = lazy(async () => {
  try {
    return await import("./companion-stage");
  } catch {
    return { default: CompanionStageFallback };
  }
});

const noopSubscribe = () => () => {};

/** 水合检测：SSG/服务端渲染为 false，客户端水合完成后为 true */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const MOBILE_QUERY = "(max-width: 640px)";

function subscribeMobile(onStoreChange: () => void) {
  // 极旧/异常环境可能无 matchMedia：缺失时不订阅，返回空清理函数
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

/** 移动端检测：matchMedia 外部存储订阅，SSR/无 matchMedia 快照恒为 false */
function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeMobile,
    () =>
      typeof window.matchMedia === "function"
        ? window.matchMedia(MOBILE_QUERY).matches
        : false,
    () => false,
  );
}

/** 控制按钮统一样式：≥44px 触控目标 + 语义令牌 + 全局焦点环 */
const controlButtonClass =
  "inline-flex size-11 items-center justify-center rounded-control text-tertiary transition-colors duration-(--motion-fast) hover:bg-raised hover:text-primary";

export interface CompanionHostProps {
  className?: string;
}

/**
 * 全站看板娘宿主（TwinSparkBot，ADR-009）：
 * - 水合门控：prerender HTML 完全不含看板娘，挂载后才渲染；
 * - 偏好：dismissed → 不渲染；minimized / 移动端 → 圆形唤起按钮；
 * - 形象策略：空闲期 HEAD 探测 Rive 资产，命中且 canvas 可用 → lazy 舞台，
 *   否则（含舞台运行期出错）回退静态 poster；
 * - 固定右下角 + 固定尺寸防 CLS，z 层用 --z-overlay 令牌。
 */
export function CompanionHost({ className }: CompanionHostProps) {
  const hydrated = useHydrated();
  // 移动端（≤640px）默认收起为唤起按钮，点击展开后本次会话内保持展开
  const isMobile = useIsMobile();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  // prefs 惰性初始化：SSR 无 window 时全 false；水合前输出恒为 null，无错配风险
  const [dismissed, setDismissed] = useState(
    () => getCompanionPrefs().dismissed,
  );
  const [minimized, setMinimized] = useState(
    () => getCompanionPrefs().minimized,
  );
  const [figure, setFigure] = useState<"poster" | "stage">("poster");
  const [stageFailed, setStageFailed] = useState(false);

  // 空闲期资产探测：requestIdleCallback，无则 setTimeout 2s 降级
  useEffect(() => {
    let cancelled = false;
    const detect = () => {
      void detectCompanionAsset().then((ok) => {
        if (!cancelled && ok && canRenderCanvas()) setFigure("stage");
      });
    };
    let idleId: number | undefined;
    let timerId: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(detect);
    } else {
      timerId = window.setTimeout(detect, 2000);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  const handleStageError = useCallback(() => setStageFailed(true), []);

  const expand = useCallback(() => {
    setMinimized(false);
    setCompanionMinimized(false);
    setMobileExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setMinimized(true);
    setCompanionMinimized(true);
    setMobileExpanded(false);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setCompanionDismissed(true);
  }, []);

  if (!hydrated || dismissed) return null;

  if (minimized || (isMobile && !mobileExpanded)) {
    return (
      <div className="fixed right-4 bottom-4 z-(--z-overlay) sm:right-6 sm:bottom-6">
        <FadeIn>
          <button
            type="button"
            aria-label="展开看板娘"
            onClick={expand}
            className="inline-flex size-11 items-center justify-center rounded-full border border-default bg-surface text-secondary shadow-card transition-colors duration-(--motion-fast) hover:bg-raised hover:text-primary"
          >
            <Bot aria-hidden="true" className="size-5" />
          </button>
        </FadeIn>
      </div>
    );
  }

  const showStage = figure === "stage" && !stageFailed;

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-(--z-overlay) sm:right-6 sm:bottom-6",
        className,
      )}
    >
      <FadeIn>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1 rounded-card border border-default bg-surface shadow-card">
            <button
              type="button"
              aria-label="收起看板娘"
              onClick={collapse}
              className={controlButtonClass}
            >
              <Minus aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-label="关闭看板娘"
              onClick={dismiss}
              className={controlButtonClass}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {/* 形象区固定尺寸（size-40）防 CLS：poster 与 Rive 舞台同尺寸 */}
          <div className="size-40">
            {showStage ? (
              <Suspense fallback={<CompanionPoster />}>
                <CompanionStage onError={handleStageError} />
              </Suspense>
            ) : (
              <CompanionPoster />
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
