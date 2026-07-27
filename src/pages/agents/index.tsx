import type { Route } from "./+types/index";
import { AgentCard, getAgents } from "@/domains/agents";
import { getSiteSettings, sanitizeRelated } from "@/domains/site";
import { PageHero } from "@/shared/components";
import { Stagger } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import { Bot, EmptyState } from "@/shared/ui";

export async function loader() {
  const [site, rawAgents] = await Promise.all([getSiteSettings(), getAgents()]);
  // 序列化前净化 related，避免生产产物泄露 draft slug
  const agents = await sanitizeRelated(rawAgents);
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
            eyebrow="agents"
            title="Agents"
            description="构建中的 AI Agent 作品集——角色、能力边界与当前状态。"
          />
        </div>
      </div>
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
