import { lazy, Suspense } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/detail";
import {
  getLabExperimentBySlug,
  LAB_OUTCOME_LABEL,
  LAB_OUTCOME_VARIANT,
} from "@/domains/lab";
import { getReferencesTo, getSiteSettings, resolveRefs } from "@/domains/site";
import { Prose, RelatedRefs } from "@/shared/components";
import { FadeIn, SlideUp } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import {
  ArrowLeft,
  Badge,
  Card,
  Check,
  Skeleton,
  Tag,
} from "@/shared/ui";
import { formatDate } from "@/shared/utils";

import type { ComponentType } from "react";

/** 构建期取数：实验 meta + 关联/被引用（过程记录正文经 lazy 单独分包） */
export async function loader({ params }: Route.LoaderArgs) {
  const detail = await getLabExperimentBySlug(params.slug);
  if (!detail) {
    throw new Response("Not Found", { status: 404 });
  }
  const { experiment } = detail;
  const [site, related, referencedBy] = await Promise.all([
    getSiteSettings(),
    resolveRefs(experiment.related),
    getReferencesTo({ kind: "lab", slug: experiment.slug }),
  ]);
  return { site, experiment, related, referencedBy };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site, experiment } = data;
  return buildMeta({
    title: experiment.seo?.title ?? experiment.title,
    description: experiment.seo?.description ?? experiment.summary,
    siteTitle: site.title,
    siteUrl: site.url,
    path: `/lab/${experiment.slug}`,
    ogImage: experiment.seo?.ogImage ?? experiment.cover?.src ?? site.defaultOg,
    type: "article",
    locale: site.locale,
  });
}

type MdxContent = ComponentType<{
  components?: Record<string, ComponentType<never>>;
}>;

const bodyCache = new Map<string, MdxContent>();

function experimentBody(slug: string): MdxContent {
  const cached = bodyCache.get(slug);
  if (cached) return cached;
  const Body = lazy(async () => {
    const detail = await getLabExperimentBySlug(slug);
    if (!detail) throw new Error(`实验记录缺失：${slug}`);
    const mod = await detail.load();
    return { default: mod.default };
  });
  bodyCache.set(slug, Body);
  return Body;
}

function BodyFallback() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-11/12" />
      <Skeleton className="h-5 w-4/5" />
    </div>
  );
}

/** 实验详情：hypothesis/outcome/learnings + MDX 过程记录 + 关联/被引用 */
export default function LabDetail({ loaderData }: Route.ComponentProps) {
  const { experiment, related, referencedBy } = loaderData;
  const Body = experimentBody(experiment.slug);

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <SlideUp>
        <header>
          <Link
            to="/lab"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tertiary transition-colors duration-(--motion-fast) hover:text-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回 Lab
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant={LAB_OUTCOME_VARIANT[experiment.outcome]}>
              {LAB_OUTCOME_LABEL[experiment.outcome]}
            </Badge>
            {experiment.status === "draft" ? (
              <Badge variant="warning">DRAFT</Badge>
            ) : null}
          </div>
          <h1 className="mt-3 max-w-prose-container text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            {experiment.title}
          </h1>
          <p className="mt-4 max-w-prose-container text-lg text-secondary">
            {experiment.summary}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-tertiary">
            <time dateTime={experiment.createdAt}>
              {formatDate(experiment.createdAt)}
            </time>
            {experiment.tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        </header>
      </SlideUp>

      <FadeIn delay={0.12} className="mt-block">
        <Card elevated className="max-w-prose-container">
          <p className="font-mono text-xs text-tertiary">hypothesis</p>
          <p className="mt-2 text-base text-primary">{experiment.hypothesis}</p>
        </Card>
      </FadeIn>

      <FadeIn delay={0.18} className="mt-block">
        <Suspense fallback={<BodyFallback />}>
          <Prose body={Body} />
        </Suspense>
      </FadeIn>

      {experiment.learnings.length > 0 ? (
        <FadeIn delay={0.24} className="mt-section">
          <section aria-labelledby="lab-learnings" className="max-w-prose-container">
            <h2
              id="lab-learnings"
              className="text-xl font-semibold tracking-tight text-primary"
            >
              学到了什么
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {experiment.learnings.map((learning) => (
                <li
                  key={learning}
                  className="flex items-start gap-2 text-sm text-secondary"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent"
                  />
                  {learning}
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      ) : null}

      <RelatedRefs id="lab-related" title="相关内容" refs={related} />
      <RelatedRefs id="lab-referenced" title="被这些内容引用" refs={referencedBy} />
    </div>
  );
}
