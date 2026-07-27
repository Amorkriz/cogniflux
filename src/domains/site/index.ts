/**
 * Site 领域唯一公开出口（基线 §6）：站点配置/导航/spotlight
 * 以及跨领域反向关联聚合器（resolveRef/resolveRefs/getReferencesTo）。
 */
export type { SiteSettings, Navigation, NavItem } from "./types";
export {
  siteSettingsSchema,
  navigationSchema,
  navItemSchema,
  spotlightSchema,
} from "./schema";
export {
  getSiteSettings,
  getNavigation,
  getSpotlightRef,
  getSpotlight,
} from "./repository";
export {
  resolveRef,
  resolveRefs,
  getReferencesTo,
  sanitizeRelated,
} from "./references";
