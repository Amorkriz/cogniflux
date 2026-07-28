import { useRive } from "@rive-app/react-canvas-lite";
import { useEffect } from "react";

import {
  COMPANION_RIV_URL,
  COMPANION_STATE_MACHINE,
} from "@/services/companion";

export interface CompanionStageProps {
  /** 加载/运行期出错时回调（host 据此回退渲染 poster） */
  onError: () => void;
}

/**
 * 看板娘 Rive 舞台（default export 供 React.lazy 分包：
 * @rive-app/react-canvas-lite 只在此 chunk 内被引用）。
 * - 加载失败经 onLoadError → onError，由 host 回退 poster；
 * - 页面不可见时暂停动画（visibilitychange），可见时恢复；
 * - 卸载时 cleanup 释放 Rive 实例；canvas 纯装饰，容器 aria-hidden。
 */
export default function CompanionStage({ onError }: CompanionStageProps) {
  const { rive, RiveComponent } = useRive({
    src: COMPANION_RIV_URL,
    stateMachines: COMPANION_STATE_MACHINE,
    autoplay: true,
    onLoadError: () => onError(),
  });

  useEffect(() => {
    if (!rive) return;
    const handleVisibility = () => {
      try {
        if (document.hidden) rive.pause();
        else rive.play();
      } catch {
        onError();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      try {
        rive.cleanup();
      } catch {
        // 已被 useRive 内部释放时静默忽略
      }
    };
  }, [rive, onError]);

  return (
    <div aria-hidden="true" className="size-40">
      <RiveComponent className="size-full" />
    </div>
  );
}
