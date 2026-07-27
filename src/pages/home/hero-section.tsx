import { Link } from "react-router";

import { HeroDecoration } from "./hero-decoration";

import { SlideUp } from "@/shared/motion";
import {
  ArrowRight,
  buttonVariants,
  GitBranch,
  Globe,
  Mail,
} from "@/shared/ui";

import type { Profile } from "@/domains/profile";
import type { LucideIcon } from "@/shared/ui";

/** profile.socials → 图标（lucide 无品牌图标：GitHub 用 GitBranch 表意；未知平台降级 Globe） */
function socialIcon(platform: string, url: string): LucideIcon {
  const key = platform.toLowerCase();
  if (key === "github") return GitBranch;
  if (key === "email" || url.startsWith("mailto:")) return Mail;
  return Globe;
}

export interface HeroSectionProps {
  profile: Profile;
}

/**
 * 首页 Hero（页面内组件，不导出到任何 index.ts 桶）：全宽区——
 * bg-hero 渐变 + grid/stars 装饰层 + bg-glow 光晕（均 aria-hidden）。
 * 左列身份陈述（唯一 h1）+ 按钮组 + 社交行；右列 HeroDecoration（lg 起显示）。
 */
export function HeroSection({ profile }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-hero">
      {/* 装饰层：网格 + 星点 + 光晕，纯 CSS、不承载内容、不进关键路径 */}
      <div aria-hidden="true" data-decor="grid" className="absolute inset-0" />
      <div aria-hidden="true" data-decor="stars" className="absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-2/3 bg-glow"
      />

      <div className="relative mx-auto grid max-w-page items-center gap-block px-4 py-section sm:px-6 lg:grid-cols-2 lg:gap-12">
        <SlideUp>
          {/* 等宽小标签：开发者工作台的“身份铭牌” */}
          <p className="font-mono text-xs font-medium tracking-widest text-accent uppercase">
            Building AI Agents · Java · LLM
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
            从 Java 到 AI Agent，把想法部署成智能体。
          </h1>
          <p className="mt-5 max-w-prose-container text-lg text-secondary">
            我把 LLM、后端工程与自动化工作流拧在一起——让每个可行的想法都能长成可用的智能体产品。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/agents" className={buttonVariants({ variant: "primary" })}>
              探索我的 Agents
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              to="/writing"
              className={buttonVariants({ variant: "secondary" })}
            >
              阅读技术文章
            </Link>
          </div>
          {/* 社交行：图标链接，外链带 rel，44×44 触控目标 */}
          <ul className="mt-6 flex items-center gap-1">
            {profile.socials.map(({ platform, url }) => {
              const Icon = socialIcon(platform, url);
              const external = !url.startsWith("mailto:");
              return (
                <li key={platform}>
                  <a
                    href={url}
                    aria-label={platform}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="inline-flex size-11 items-center justify-center rounded-control text-tertiary transition-colors duration-(--motion-fast) hover:bg-raised hover:text-primary"
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </SlideUp>

        <HeroDecoration />
      </div>

      {/* 看板娘挂载位（docs/ARCHITECTURE.md §8）：未来 TwinSparkBot 形象的
       * 唯一挂载点——首次交互后动态 import 独立 chunk，当前为空容器，
       * 不影响布局与 LCP；正式集成前禁止建 services/live2d 目录 */}
      <div id="companion-slot" aria-hidden="true" data-companion-slot />
    </section>
  );
}
