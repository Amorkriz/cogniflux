import type { Route } from "./+types/index";
import { AgentCard, getAgents } from "@/domains/agents";
import { getSiteSettings } from "@/domains/site";
import { PageHero } from "@/shared/components";
import { Stagger } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import { Bot, EmptyState } from "@/shared/ui";

export async function loader() {
  const [site, agents] = await Promise.all([getSiteSettings(), getAgents()]);
  return { site, agents };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site } = data;
  return buildMeta({
    title: "Agents",
    description: "构建中的 AI Agent 作品集——角色、能力边界与当前状态。",
    siteTitle: site.title,
    siteUrl: site.url,
    path: "/agents",
    ogImage: site.defaultOg,
    locale: site.locale,
  });
}

/** Agents：Agent 列表（role/agentStatus 徽章/capabilities 前 3） */
export default function Agents({ loaderData }: Route.ComponentProps) {
  const { agents } = loaderData;
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="agents"
        title="Agents"
        description="构建中的 AI Agent 作品集——角色、能力边界与当前状态。"
      />
      {agents.length > 0 ? (
        <Stagger className="mt-block grid gap-4 sm:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))}
        </Stagger>
      ) : (
        <div className="mt-block">
          <EmptyState
            icon={<Bot />}
            title="还没有 Agent"
            description="第一个 Agent 正在构建中。"
          />
        </div>
      )}
    </div>
  );
}
