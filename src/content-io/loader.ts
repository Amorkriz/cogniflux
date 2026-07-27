import { validateBaseContent } from "./validate";

import type { BaseContent } from "@/shared/types/base";
import type { ComponentType } from "react";

/**
 * 内容扫描（import.meta.glob，基线 §4）。
 * content-io 是唯一允许触碰内容文件的层，只服务 domains 的
 * repository（任务 4 接入），禁止被 pages/components 直接调用。
 */

/** MDX 模块形状（frontmatter 由 remark-mdx-frontmatter 导出） */
export interface MdxModule {
  default: ComponentType;
  frontmatter?: unknown;
}

export interface ContentEntry {
  /** 相对仓库根的文件路径（如 /content/articles/2026/x/index.mdx） */
  filePath: string;
  /** 经 Zod 校验的 frontmatter 基座字段 */
  meta: BaseContent;
  /** 原始 frontmatter（未裁剪扩展字段）：供领域 schema.extend 二次校验 */
  frontmatter: unknown;
  /** 去除 frontmatter 后的正文原文：供构建期估算阅读时长等 */
  body: string;
  /** 懒加载 MDX 组件模块（路由级代码分割） */
  load: () => Promise<MdxModule>;
}

/** 去除文件头部 frontmatter 块，返回正文原文 */
function stripFrontmatter(raw: string): string {
  return raw.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

/** 文章正文模块：懒加载（按文章分包） */
const articleModules = import.meta.glob<MdxModule>(
  "/content/articles/*/*/index.mdx",
);

/** 文章 frontmatter：构建期 eager 读取（列表页无需拉正文） */
const articleFrontmatters = import.meta.glob<unknown>(
  "/content/articles/*/*/index.mdx",
  { eager: true, import: "frontmatter" },
);

/** 文章正文原文（eager，构建期估算阅读时长） */
const articleRaw = import.meta.glob<string>("/content/articles/*/*/index.mdx", {
  eager: true,
  query: "?raw",
  import: "default",
});

/** Lab 实验记录 */
const labModules = import.meta.glob<MdxModule>("/content/lab/*.mdx");
const labFrontmatters = import.meta.glob<unknown>("/content/lab/*.mdx", {
  eager: true,
  import: "frontmatter",
});
const labRaw = import.meta.glob<string>("/content/lab/*.mdx", {
  eager: true,
  query: "?raw",
  import: "default",
});

function toEntries(
  frontmatters: Record<string, unknown>,
  modules: Record<string, () => Promise<MdxModule>>,
  rawTexts: Record<string, string>,
): ContentEntry[] {
  return Object.entries(frontmatters).map(([filePath, frontmatter]) => {
    const load = modules[filePath];
    if (!load) {
      throw new Error(`内容加载器缺失：${filePath}`);
    }
    return {
      filePath,
      meta: validateBaseContent(frontmatter, filePath),
      frontmatter,
      body: stripFrontmatter(rawTexts[filePath] ?? ""),
      load,
    };
  });
}

/** 全部文章条目（含 draft，发布过滤由 repository 负责） */
export function loadArticleEntries(): ContentEntry[] {
  return toEntries(articleFrontmatters, articleModules, articleRaw);
}

/** 全部实验条目 */
export function loadLabEntries(): ContentEntry[] {
  return toEntries(labFrontmatters, labModules, labRaw);
}
