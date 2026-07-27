import { Link } from "react-router";

import type { Route } from "./+types/index";
import { AgentCard, getAgents } from "@/domains/agents";
import { ArticleCard, getArticles } from "@/domains/articles";
import { getProfile } from "@/domains/profile";
import { getProjects, ProjectCard } from "@/domains/projects";
import { getSiteSettings, getSpotlight } from "@/domains/site";
import { FadeIn, SlideUp, Stagger } from "@/shared/motion";
import { buildMeta, websiteJsonLd } from "@/shared/seo";
import {
  ArrowRight,
  ArrowUpRight,
  buttonVariants,
  Card,
  ChevronDown,
} from "@/shared/ui";

/** 构建期取数（ssr:false + prerender：loader 在构建时运行并固化进产物） */
export async function loader() {
  const [site, profile, spotlight, articles, agents, projects] =
    await Promise.all([
      getSiteSettings(),
      getProfile(),
      getSpotlight(),
      getArticles(),
      getAgents(),
      getProjects(),
    ]);
  return {
    site,
    profile,
    spotlight,
    latestArticles: articles.slice(0, 3),
    featuredAgents: agents.filter((agent) => agent.featured),
    featuredProjects: projects.filter((project) => project.featured),
  };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site } = data;
  return [
    ...buildMeta({
      title: `${site.title} · AI Builder 的个人工作台`,
      absoluteTitle: true,
      description: site.description,
      siteTitle: site.title,
      siteUrl: site.url,
      path: "/",
      ogImage: site.defaultOg,
      locale: site.locale,
    }),
    websiteJsonLd({
      name: site.title,
      url: site.url,
      description: site.description,
    }),
  ];
}

/** 区块标题 + “查看全部”链接（页面级区块，不导出） */
function SectionHeader({
  id,
  title,
  to,
  linkLabel,
}: {
  id: string;
  title: string;
  to: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="text-2xl font-semibold tracking-tight text-primary">
        {title}
      </h2>
      <Link
        to={to}
        className="inline-flex min-h-11 items-center gap-1 text-sm text-secondary transition-colors duration-(--motion-fast) hover:text-accent"
      >
        {linkLabel}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}

/** 首页：身份陈述 Hero + spotlight 精选 + 最新文章 + 精选 Agents/Projects */
export default function Home({ loaderData }: Route.ComponentProps) {
  const { profile, spotlight, latestArticles, featuredAgents, featuredProjects } =
    loaderData;

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      {/* 移动首屏克制（基线 §12）：身份陈述 + spotlight 入口 + 滚动暗示 */}
      <SlideUp>
        <p className="font-mono text-sm text-tertiary">
          {profile.name} · cogniflux
        </p>
        <h1 className="mt-2 max-w-prose-container text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          {profile.title}
        </h1>
        <p className="mt-4 max-w-prose-container text-lg text-secondary">
          {profile.bio}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/agents" className={buttonVariants({ variant: "primary" })}>
            看看 Agents
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link to="/writing" className={buttonVariants({ variant: "secondary" })}>
            读些文章
          </Link>
        </div>
      </SlideUp>

      {spotlight ? (
        <FadeIn delay={0.12} className="mt-block">
          <Card elevated interactive className="relative">
            <p className="font-mono text-xs text-tertiary">spotlight</p>
            <h2 className="mt-2 text-xl font-semibold text-primary">
              <Link
                to={spotlight.href}
                className="inline-flex items-center gap-1.5 transition-colors duration-(--motion-fast) after:absolute after:inset-0 hover:text-accent"
              >
                {spotlight.title}
                <ArrowUpRight aria-hidden="true" className="size-5 text-tertiary" />
              </Link>
            </h2>
            <p className="mt-2 text-sm text-secondary">
              当前最值得关注的方向——从这里进入正在构建的核心项目。
            </p>
          </Card>
        </FadeIn>
      ) : null}

      {/* 滚动暗示：纯装饰，读屏隐藏 */}
      <FadeIn delay={0.2} className="mt-block flex justify-center">
        <span aria-hidden="true">
          <ChevronDown className="size-5 animate-breathe text-tertiary motion-reduce:animate-none" />
        </span>
      </FadeIn>

      {latestArticles.length > 0 ? (
        <section className="mt-section" aria-labelledby="home-articles">
          <SectionHeader
            id="home-articles"
            title="最新文章"
            to="/writing"
            linkLabel="全部文章"
          />
          <Stagger className="mt-block grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </Stagger>
        </section>
      ) : null}

      {featuredAgents.length > 0 ? (
        <section className="mt-section" aria-labelledby="home-agents">
          <SectionHeader
            id="home-agents"
            title="精选 Agents"
            to="/agents"
            linkLabel="全部 Agents"
          />
          <Stagger className="mt-block grid gap-4 sm:grid-cols-2">
            {featuredAgents.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} />
            ))}
          </Stagger>
        </section>
      ) : null}

      {featuredProjects.length > 0 ? (
        <section className="mt-section" aria-labelledby="home-projects">
          <SectionHeader
            id="home-projects"
            title="精选项目"
            to="/projects"
            linkLabel="全部项目"
          />
          <Stagger className="mt-block grid gap-4 sm:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </Stagger>
        </section>
      ) : null}
    </div>
  );
}
