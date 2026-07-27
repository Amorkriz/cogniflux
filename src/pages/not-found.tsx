import { Link } from "react-router";

import type { Route } from "./+types/not-found";
import { PageHero } from "@/shared/components";
import { FadeIn } from "@/shared/motion";
import { ArrowRight, buttonVariants } from "@/shared/ui";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "404 · Cogniflux" },
    { name: "robots", content: "noindex" },
  ];
}

/** 404 导航回路：除顶栏外，页内直接给出全部栏目入口 */
const sections = [
  { label: "Home", href: "/" },
  { label: "Agents", href: "/agents" },
  { label: "Writing", href: "/writing" },
  { label: "Lab", href: "/lab" },
  { label: "Now", href: "/now" },
  { label: "Projects", href: "/projects" },
  { label: "Toolbox", href: "/toolbox" },
  { label: "About", href: "/about" },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="404"
        title="页面不存在"
        description="你访问的地址可能已移动或从未存在。从下面任一入口回到站点。"
      >
        <Link to="/" className={buttonVariants({ variant: "primary" })}>
          返回首页
          <ArrowRight aria-hidden="true" />
        </Link>
      </PageHero>

      <FadeIn delay={0.12} className="mt-block">
        <nav aria-label="全部栏目">
          <ul className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  to={section.href}
                  className={buttonVariants({ variant: "secondary", size: "md" })}
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </FadeIn>
    </div>
  );
}
