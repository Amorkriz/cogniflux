import { Moon, Sun } from "@/shared/ui";
import { cn, toggleTheme } from "@/shared/utils";

export interface ThemeSwitcherProps {
  className?: string;
}

/**
 * 明暗主题切换按钮：图标显隐由 [data-theme] 驱动的 dark: 变体控制，
 * 无需组件状态，天然与 SSR/prerender 兼容（不产生水合不匹配）。
 */
export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  return (
    <button
      type="button"
      aria-label="切换明暗主题"
      onClick={() => toggleTheme()}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-control text-secondary transition-colors duration-(--motion-fast) hover:bg-raised hover:text-primary",
        className,
      )}
    >
      <Sun aria-hidden="true" className="size-5 dark:hidden" />
      <Moon aria-hidden="true" className="hidden size-5 dark:block" />
    </button>
  );
}
