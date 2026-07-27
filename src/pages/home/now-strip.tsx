import { Link } from "react-router";

import { ArrowRight, Card, StatusCapsule, Tag } from "@/shared/ui";

import type { NowUpdate } from "@/domains/now";
import type { StatusCapsuleProps } from "@/shared/ui";

interface StripRow {
  label: string;
  tone: NonNullable<StatusCapsuleProps["tone"]>;
  items: readonly string[];
}

export interface NowStripProps {
  now: NowUpdate;
}

/**
 * 首页 Now 状态条（页面内组件，不导出到任何 index.ts 桶）：
 * 三行游戏化状态——NOW BUILDING(focus) / CURRENTLY LEARNING / OPEN TO，
 * 每行 = StatusCapsule 标签 + Tag 胶囊列表；数组为空的行不渲染。
 */
export function NowStrip({ now }: NowStripProps) {
  const rows: StripRow[] = (
    [
      { label: "NOW BUILDING", tone: "accent", items: now.focus },
      {
        label: "CURRENTLY LEARNING",
        tone: "tertiary",
        items: now.currentlyLearning,
      },
      { label: "OPEN TO", tone: "warm", items: now.openTo },
    ] satisfies StripRow[]
  ).filter((row) => row.items.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="mt-section" aria-label="当前动态">
      <Card glass className="flex flex-col gap-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
          >
            <StatusCapsule tone={row.tone} className="shrink-0">
              {row.label}
            </StatusCapsule>
            <div className="flex flex-wrap gap-1.5">
              {row.items.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </div>
        ))}
        <Link
          to="/now"
          className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-secondary transition-colors duration-(--motion-fast) hover:text-accent"
        >
          查看完整动态
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Card>
    </section>
  );
}
