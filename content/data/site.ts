/**
 * 站点配置 + 导航（单例 TS 数据文件，基线 §7）。
 * 占位版：最小 SiteSettings + Navigation 常量；
 * 正式类型迁入 src/domains/site（任务 4），届时此处只保留数据。
 */

export interface SiteSettings {
  title: string;
  description: string;
  url: string;
  defaultOg: string;
  locale: string;
  icp?: string;
}

export interface NavItem {
  label: string;
  href: string;
  order: number;
}

export interface Navigation {
  main: NavItem[];
  footer: NavItem[];
}

export const siteSettings: SiteSettings = {
  title: "Cogniflux",
  description: "AI Builder 的个人工作台：构建、写作与实验的公开记录。",
  url: "https://cogniflux.me",
  defaultOg: "/og-default.png",
  locale: "zh-CN",
  icp: "浙ICP备2026058003号-1",
};

/** 8 个固定栏目，显式配置（不从内容自动生成） */
export const navigation: Navigation = {
  main: [
    { label: "Home", href: "/", order: 1 },
    { label: "Agents", href: "/agents", order: 2 },
    { label: "Writing", href: "/writing", order: 3 },
    { label: "Lab", href: "/lab", order: 4 },
    { label: "Now", href: "/now", order: 5 },
    { label: "Projects", href: "/projects", order: 6 },
    { label: "Toolbox", href: "/toolbox", order: 7 },
    { label: "About", href: "/about", order: 8 },
  ],
  footer: [],
};

/**
 * 首页跨类型精选（ContentRef：只存 kind+slug）。
 * 由 src/domains/site 的反向关联聚合器在渲染时解析为 title/href。
 */
export const spotlight = {
  kind: "project",
  slug: "cogniflux-platform",
} as const;
