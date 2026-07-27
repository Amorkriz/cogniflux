import type { Route } from "./+types/index";
import { getNowUpdates, NowTimeline } from "@/domains/now";
import { getSiteSettings } from "@/domains/site";
import { PageHero } from "@/shared/components";
import { FadeIn } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import { CalendarDays, EmptyState } from "@/shared/ui";

export async function loader() {
  const [site, updates] = await Promise.all([getSiteSettings(), getNowUpdates()]);
  return { site, updates };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site } = data;
  return buildMeta({
    title: "Now",
    description: "此刻在做什么：按月更新的近况——构建、学习、阅读与思考。",
    siteTitle: site.title,
    siteUrl: site.url,
    path: "/now",
    ogImage: site.defaultOg,
    locale: site.locale,
  });
}

/** Now：按月倒序时间线（repository 已排序）+ focus/entries 分类渲染 */
export default function Now({ loaderData }: Route.ComponentProps) {
  const { updates } = loaderData;
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="now"
        title="Now"
        description="此刻在做什么：按月更新的近况——构建、学习、阅读与思考。"
      />
      {updates.length > 0 ? (
        <FadeIn delay={0.12} className="mt-block max-w-prose-container">
          <NowTimeline updates={updates} />
        </FadeIn>
      ) : (
        <div className="mt-block">
          <EmptyState
            icon={<CalendarDays />}
            title="还没有近况"
            description="第一条近况将在本月底更新。"
          />
        </div>
      )}
    </div>
  );
}
