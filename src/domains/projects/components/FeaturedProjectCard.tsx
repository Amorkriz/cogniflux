import { Link } from "react-router";

import {
  ArrowRight,
  Badge,
  Card,
  ExternalLink,
  GitBranch,
  Tag,
  buttonVariants,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import { PROJECT_STATUS_LABEL, PROJECT_STATUS_VARIANT } from "./ProjectCard";

import type { Project } from "../types";

export interface FeaturedProjectCardProps {
  project: Project;
  className?: string;
}

/**
 * 精选项目大卡（视觉改版 §四）：横向布局——左 40% 封面（无 cover 时降级为
 * bg-hero + 网格装饰块 + 大号等宽代码符号）、右侧状态徽章 + title + summary +
 * techStack + 三入口按钮组（demo/repo 存在才显示，外链带 rel；详情为内链）。
 * 移动端纵向堆叠（封面上、内容下）；封面固定宽高比防 CLS。
 */
export function FeaturedProjectCard({ project, className }: FeaturedProjectCardProps) {
  return (
    <Card padding="none" elevated className={cn("overflow-hidden", className)}>
      <article className="grid md:grid-cols-5">
        {/* 左：封面（40%）。aspect-video 防 CLS；md 起随右列等高拉伸 */}
        {project.cover ? (
          <div className="aspect-video md:col-span-2 md:aspect-auto">
            <img
              src={project.cover.src}
              alt={project.cover.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            data-decor="grid"
            className="flex aspect-video items-center justify-center bg-hero md:col-span-2 md:aspect-auto"
          >
            <span className="font-mono text-4xl font-semibold text-accent-secondary">
              {"{ }"}
            </span>
          </div>
        )}

        {/* 右：内容（60%） */}
        <div className="flex flex-col gap-3 p-6 md:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={PROJECT_STATUS_VARIANT[project.projectStatus]}>
              {PROJECT_STATUS_LABEL[project.projectStatus]}
            </Badge>
            {project.status === "draft" ? (
              <Badge variant="warning">DRAFT</Badge>
            ) : null}
          </div>
          <h3 className="text-xl font-semibold text-primary sm:text-2xl">
            {project.title}
          </h3>
          <p className="text-sm text-secondary">{project.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
          {/* 三入口：主按钮=在线体验，次按钮=查看代码/项目详情 */}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            {project.links.demo ? (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "primary" }))}
              >
                在线体验
                <ExternalLink aria-hidden="true" />
              </a>
            ) : null}
            {project.links.repo ? (
              <a
                href={project.links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "secondary" }))}
              >
                <GitBranch aria-hidden="true" />
                查看代码
              </a>
            ) : null}
            <Link
              to={`/projects/${project.slug}`}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              项目详情
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
    </Card>
  );
}
