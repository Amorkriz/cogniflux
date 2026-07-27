import { Timeline, TimelineItem } from "@/shared/components";
import { BookOpen, Brain, Compass, Hammer } from "@/shared/ui";
import { formatMonth } from "@/shared/utils";

import type { NowEntryCategory, NowUpdate } from "../types";
import type { LucideIcon } from "@/shared/ui";

/** 近况条目分类展示标签与图标（基线 §7 entries.category） */
export const NOW_ENTRY_LABEL: Record<NowEntryCategory, string> = {
  building: "在构建",
  learning: "在学习",
  reading: "在阅读",
  thinking: "在思考",
};

const NOW_ENTRY_ICON: Record<NowEntryCategory, LucideIcon> = {
  building: Hammer,
  learning: Compass,
  reading: BookOpen,
  thinking: Brain,
};

const CATEGORY_ORDER: NowEntryCategory[] = [
  "building",
  "learning",
  "reading",
  "thinking",
];

export interface NowTimelineProps {
  updates: NowUpdate[];
}

/** 近况时间线：按月倒序（repository 已排序），focus + entries 分类渲染 */
export function NowTimeline({ updates }: NowTimelineProps) {
  return (
    <Timeline aria-label="近况时间线">
      {updates.map((update) => (
        <TimelineItem
          key={update.slug}
          time={formatMonth(update.date)}
          dateTime={update.date}
          title={update.title}
        >
          <p className="text-sm text-secondary">{update.summary}</p>

          {update.focus.length > 0 ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-primary">当前方向</span>
              {update.focus.map((item) => (
                <span
                  key={item}
                  className="rounded-control border border-default bg-raised px-2 py-0.5 text-xs text-secondary"
                >
                  {item}
                </span>
              ))}
            </p>
          ) : null}

          {update.entries.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2.5">
              {CATEGORY_ORDER.flatMap((category) =>
                update.entries
                  .filter((entry) => entry.category === category)
                  .map((entry, index) => {
                    const Icon = NOW_ENTRY_ICON[category];
                    return (
                      <li
                        key={`${category}-${index}`}
                        className="flex items-start gap-2.5 text-sm text-secondary"
                      >
                        <span className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 font-mono text-xs text-tertiary">
                          <Icon aria-hidden="true" className="size-3.5" />
                          {NOW_ENTRY_LABEL[category]}
                        </span>
                        <span>
                          {entry.link ? (
                            <a
                              href={entry.link}
                              className="underline decoration-1 underline-offset-2 transition-colors duration-(--motion-fast) hover:text-accent"
                            >
                              {entry.text}
                            </a>
                          ) : (
                            entry.text
                          )}
                        </span>
                      </li>
                    );
                  }),
              )}
            </ul>
          ) : null}
        </TimelineItem>
      ))}
    </Timeline>
  );
}
