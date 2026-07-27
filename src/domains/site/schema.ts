import { z } from "zod";

import { contentRefSchema } from "@/content-io/validate";

/**
 * Site 领域 schema（基线 §7）：站点单例配置 + 导航 + 首页 spotlight。
 * 数据源为 content/data/site.ts（TS 常量，非 MDX）。
 */
export const siteSettingsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().min(1),
  defaultOg: z.string().min(1),
  locale: z.string().min(1),
  /** ICP 备案号（管局要求页脚展示）；可选，缺省则不渲染 */
  icp: z.string().min(1).optional(),
});

export const navItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  order: z.number().int(),
});

export const navigationSchema = z.object({
  main: z.array(navItemSchema).default([]),
  footer: z.array(navItemSchema).default([]),
});

/** 首页跨类型精选：只存 ContentRef，渲染时经反向关联聚合器解析 */
export const spotlightSchema = contentRefSchema;
