/// <reference types="vitest/config" />
import path from "node:path";

import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";

import { mdxOptions } from "./src/content-io/mdx";
import {
  formatContentErrors,
  validateAllContent,
} from "./scripts/validate-content";

const rootDir = import.meta.dirname;

/**
 * 构建期内容校验：frontmatter 不合法 => 构建失败（报错含文件路径）。
 * 与 `pnpm validate-content`（CI 独立步骤）共用同一套校验逻辑。
 */
function validateContentPlugin(): PluginOption {
  return {
    name: "cogniflux:validate-content",
    buildStart() {
      const result = validateAllContent(rootDir);
      if (result.errors.length > 0) {
        throw new Error(formatContentErrors(result.errors));
      }
    },
  };
}

/**
 * MDX 插件包装：跳过带 query 的 id（如 ?raw），交给 vite 原生 raw loader。
 * @mdx-js/rollup 内部 createFilter 会剥离 query，无法用 exclude 区分 ?raw，
 * 故在 transform 层用完整 id 做守卫；正常 .mdx 导入不带 query，照常编译。
 */
function mdxPlugin(): PluginOption {
  const plugin = mdx(mdxOptions);
  const original = plugin.transform;
  return {
    ...plugin,
    enforce: "pre",
    transform(this: unknown, code: string, id: string) {
      if (id.includes("?")) return null;
      // vite 8.1+ 的 transform 钩子类型收窄，用结构化断言兼容 fn 与 { handler } 两种形态
      const hook = original as
        | ((c: string, i: string) => unknown)
        | { handler?: (c: string, i: string) => unknown }
        | undefined;
      const handler = typeof hook === "function" ? hook : hook?.handler;
      return handler ? handler.call(this, code, id) : null;
    },
  } as PluginOption;
}

export default defineConfig({
  plugins: [
    validateContentPlugin(),
    mdxPlugin(),
    tailwindcss(),
    // Vitest 下不加载 react-router 框架插件（测试不需要路由构建）。
    !process.env.VITEST && reactRouter(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@content": path.resolve(rootDir, "content"),
    },
  },
  server: {
    // dev 下将 /api 代理到本机 orchestrator 后端（含 WS），
    // 保持与生产 nginx 同源模型一致：前端始终走相对路径 /api/*。
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: false,
        ws: true,
      },
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
