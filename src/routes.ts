import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

/** 路由表：8 个栏目 + 4 条详情路由 + /dev/ui 组件陈列页（内部，不进 sitemap）+ 404 兜底 */
export default [
  index("pages/home/index.tsx"),
  route("agents", "pages/agents/index.tsx"),
  route("agents/:slug", "pages/agents/detail.tsx"),
  route("writing", "pages/writing/index.tsx"),
  route("writing/:slug", "pages/writing/detail.tsx"),
  route("lab", "pages/lab/index.tsx"),
  route("lab/:slug", "pages/lab/detail.tsx"),
  route("now", "pages/now/index.tsx"),
  route("projects", "pages/projects/index.tsx"),
  route("projects/:slug", "pages/projects/detail.tsx"),
  route("toolbox", "pages/toolbox/index.tsx"),
  route("about", "pages/about/index.tsx"),
  route("dev/ui", "pages/dev-ui/index.tsx"),
  route("*", "pages/not-found.tsx"),
] satisfies RouteConfig;
