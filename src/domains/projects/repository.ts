import { projects as projectsData } from "@content/data/projects";

import { refHref } from "@/shared/types/reference";
import {
  byDateDesc,
  draftsVisibleByDefault,
  filterVisible,
  isVisible,
} from "@/shared/utils/content";

import { projectSchema } from "./schema";

import type { ReferenceRecord } from "@/shared/types/reference";
import type { DraftOptions } from "@/shared/utils/content";
import type { Project } from "./types";

/**
 * Projects 本地适配器（基线 §6/§7）：结构化数据 import 自 @content/data，
 * 经 projectSchema 校验后供页面消费。
 */
function buildAll(): Project[] {
  return projectSchema.array().parse(projectsData);
}

/** 项目列表（默认按环境过滤 draft，按 createdAt 倒序） */
export function getProjects(options?: DraftOptions): Promise<Project[]> {
  const visible = filterVisible(buildAll(), options).sort((a, b) =>
    byDateDesc(a.createdAt, b.createdAt),
  );
  return Promise.resolve(visible);
}

/** 按 slug 取单个项目 */
export function getProjectBySlug(
  slug: string,
  options?: DraftOptions,
): Promise<Project | undefined> {
  const project = buildAll().find((item) => item.slug === slug);
  if (!project) return Promise.resolve(undefined);
  const includeDrafts = options?.includeDrafts ?? draftsVisibleByDefault();
  if (!isVisible(project.status, includeDrafts)) {
    return Promise.resolve(undefined);
  }
  return Promise.resolve(project);
}

/** 反向关联索引单元（构建期扫描全量 related） */
export function getProjectReferenceRecords(): Promise<ReferenceRecord[]> {
  const records = buildAll().map((project) => ({
    kind: "project" as const,
    slug: project.slug,
    title: project.title,
    href: refHref("project", project.slug),
    status: project.status,
    related: project.related,
  }));
  return Promise.resolve(records);
}
