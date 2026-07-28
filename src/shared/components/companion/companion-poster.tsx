import { COMPANION_POSTER_URL } from "@/services/companion";
import { cn } from "@/shared/utils";

export interface CompanionPosterProps {
  className?: string;
}

/**
 * 看板娘静态海报降级形象（Rive 资产缺失 / canvas 不可用 / 运行期出错时展示）。
 * 装饰性图片：aria-hidden + 空 alt；固定宽高防 CLS；
 * 呼吸浮动复用全局 animate-float（只动 transform，令牌时长/缓动，
 * reduced-motion 由 motion-reduce:animate-none 关闭）。
 */
export function CompanionPoster({ className }: CompanionPosterProps) {
  return (
    <img
      src={COMPANION_POSTER_URL}
      alt=""
      aria-hidden="true"
      loading="lazy"
      width={160}
      height={160}
      className={cn(
        "size-40 animate-float object-contain motion-reduce:animate-none",
        className,
      )}
    />
  );
}
