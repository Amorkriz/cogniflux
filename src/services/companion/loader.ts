/**
 * 看板娘资产探测与运行环境检测（纯逻辑，异常一律静默降级）。
 */

import { COMPANION_RIV_URL } from "./types";

/**
 * HEAD 探测 Rive 资产是否存在：res.ok 为 true；
 * 404 / 网络异常 / 非浏览器环境一律返回 false。
 */
export async function detectCompanionAsset(): Promise<boolean> {
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return false;
  }
  try {
    const res = await fetch(COMPANION_RIV_URL, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/** 检测当前环境能否渲染 canvas 2d（Rive 渲染前置条件），异常返回 false */
export function canRenderCanvas(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.createElement("canvas").getContext("2d") !== null;
  } catch {
    return false;
  }
}
