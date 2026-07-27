import type { Route } from "./+types/index";
import { getProfile } from "@/domains/profile";
import { getSiteSettings } from "@/domains/site";
import { PageHero } from "@/shared/components";
import { FadeIn, SlideUp } from "@/shared/motion";
import { buildMeta, personJsonLd } from "@/shared/seo";
import { Card, Globe, Mail, Tag } from "@/shared/ui";

export async function loader() {
  const [site, profile] = await Promise.all([getSiteSettings(), getProfile()]);
  return { site, profile };
}

export function meta({ loaderData: data }: Route.MetaArgs) {
  if (!data) return [];
  const { site, profile } = data;
  return [
    ...buildMeta({
      title: "About",
      description: profile.bio,
      siteTitle: site.title,
      siteUrl: site.url,
      path: "/about",
      ogImage: site.defaultOg,
      locale: site.locale,
    }),
    personJsonLd({
      name: profile.name,
      url: `${site.url}/about`,
      jobTitle: profile.title,
      description: profile.bio,
      sameAs: profile.socials
        .map((social) => social.url)
        .filter((url) => !url.startsWith("mailto:")),
    }),
  ];
}

/** About：Profile 整页（bio/story/skills 分组/socials） */
export default function About({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero eyebrow="about" title={profile.name} description={profile.bio} />

      <SlideUp delay={0.08} className="mt-block">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <img
            src={profile.avatar}
            alt={`${profile.name} 的头像`}
            width={112}
            height={112}
            className="size-28 shrink-0 rounded-full border border-default bg-raised"
          />
          <div className="max-w-prose-container">
            <p className="font-mono text-sm text-tertiary">{profile.title}</p>
            <p className="mt-3 text-base leading-relaxed text-secondary">
              {profile.story}
            </p>
          </div>
        </div>
      </SlideUp>

      <FadeIn delay={0.16} className="mt-section">
        <section aria-labelledby="about-skills">
          <h2
            id="about-skills"
            className="text-2xl font-semibold tracking-tight text-primary"
          >
            技能图谱
          </h2>
          <div className="mt-block grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.skills.map((group) => (
              <Card key={group.group}>
                <h3 className="text-base font-semibold text-primary">
                  {group.group}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.24} className="mt-section">
        <section aria-labelledby="about-socials">
          <h2
            id="about-socials"
            className="text-2xl font-semibold tracking-tight text-primary"
          >
            找到我
          </h2>
          <ul className="mt-block flex flex-wrap gap-3">
            {profile.socials.map((social) => {
              const isMail = social.url.startsWith("mailto:");
              const Icon = isMail ? Mail : Globe;
              return (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    {...(isMail
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-default bg-raised px-4 text-sm text-secondary transition-colors duration-(--motion-fast) hover:border-strong hover:text-primary"
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {social.platform}
                    {isMail ? null : <span className="sr-only">（新窗口打开）</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </FadeIn>
    </div>
  );
}
