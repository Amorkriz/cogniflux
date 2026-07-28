/**
 * 看板娘偏好持久化：localStorage 读写，与 shared/utils/theme.ts 同风格——
 * 非浏览器环境返回默认值，localStorage 不可用（隐私模式等）时静默降级。
 */

import type { CompanionPreferences } from "./types";

export const COMPANION_MINIMIZED_KEY = "companion:minimized";

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级为会话内生效
  }
}

/** 读取看板娘偏好（未设置/不可用时为 false） */
export function getCompanionPrefs(): CompanionPreferences {
  return {
    minimized: readFlag(COMPANION_MINIMIZED_KEY),
  };
}

/** 持久化"已收起"偏好 */
export function setCompanionMinimized(minimized: boolean): void {
  writeFlag(COMPANION_MINIMIZED_KEY, minimized);
}
