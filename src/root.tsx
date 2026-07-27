import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "@/styles/globals.css";

import { getProfile } from "@/domains/profile";
import { getNavigation, getSiteSettings } from "@/domains/site";
import { AppProviders } from "@/app/providers";
import { SiteFooter, SiteHeader } from "@/shared/components";
import { PageTransition } from "@/shared/motion";
import { THEME_STORAGE_KEY } from "@/shared/utils/theme";
import { buttonVariants, GitBranch, Globe, Mail, Rss } from "@/shared/ui";

import type { SiteFooterSocial } from "@/shared/components";
import type { LucideIcon } from "@/shared/ui";

/** loader 返回可序列化的 icon 标识，渲染时再映射为图标组件（lucide 已移除品牌图标，GitHub 用 GitBranch 表意） */
const SOCIAL_ICONS: Record<string, LucideIcon> = {
  github: GitBranch,
  globe: Globe,
  mail: Mail,
  rss: Rss,
};

/** profile.socials 的 platform → 图标标识（未知平台降级为 globe） */
function socialIconId(platform: string, url: string): string {
  const key = platform.toLowerCase();
  if (key in SOCIAL_ICONS) return key;
  if (key === "email" || url.startsWith("mailto:")) return "mail";
  return "globe";
}

/**
 * 导航/站点配置/Profile 均经 domains 出口获取（构建期 loader，基线 §3/§6）。
 * 页脚 socials 在此壳层拼装，保持 shared 层不依赖 domains 的架构边界。
 */
export async function loader() {
  const [site, navigation, profile] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
    getProfile(),
  ]);
  const siteUrl = site.url.replace(/\/$/, "");
  return {
    navItems: navigation.main.map(({ label, href }) => ({ label, href })),
    siteTitle: site.title,
    siteUrl,
    socials: [
      { label: "网站", href: siteUrl, icon: "globe" },
      ...profile.socials.map(({ platform, url }) => ({
        label: platform,
        href: url,
        icon: socialIconId(platform, url),
      })),
      { label: "RSS", href: `${siteUrl}/feed.xml`, icon: "rss" },
    ],
  };
}

/**
 * 防闪烁脚本：在 React 挂载前同步读取 localStorage / 系统偏好并设置
 * data-theme，避免首帧主题跳变。storage key 由 @/shared/utils/theme 的
 * THEME_STORAGE_KEY 驱动（模板生成，消除双写），仍为同步内联脚本。
 */
function buildThemeInitScript(storageKey: string): string {
  return `(function () {
  var theme;
  try {
    var stored = localStorage.getItem(${JSON.stringify(storageKey)});
    if (stored === "light" || stored === "dark") theme = stored;
  } catch (e) { /* localStorage 不可用则跟随系统 */ }
  if (!theme) {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.dataset.theme = theme;
})();`;
}

const themeInitScript = buildThemeInitScript(THEME_STORAGE_KEY);

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* 必须先于任何渲染内容执行，防止主题闪烁 */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Meta />
        <Links />
      </head>
      <body className="bg-base text-primary">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const footerSocials: SiteFooterSocial[] = loaderData.socials.map(
    ({ label, href, icon }) => ({
      label,
      href,
      Icon: SOCIAL_ICONS[icon] ?? Globe,
    }),
  );
  return (
    <AppProviders>
      {/* skip-to-content：键盘用户跳过导航直达主内容（无障碍红线） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-toast) focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-primary focus:shadow-overlay"
      >
        跳到主内容
      </a>
      <div className="flex min-h-svh flex-col">
        <SiteHeader items={loaderData.navItems} />
        {/* 路由切换过渡：仅 opacity 150ms，以 pathname 为 key 重新入场 */}
        <PageTransition key={location.pathname} className="flex flex-1 flex-col">
          <main id="main-content" className="flex-1">
            <Outlet />
          </main>
        </PageTransition>
        <SiteFooter
          siteTitle={loaderData.siteTitle}
          siteUrl={loaderData.siteUrl}
          socials={footerSocials}
        />
      </div>
    </AppProviders>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "出错了";
  let details = "发生了意外错误。";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "错误";
    details =
      error.status === 404 ? "页面不存在。" : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-page flex-col items-start justify-center gap-block px-6">
      <p className="font-mono text-sm text-tertiary">cogniflux</p>
      <h1 className="text-4xl font-bold tracking-tight text-primary">{message}</h1>
      <p className="text-secondary">{details}</p>
      {/* 导航回路：错误态下也能回到站点主入口 */}
      <Link to="/" className={buttonVariants({ variant: "secondary", size: "md" })}>
        返回首页
      </Link>
    </main>
  );
}
