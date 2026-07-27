import type { Route } from "./+types/index";
import { getLabExperiments, LabExperimentCard } from "@/domains/lab";
import { getSiteSettings } from "@/domains/site";
import { PageHero } from "@/shared/components";
import { Stagger } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import { EmptyState, FlaskConical } from "@/shared/ui";

export async function loader() {
  const [site, experiments] = await Promise.all([
    getSiteSettings(),
    getLabExperiments(),
  ]);
  return { site, experiments };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site } = data;
  return buildMeta({
    title: "Lab",
    description: "实验记录：假设、过程与结果——失败的实验同样值得公开。",
    siteTitle: site.title,
    siteUrl: site.url,
    path: "/lab",
    ogImage: site.defaultOg,
    locale: site.locale,
  });
}

/** Lab：实验列表（title/outcome/date，failed 是一等公民正常展示） */
export default function Lab({ loaderData }: Route.ComponentProps) {
  const { experiments } = loaderData;
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="lab"
        title="Lab"
        description="实验记录：假设、过程与结果——失败的实验同样值得公开。"
      />
      {experiments.length > 0 ? (
        <Stagger className="mt-block grid gap-4 sm:grid-cols-2">
          {experiments.map((experiment) => (
            <LabExperimentCard key={experiment.slug} experiment={experiment} />
          ))}
        </Stagger>
      ) : (
        <div className="mt-block">
          <EmptyState
            icon={<FlaskConical />}
            title="还没有实验"
            description="第一个实验正在准备中。"
          />
        </div>
      )}
    </div>
  );
}
