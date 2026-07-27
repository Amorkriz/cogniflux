import { Link } from "react-router";

import type { Route } from "./+types/detail";
import {
  AGENT_STATUS_LABEL,
  AgentStatusBadge,
  getAgentBySlug,
} from "@/domains/agents";
import {
  getReferencesTo,
  getSiteSettings,
  resolveRefs,
  sanitizeRelated,
} from "@/domains/site";
import { RelatedRefs } from "@/shared/components";
import { FadeIn, SlideUp } from "@/shared/motion";
import { buildMeta } from "@/shared/seo";
import {
  ArrowLeft,
  buttonVariants,
  Check,
  ExternalLink,
  StatusCapsule,
  Tag,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import type { AgentAccentTag } from "@/domains/agents";

export async function loader({ params }: Route.LoaderArgs) {
  const agent = await getAgentBySlug(params.slug);
  if (!agent) {
    throw new Response("Not Found", { status: 404 });
  }
  const [site, related, referencedBy, [safeAgent]] = await Promise.all([
    getSiteSettings(),
    resolveRefs(agent.related),
    getReferencesTo({ kind: "agent", slug: agent.slug }),
    // 序列化前净化 related，避免生产产物泄露 draft slug
    sanitizeRelated([agent]),
  ]);
  return { site, agent: safeAgent ?? agent, related, referencedBy };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site, agent } = data;
  return buildMeta({
    title: agent.seo?.title ?? agent.title,
    description: agent.seo?.description ?? agent.summary,
    siteTitle: site.title,
    siteUrl: site.url,
    path: `/agents/${agent.slug}`,
    ogImage: agent.seo?.ogImage ?? agent.cover?.src ?? site.defaultOg,
    type: "article",
    locale: site.locale,
  });
}

/** accentTag → 标题旁色标背景（语义令牌）；缺省回退主 accent */
const ACCENT_TAG_DOT: Record<AgentAccentTag, string> = {
  purple: "bg-accent-secondary",
  cyan: "bg-accent-tertiary",
  warm: "bg-accent-warm",
  pink: "bg-accent-pink",
};

/** Agent 详情：role/状态胶囊/能力/stack + demo 外链 + related/被引用反查 */
export default function AgentDetail({ loaderData }: Route.ComponentProps) {
  const { agent, related, referencedBy } = loaderData;

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <SlideUp>
        <header>
          <Link
            to="/agents"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tertiary transition-colors duration-(--motion-fast) hover:text-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回 Agents
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* 状态胶囊（视觉改版 §六）：呼吸点动效尊重 reduced-motion */}
            <AgentStatusBadge status={agent.agentStatus} />
            {agent.status === "draft" ? (
              <StatusCapsule tone="warning" animated={false}>
                DRAFT
              </StatusCapsule>
            ) : null}
          </div>
          {/* accentTag 色标（视觉改版 §六）：纯装饰，缺省回退主 accent */}
          <h1 className="mt-3 flex max-w-prose-container items-center gap-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            <span
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0 rounded-full",
                agent.accentTag ? ACCENT_TAG_DOT[agent.accentTag] : "bg-accent",
              )}
            />
            {agent.title}
          </h1>
          <p className="mt-2 font-mono text-sm text-tertiary">{agent.role}</p>
          <p className="mt-4 max-w-prose-container text-lg text-secondary">
            {agent.summary}
          </p>
          {agent.demo ? (
            <div className="mt-6">
              <a
                href={agent.demo.src}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "primary" })}
              >
                查看演示
                <ExternalLink aria-hidden="true" />
                <span className="sr-only">（新窗口打开）</span>
              </a>
            </div>
          ) : null}
        </header>
      </SlideUp>

      {agent.capabilities.length > 0 ? (
        <FadeIn delay={0.12} className="mt-section">
          <section aria-labelledby="agent-capabilities" className="max-w-prose-container">
            <h2
              id="agent-capabilities"
              className="text-xl font-semibold tracking-tight text-primary"
            >
              能做什么
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {agent.capabilities.map((capability) => (
                <li
                  key={capability}
                  className="flex items-start gap-2 text-sm text-secondary"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent"
                  />
                  {capability}
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>
      ) : null}

      {agent.stack.length > 0 ? (
        <FadeIn delay={0.18} className="mt-section">
          <section aria-labelledby="agent-stack" className="max-w-prose-container">
            <h2
              id="agent-stack"
              className="text-xl font-semibold tracking-tight text-primary"
            >
              技术栈
            </h2>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {agent.stack.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </section>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.24} className="mt-section">
        <section aria-labelledby="agent-limitations" className="max-w-prose-container">
          <h2
            id="agent-limitations"
            className="text-xl font-semibold tracking-tight text-primary"
          >
            当前局限
          </h2>
          <p className="mt-4 text-sm text-secondary">
            当前状态为「{AGENT_STATUS_LABEL[agent.agentStatus]}」——能力边界仍在
            持续验证中，以上能力清单以实际运行表现为准。
          </p>
        </section>
      </FadeIn>

      <RelatedRefs id="agent-related" title="相关内容" refs={related} />
      <RelatedRefs id="agent-referenced" title="被这些内容引用" refs={referencedBy} />
    </div>
  );
}
