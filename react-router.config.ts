import { getPrerenderPaths } from "./scripts/content-urls";

import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  // 静态站点：构建期 prerender 输出完整 HTML（SEO），无运行时服务端。
  ssr: false,
  // 异步枚举：8 栏目 + /dev/ui + 404 + 全部 published 详情页
  // （经 scripts/content-urls 的 node 安全枚举，与领域层同一套过滤规则）。
  async prerender() {
    return getPrerenderPaths();
  },
} satisfies Config;
