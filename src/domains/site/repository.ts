import {
  navigation as navData,
  siteSettings as siteData,
  spotlight as spotlightData,
} from "@content/data/site";

import { navigationSchema, siteSettingsSchema, spotlightSchema } from "./schema";

import { resolveRef } from "./references";

import type { ContentRef } from "@/shared/types/base";
import type { ResolvedRef } from "@/shared/types/reference";
import type { Navigation, SiteSettings } from "./types";

/**
 * Site 本地适配器（基线 §6/§7）：包装站点配置/导航/spotlight 的读取，
 * 数据源为 content/data/site.ts。spotlight 经反向关联聚合器解析为展示级链接。
 */

/** 站点单例配置（SEO/meta 基线） */
export function getSiteSettings(): Promise<SiteSettings> {
  return Promise.resolve(siteSettingsSchema.parse(siteData));
}

/** 导航（main/footer 各自按 order 升序） */
export function getNavigation(): Promise<Navigation> {
  const nav = navigationSchema.parse(navData);
  return Promise.resolve({
    main: [...nav.main].sort((a, b) => a.order - b.order),
    footer: [...nav.footer].sort((a, b) => a.order - b.order),
  });
}

/** 首页精选引用（未解析的 ContentRef） */
export function getSpotlightRef(): Promise<ContentRef> {
  return Promise.resolve(spotlightSchema.parse(spotlightData));
}

/** 首页精选（解析为 title/href；目标缺失时 undefined） */
export async function getSpotlight(): Promise<ResolvedRef | undefined> {
  return resolveRef(await getSpotlightRef());
}
