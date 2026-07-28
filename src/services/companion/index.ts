/**
 * services/companion 公开边界：看板娘纯逻辑层统一出口。
 * 禁止 import React/UI 与 domains/pages/shared（见 eslint.config.js 红线）。
 */
export { agentEventToCompanionState } from "./bridge";
export { canRenderCanvas, detectCompanionAsset } from "./loader";
export {
  COMPANION_DISMISSED_KEY,
  COMPANION_MINIMIZED_KEY,
  getCompanionPrefs,
  setCompanionDismissed,
  setCompanionMinimized,
} from "./prefs";
export {
  COMPANION_POSTER_URL,
  COMPANION_RIV_URL,
  COMPANION_STATE_MACHINE,
  COMPANION_STATES,
  type CompanionPreferences,
  type CompanionState,
} from "./types";
