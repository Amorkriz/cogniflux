import { privateArticles } from "@content/data/private-articles";

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

/**
 * 泄露面红线（ADR-010）：私密文章（p-* 目录）不得出现在任何 eager glob。
 * eager glob（即使 import: "frontmatter"）会把整个编译后的 MDX 模块（含正文
 * 组件）静态拖进公开 loader chunk，且导致懒加载动态导入被 Rollup 合并进
 * 同一 chunk、不再产生独立 facade。故以下三个 glob 只服务公开文章；
 * 私密 MDX 仅经 privateArticleModules（懒加载-only）引用。
 * 注：import.meta.glob 的模式必须是字面量，故三处负向排除逐一内联。
 */
/** 公开文章正文模块：懒加载（按文章分包） */
const articleModules = import.meta.glob<MdxModule>([
  "/content/articles/*/*/index.mdx",
  "!/content/articles/*/p-*/index.mdx",
]);

/** 公开文章 frontmatter：构建期 eager 读取（列表页无需拉正文） */
const articleFrontmatters = import.meta.glob<unknown>(
  ["/content/articles/*/*/index.mdx", "!/content/articles/*/p-*/index.mdx"],
  { eager: true, import: "frontmatter" },
);

/** 公开文章正文原文（eager，构建期估算阅读时长） */
const articleRaw = import.meta.glob<string>(
  ["/content/articles/*/*/index.mdx", "!/content/articles/*/p-*/index.mdx"],
  { eager: true, query: "?raw", import: "default" },
);

/** 私密文章正文模块：懒加载-only（无 eager/raw/frontmatter 变体），
 * 使其成为独立 chunk 并由 vite chunkFileNames 落入 assets/private/。 */
const privateArticleModules = import.meta.glob<MdxModule>(
  "/content/articles/*/p-*/index.mdx",
);

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

/** 全部公开文章条目（含 draft，发布过滤由 repository 负责；不含私密） */
export function loadArticleEntries(): ContentEntry[] {
  return toEntries(articleFrontmatters, articleModules, articleRaw);
}

/** 私密文章条目：元数据来自中性注册表，正文仅懒加载（body 恒为空串） */
export interface PrivateContentEntry {
  slug: string;
  createdAt: string;
  /** 懒加载 MDX 正文模块（独立 chunk，落 assets/private/） */
  load: () => Promise<MdxModule>;
}

/** 全部私密文章条目（ADR-010）：注册表 ↔ 目录一致性由 validate-content 保障 */
export function loadPrivateArticleEntries(): PrivateContentEntry[] {
  return privateArticles.map(({ slug, createdAt }) => {
    const key = Object.keys(privateArticleModules).find((filePath) =>
      filePath.endsWith(`/${slug}/index.mdx`),
    );
    const load = key ? privateArticleModules[key] : undefined;
    if (!load) {
      throw new Error(`私密文章加载器缺失：${slug}（注册表与文章目录不一致）`);
    }
    return { slug, createdAt, load };
  });
}

/** 全部实验条目 */
export function loadLabEntries(): ContentEntry[] {
  return toEntries(labFrontmatters, labModules, labRaw);
}
