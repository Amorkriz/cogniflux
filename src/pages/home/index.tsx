import { Link } from "react-router";

import type { Route } from "./+types/index";
import { AboutContact } from "./about-contact";
import { HeroSection } from "./hero-section";
import { NowStrip } from "./now-strip";
import { AgentCard, getAgents } from "@/domains/agents";
import { ArticleCard, getArticles } from "@/domains/articles";
import { getLatestNowUpdate } from "@/domains/now";
import { getProfile } from "@/domains/profile";
import { FeaturedProjectCard, getProjects } from "@/domains/projects";
import { getSiteSettings, getSpotlight, sanitizeRelated } from "@/domains/site";
import { FadeIn, Stagger } from "@/shared/motion";
import { buildMeta, websiteJsonLd } from "@/shared/seo";
import { ArrowRight } from "@/shared/ui";

import type { Project } from "@/domains/projects";

/** featuredOrder 升序（未设排最后） */
function byFeaturedOrder(
  a: { featuredOrder?: number },
  b: { featuredOrder?: number },
): number {
  return (
    (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
    (b.featuredOrder ?? Number.MAX_SAFE_INTEGER)
  );
}

/** 构建期取数（ssr:false + prerender：loader 在构建时运行并固化进产物） */
export async function loader() {
  const [site, profile, spotlight, rawArticles, rawAgents, rawProjects, latestNow] =
    await Promise.all([
      getSiteSettings(),
      getProfile(),
      getSpotlight(),
      getArticles(),
      getAgents(),
      getProjects(),
      getLatestNowUpdate(),
    ]);
  // 序列化前净化 related，避免生产产物泄露 draft slug
  const [articles, agents, projects] = await Promise.all([
    sanitizeRelated(rawArticles),
    sanitizeRelated(rawAgents),
    sanitizeRelated(rawProjects),
  ]);

  // Featured Project：spotlight 解析为 project 时优先，否则 featured 按 featuredOrder 第一个
  const spotlightProject: Project | undefined =
    spotlight?.kind === "project"
      ? projects.find((project) => project.slug === spotlight.slug)
      : undefined;
  const featuredProject =
    spotlightProject ??
    projects.filter((project) => project.featured).sort(byFeaturedOrder)[0];

  // Selected Agents：featured 优先（按 featuredOrder），不足补最新，共 3 张
  const featuredAgents = agents
    .filter((agent) => agent.featured)
    .sort(byFeaturedOrder);
  const restAgents = agents.filter((agent) => !agent.featured);
  const selectedAgents = [...featuredAgents, ...restAgents].slice(0, 3);

  return {
    site,
    profile,
    featuredProject,
    selectedAgents,
    latestArticles: articles.slice(0, 3),
    latestNow,
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

/**
 * 首页（视觉改版 §五）：全宽 Hero（工作台场景装饰）→ Featured Project →
 * Selected Agents → Latest Writing → NowStrip → About/Contact。
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  const { profile, featuredProject, selectedAgents, latestArticles, latestNow } =
    loaderData;
  const [firstArticle, ...restArticles] = latestArticles;

  return (
    <>
      <HeroSection profile={profile} />

      <div className="mx-auto max-w-page px-4 py-section sm:px-6">
        {featuredProject ? (
          <section aria-labelledby="home-featured-project">
            <SectionHeader
              id="home-featured-project"
              title="精选项目"
              to="/projects"
              linkLabel="全部项目"
            />
            <FadeIn delay={0.08} className="mt-block">
              <FeaturedProjectCard project={featuredProject} />
            </FadeIn>
          </section>
        ) : null}

        {selectedAgents.length > 0 ? (
          <section className="mt-section" aria-labelledby="home-agents">
            <SectionHeader
              id="home-agents"
              title="精选 Agents"
              to="/agents"
              linkLabel="全部 Agents"
            />
            <Stagger className="mt-block grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedAgents.map((agent) => (
                <AgentCard key={agent.slug} agent={agent} />
              ))}
            </Stagger>
          </section>
        ) : null}

        {latestArticles.length > 0 ? (
          <section className="mt-section" aria-labelledby="home-articles">
            <SectionHeader
              id="home-articles"
              title="最新文章"
              to="/writing"
              linkLabel="全部文章"
            />
            {/* 首篇 featured 大卡占满整行，其余 2 篇默认卡 */}
            {firstArticle ? (
              <FadeIn delay={0.08} className="mt-block">
                <ArticleCard article={firstArticle} size="featured" />
              </FadeIn>
            ) : null}
            {restArticles.length > 0 ? (
              <Stagger className="mt-4 grid gap-4 sm:grid-cols-2">
                {restArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </Stagger>
            ) : null}
          </section>
        ) : null}

        {latestNow ? <NowStrip now={latestNow} /> : null}

        <AboutContact profile={profile} />
      </div>
    </>
  );
}
