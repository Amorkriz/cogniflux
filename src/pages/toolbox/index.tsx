import type { Route } from "./+types/index";
import { getSiteSettings } from "@/domains/site";
import { getTools, TOOL_CATEGORY_LABEL, ToolCard } from "@/domains/toolbox";
import { PageHero } from "@/shared/components";
import { Stagger } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import { EmptyState, Wrench } from "@/shared/ui";

import type { Tool, ToolCategory } from "@/domains/toolbox";

export async function loader() {
  const [site, tools] = await Promise.all([getSiteSettings(), getTools()]);
  return { site, tools };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site } = data;
  return buildMeta({
    title: "Toolbox",
    description: "在用的工具与方法：按分类分组，附推荐度与真实使用场景。",
    siteTitle: site.title,
    siteUrl: site.url,
    path: "/toolbox",
    ogImage: site.defaultOg,
    locale: site.locale,
  });
}

/** 分组展示顺序（固定，与 TOOL_CATEGORY_LABEL 对应） */
const CATEGORY_ORDER: ToolCategory[] = [
  "dev",
  "ai",
  "productivity",
  "hardware",
  "method",
];

/** Toolbox：纯列表页（分类分组 + recommendLevel 星级 + useCase + 外链） */
export default function Toolbox({ loaderData }: Route.ComponentProps) {
  const { tools } = loaderData;
  const groups = CATEGORY_ORDER.map(
    (category) =>
      [category, tools.filter((tool) => tool.category === category)] as const,
  ).filter(([, items]) => items.length > 0);

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="toolbox"
        title="Toolbox"
        description="在用的工具与方法：按分类分组，附推荐度与真实使用场景。"
      />
      {groups.length > 0 ? (
        <div className="mt-block flex flex-col gap-block">
          {groups.map(([category, items]: readonly [ToolCategory, Tool[]]) => (
            <section key={category} aria-labelledby={`toolbox-${category}`}>
              <h2
                id={`toolbox-${category}`}
                className="text-xl font-semibold tracking-tight text-primary"
              >
                {TOOL_CATEGORY_LABEL[category]}
              </h2>
              <Stagger className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </Stagger>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-block">
          <EmptyState
            icon={<Wrench />}
            title="工具清单还在整理"
            description="常用工具与方法即将上架。"
          />
        </div>
      )}
    </div>
  );
}
