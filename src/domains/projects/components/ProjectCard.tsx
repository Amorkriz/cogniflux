import { Link } from "react-router";

import { Badge, Card, Tag } from "@/shared/ui";

import type { Project, ProjectStatus } from "../types";
import type { BadgeProps } from "@/shared/ui";

/** 项目状态展示标签与徽章色（领域词汇归领域，基线 §10） */
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "活跃",
  "in-progress": "进行中",
  completed: "已完成",
  archived: "已归档",
};

export const PROJECT_STATUS_VARIANT: Record<
  ProjectStatus,
  NonNullable<BadgeProps["variant"]>
> = {
  active: "success",
  "in-progress": "info",
  completed: "neutral",
  archived: "outline",
};

/** period → 展示文本（如 2026-06 – 至今） */
export function formatPeriod(period: Project["period"]): string {
  return `${period.start} – ${period.end ?? "至今"}`;
}

export interface ProjectCardProps {
  project: Project;
}

/** 项目列表卡：techStack/projectStatus/period（基线 §7 列表页用） */
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card interactive className="relative h-full">
      <article className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={PROJECT_STATUS_VARIANT[project.projectStatus]}>
            {PROJECT_STATUS_LABEL[project.projectStatus]}
          </Badge>
          {project.status === "draft" ? (
            <Badge variant="warning">DRAFT</Badge>
          ) : null}
          <span className="font-mono text-xs text-tertiary">
            {formatPeriod(project.period)}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-primary">
          <Link
            to={`/projects/${project.slug}`}
            className="transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
          >
            {project.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-secondary">{project.summary}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {project.techStack.slice(0, 5).map((tech) => (
            <Tag key={tech}>{tech}</Tag>
          ))}
        </div>
      </article>
    </Card>
  );
}
