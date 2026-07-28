import { cva, type VariantProps } from "class-variance-authority";
import { useRef, useState } from "react";

import { cn } from "@/shared/utils";

import { Pause, Play } from "./icon";

export const audioPlayerVariants = cva(
  "flex flex-col gap-2 rounded-card border border-default bg-surface p-4",
  {
    variants: {
      elevated: {
        true: "shadow-card",
        false: "",
      },
    },
    defaultVariants: {
      elevated: true,
    },
  },
);

export interface AudioPlayerProps extends VariantProps<
  typeof audioPlayerVariants
> {
  /** 音频文件地址 */
  src: string;
  /** 展示标题（同时用于无障碍标注） */
  title?: string;
  /** 已知总时长（秒），元数据加载完成后以实际值为准 */
  duration?: number;
  className?: string;
}

/** 秒数 → mm:ss（NaN/负值兜底为 0:00） */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * 基于 HTML5 audio 的极简播放器（基线 §10：零业务语义、只消费语义令牌）。
 * 播放/暂停按钮 44×44 触控目标；进度条用原生 range（点击/拖动/键盘可达，
 * 焦点环走全局 :focus-visible）；不自动播放。
 */
export function AudioPlayer({
  src,
  title,
  duration,
  elevated,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const [hasError, setHasError] = useState(false);

  const label = title ?? "音频";
  const progress =
    totalDuration > 0 ? Math.min((currentTime / totalDuration) * 100, 100) : 0;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <div className={cn(audioPlayerVariants({ elevated }), className)}>
      {/* 音乐类音频无语音内容，无字幕轨可提供；时长/进度已经 aria 暴露 */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onLoadedMetadata={(event) => {
          const actual = event.currentTarget.duration;
          if (Number.isFinite(actual) && actual > 0) setTotalDuration(actual);
        }}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      {title ? (
        <p className="text-sm font-medium text-primary">{title}</p>
      ) : null}
      {hasError ? (
        // 降级路径：加载失败时用提示 + 直链替换播放控件（链接键盘可达，
        // 焦点环走全局 :focus-visible）
        <p
          role="alert"
          className="flex min-h-11 items-center text-sm text-secondary"
        >
          音频加载失败，可尝试
          <a
            href={src}
            download
            className="mx-1 text-accent underline underline-offset-2 transition-colors duration-(--motion-fast) hover:text-accent-hover"
          >
            直接收听
          </a>
          或稍后重试。
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? `暂停${label}` : `播放${label}`}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-accent text-inverse transition-colors duration-(--motion-fast) select-none hover:bg-accent-hover active:bg-accent-hover [&_svg]:size-4 [&_svg]:shrink-0"
          >
            {isPlaying ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
          </button>
          <div className="relative flex h-11 min-w-0 flex-1 items-center">
            {/* 视觉轨道 + 已播放填充（宽度百分比，非裸像素） */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-raised"
            >
              <div
                className="h-full bg-accent"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={totalDuration > 0 ? Math.ceil(totalDuration) : 0}
              step={1}
              value={Math.floor(currentTime)}
              onChange={(event) => handleSeek(Number(event.target.value))}
              aria-label={`${label}播放进度`}
              aria-valuetext={`${formatTime(currentTime)} / ${formatTime(totalDuration)}`}
              className="relative h-11 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>
          <p className="shrink-0 font-mono text-xs text-tertiary tabular-nums">
            <span className="text-secondary">{formatTime(currentTime)}</span>
            {" / "}
            {formatTime(totalDuration)}
          </p>
        </div>
      )}
    </div>
  );
}
