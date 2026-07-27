import { Link, NavLink } from "react-router";

import { cn } from "@/shared/utils";

import { MobileNav } from "./MobileNav";
import { ThemeSwitcher } from "./ThemeSwitcher";

/** 导航项数据（纯展示形态，与领域/内容层解耦） */
export interface SiteNavItem {
  label: string;
  href: string;
}

export interface SiteHeaderProps {
  items: readonly SiteNavItem[];
}

/**
 * 站点顶栏：logo + 桌面横向导航（当前路由下划线过渡）+ 主题切换 +
 * 移动端菜单按钮（lg 以下显示，8 栏目桌面横排需要 lg 宽度）。
 */
export function SiteHeader({ items }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-default bg-base/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="rounded-control font-mono text-lg font-semibold tracking-tight text-primary"
        >
          Cogniflux
        </Link>

        <nav aria-label="站点导航" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                    cn(
                      // 下划线过渡：伪元素 scale-x，纯 CSS（令牌时长），只动 transform
                      "relative py-2 text-sm font-medium transition-colors duration-(--motion-fast) after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform after:duration-(--motion-base) after:ease-out-token motion-reduce:after:transition-none",
                      isActive
                        ? "text-primary after:scale-x-100"
                        : "text-secondary hover:text-primary",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <MobileNav items={items} className="lg:hidden" />
        </div>
      </div>
    </header>
  );
}
