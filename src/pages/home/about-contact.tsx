import { Link } from "react-router";

import {
  ArrowRight,
  buttonVariants,
  GitBranch,
  Globe,
  Mail,
  Tag,
} from "@/shared/ui";

import type { Profile } from "@/domains/profile";
import type { LucideIcon } from "@/shared/ui";

/** profile.socials → 图标（与 HeroSection 同规则：GitHub 用 GitBranch 表意） */
function socialIcon(platform: string, url: string): LucideIcon {
  const key = platform.toLowerCase();
  if (key === "github") return GitBranch;
  if (key === "email" || url.startsWith("mailto:")) return Mail;
  return Globe;
}

export interface AboutContactProps {
  profile: Profile;
}

/**
 * 首页 About/Contact 区（页面内组件，不导出到任何 index.ts 桶）：
 * 头像 + name/title/bio + skills 前 2 组标签 + socials 按钮组 + 完整介绍入口。
 */
export function AboutContact({ profile }: AboutContactProps) {
  return (
    <section className="mt-section" aria-labelledby="home-about">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <img
          src={profile.avatar}
          alt={`${profile.name} 的头像`}
          loading="lazy"
          className="size-20 shrink-0 rounded-full border border-default object-cover"
        />
        <div className="flex flex-col gap-4">
          <div>
            <h2
              id="home-about"
              className="text-2xl font-semibold tracking-tight text-primary"
            >
              {profile.name}
            </h2>
            <p className="mt-1 font-mono text-sm text-tertiary">{profile.title}</p>
          </div>
          <p className="max-w-prose-container text-secondary">{profile.bio}</p>
          {/* skills 前 2 组：组名 + 标签胶囊 */}
          <div className="flex flex-col gap-2.5">
            {profile.skills.slice(0, 2).map((group) => (
              <div
                key={group.group}
                className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="shrink-0 text-xs font-medium text-tertiary">
                  {group.group}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {profile.socials.map(({ platform, url }) => {
              const Icon = socialIcon(platform, url);
              const external = !url.startsWith("mailto:");
              return (
                <a
                  key={platform}
                  href={url}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  <Icon aria-hidden="true" />
                  {platform}
                </a>
              );
            })}
            <Link
              to="/about"
              className="inline-flex min-h-11 items-center gap-1 text-sm text-secondary transition-colors duration-(--motion-fast) hover:text-accent"
            >
              查看完整介绍
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
