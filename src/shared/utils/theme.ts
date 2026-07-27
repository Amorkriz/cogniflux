/**
 * 极简主题工具：get / set / toggle + localStorage 持久化。
 * 与 root.tsx 中的内联防闪烁脚本共享同一 storage key 与解析规则。
 * UI 组件（ThemeSwitcher）由后续任务实现。
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "cogniflux-theme";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** 读取用户显式选择过的主题（未选择过则返回 null） */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** 系统偏好（默认跟随，基线 §9） */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** 当前生效主题：显式选择 > 系统偏好 */
export function getTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/** 应用并持久化主题 */
export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级为会话内生效
  }
}

/** 切换主题，返回切换后的值 */
export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
