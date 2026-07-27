import { Link } from "react-router";

import type { Route } from "./+types/detail";
import {
  formatPeriod,
  getProjectBySlug,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_VARIANT,
} from "@/domains/projects";
import { getReferencesTo, getSiteSettings, resolveRefs } from "@/domains/site";
import { RelatedRefs, Timeline, TimelineItem } from "@/shared/components";
import { FadeIn, SlideUp } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import {
  ArrowLeft,
  Badge,
  buttonVariants,
  Check,
  ExternalLink,
  Tag,
} from "@/shared/ui";

export async function loader({ params }: Route.LoaderArgs) {
  const project = await getProjectBySlug(params.slug);
  if (!project) {
    throw new Response("Not Found", { status: 404 });
  }
  const [site, related, referencedBy] = await Promise.all([
    getSiteSettings(),
    resolveRefs(project.related),
    getReferencesTo({ kind: "project", slug: project.slug }),
  ]);
  return { site, project, related, referencedBy };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site, project } = data;
  return buildMeta({
    title: project.seo?.title ?? project.title,
    description: project.seo?.description ?? project.summary,
    siteTitle: site.title,
    siteUrl: site.url,
    path: `/projects/${project.slug}`,
    ogImage: project.seo?.ogImage ?? project.cover?.src ?? site.defaultOg,
    type: "article",
    locale: site.locale,
  });
}

/** 外链标签（links 字段 → 展示文案） */
const LINK_LABEL: Record<string, string> = {
  repo: "代码仓库",
  demo: "在线演示",
  docs: "项目文档",
};

/** 项目详情：highlights/时间线/links + related/被引用反查 */
export default function ProjectDetail({ loaderData }: Route.ComponentProps) {
  const { project, related, referencedBy } = loaderData;
  const links = Object.entries(project.links).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <SlideUp>
        <header>
          <Link
            to="/projects"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tertiary transition-colors duration-(--motion-fast) hover:text-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回 Projects
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
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
          <h1 className="mt-3 max-w-prose-container text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-4 max-w-prose-container text-lg text-secondary">
            {project.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
          {links.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {links.map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: key === "repo" ? "primary" : "secondary",
                  })}
                >
                  {LINK_LABEL[key] ?? key}
                  <ExternalLink aria-hidden="true" />
                  <span className="sr-only">（新窗口打开）</span>
                </a>
              ))}
            </div>
          ) : null}
        </header>
      </SlideUp>

      {project.highlights.length > 0 ? (
        <FadeIn delay={0.12} className="mt-section">
          <section aria-labelledby="project-highlights" className="max-w-prose-container">
            <h2
              id="project-highlights"
              className="text-xl font-semibold tracking-tight text-primary"
            >
              项目亮点
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {project.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2 text-sm text-secondary"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent"
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.18} className="mt-section">
        <section aria-labelledby="project-timeline" className="max-w-prose-container">
          <h2
            id="project-timeline"
            className="text-xl font-semibold tracking-tight text-primary"
          >
            时间线
          </h2>
          <div className="mt-4">
            <Timeline aria-label="项目时间线">
              {project.period.end ? (
                <TimelineItem
                  time={project.period.end}
                  dateTime={project.period.end}
                  title="收尾"
                >
                  <p className="text-sm text-secondary">
                    项目进入{PROJECT_STATUS_LABEL[project.projectStatus]}状态。
                  </p>
                </TimelineItem>
              ) : (
                <TimelineItem time="至今" title="持续构建中">
                  <p className="text-sm text-secondary">
                    当前状态：{PROJECT_STATUS_LABEL[project.projectStatus]}。
                  </p>
                </TimelineItem>
              )}
              <TimelineItem
                time={project.period.start}
                dateTime={project.period.start}
                title="项目启动"
              >
                <p className="text-sm text-secondary">{project.summary}</p>
              </TimelineItem>
            </Timeline>
          </div>
        </section>
      </FadeIn>

      <RelatedRefs id="project-related" title="相关内容" refs={related} />
      <RelatedRefs
        id="project-referenced"
        title="被这些内容引用"
        refs={referencedBy}
      />
    </div>
  );
}
