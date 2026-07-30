import { Link } from "react-router";

import type { Route } from "./+types/index";
import { PageHero } from "@/shared/components";
import { FadeIn } from "@/shared/motion";
import { ArrowRight, buttonVariants } from "@/shared/ui";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "私密文章 · Cogniflux" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

/**
 * 私密内容提示页（ADR-010）：nginx auth_request 401 时作为友好落地页。
 * 静态文案 + 指向 /workspace 的登录入口；prerender 但不进 sitemap。
 */
export default function PrivateNotice() {
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="private"
        title="这是一篇私密文章"
        description="这是一篇私密文章，仅作者登录后可见。若你是作者，请先在 Workspace 登录后再访问。"
      >
        <Link to="/workspace" className={buttonVariants({ variant: "primary" })}>
          前往 Workspace 登录
          <ArrowRight aria-hidden="true" />
        </Link>
      </PageHero>

      <FadeIn delay={0.12} className="mt-block">
        <Link
          to="/writing"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tertiary transition-colors duration-(--motion-fast) hover:text-accent"
        >
          返回 Writing
        </Link>
      </FadeIn>
    </div>
  );
}
