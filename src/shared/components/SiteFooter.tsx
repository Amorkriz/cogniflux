import type { LucideIcon } from "@/shared/ui";

/** 展示型社交链接：数据由壳层（root）拼装，shared 层不碰业务数据源 */
export interface SiteFooterSocial {
  label: string;
  href: string;
  Icon: LucideIcon;
}

export interface SiteFooterProps {
  siteTitle: string;
  siteUrl: string;
  socials: SiteFooterSocial[];
}

/** 极简页脚：版权 + 社交链接，全部站点信息由 props 传入（与 content/data 同源） */
export function SiteFooter({ siteTitle, siteUrl, socials }: SiteFooterProps) {
  return (
    <footer className="border-t border-default">
      <div className="mx-auto flex max-w-page flex-col items-start justify-between gap-2 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
        <p className="text-sm text-tertiary">
          © {new Date().getFullYear()}{" "}
          <a
            href={siteUrl}
            className="transition-colors duration-(--motion-fast) hover:text-primary"
          >
            {siteTitle}
          </a>
        </p>
        <ul className="flex items-center">
          {socials.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={label}
                className="inline-flex size-11 items-center justify-center rounded-control text-tertiary transition-colors duration-(--motion-fast) hover:bg-raised hover:text-primary"
              >
                <Icon aria-hidden="true" className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
