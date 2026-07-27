import type { Route } from "./+types/index";
import { getProjects, ProjectCard } from "@/domains/projects";
import { getSiteSettings, sanitizeRelated } from "@/domains/site";
import { PageHero } from "@/shared/components";
import { Stagger } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import { EmptyState, Hammer } from "@/shared/ui";

export async function loader() {
  const [site, rawProjects] = await Promise.all([getSiteSettings(), getProjects()]);
  // 序列化前净化 related，避免生产产物泄露 draft slug
  const projects = await sanitizeRelated(rawProjects);
  return { site, projects };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site } = data;
  return buildMeta({
    title: "Projects",
    description: "正在构建与已经完成的项目——技术栈、状态与阶段性成果。",
    siteTitle: site.title,
    siteUrl: site.url,
    path: "/projects",
    ogImage: site.defaultOg,
    locale: site.locale,
  });
}

/** Projects：项目列表（techStack/projectStatus/period） */
export default function Projects({ loaderData }: Route.ComponentProps) {
  const { projects } = loaderData;
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      {/* PageHero 装饰背景（视觉改版 §六）：网格 + 光晕，纯装饰不影响文本可读 */}
      <div className="relative">
        <div
          aria-hidden="true"
          data-decor="grid"
          className="absolute -inset-x-4 -inset-y-6 sm:-inset-x-6"
        />
        <div
          aria-hidden="true"
          className="absolute -inset-x-4 -inset-y-6 bg-glow sm:-inset-x-6"
        />
        <div className="relative">
          <PageHero
            eyebrow="projects"
            title="Projects"
            description="正在构建与已经完成的项目——技术栈、状态与阶段性成果。"
          />
        </div>
      </div>
      {projects.length > 0 ? (
        <Stagger className="mt-block grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </Stagger>
      ) : (
        <div className="mt-block">
          <EmptyState
            icon={<Hammer />}
            title="还没有项目"
            description="第一个项目正在构建中。"
          />
        </div>
      )}
    </div>
  );
}
