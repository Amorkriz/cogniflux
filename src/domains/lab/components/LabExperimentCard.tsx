import { Link } from "react-router";

import { Badge, Card } from "@/shared/ui";
import { formatDate } from "@/shared/utils";

import type { LabExperiment, LabOutcome } from "../types";
import type { BadgeProps } from "@/shared/ui";

/** 实验结果展示标签与徽章色：failed 是一等公民，正常展示（基线 §7） */
export const LAB_OUTCOME_LABEL: Record<LabOutcome, string> = {
  success: "成功",
  failed: "失败",
  ongoing: "进行中",
  paused: "已暂停",
};

export const LAB_OUTCOME_VARIANT: Record<
  LabOutcome,
  NonNullable<BadgeProps["variant"]>
> = {
  success: "success",
  failed: "danger",
  ongoing: "info",
  paused: "warning",
};

export interface LabExperimentCardProps {
  experiment: LabExperiment;
}

/** 实验列表卡：title/outcome/date（基线 §7 列表页用） */
export function LabExperimentCard({ experiment }: LabExperimentCardProps) {
  return (
    <Card interactive className="relative h-full">
      <article className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={LAB_OUTCOME_VARIANT[experiment.outcome]}>
            {LAB_OUTCOME_LABEL[experiment.outcome]}
          </Badge>
          {experiment.status === "draft" ? (
            <Badge variant="warning">DRAFT</Badge>
          ) : null}
          <time
            dateTime={experiment.createdAt}
            className="font-mono text-xs text-tertiary"
          >
            {formatDate(experiment.createdAt)}
          </time>
        </div>
        <h3 className="text-lg font-semibold text-primary">
          <Link
            to={`/lab/${experiment.slug}`}
            className="transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
          >
            {experiment.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-secondary">{experiment.summary}</p>
      </article>
    </Card>
  );
}
