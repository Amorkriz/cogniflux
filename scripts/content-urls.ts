/**
 * 构建期内容 URL 枚举（node 安全实现）。
 *
 * 供 react-router.config.ts（prerender 异步枚举）与 scripts/generate-seo.ts
 * （sitemap/RSS）共用。此处不走领域 repository：RR 加载 config 时的 vite
 * 环境无项目 alias、也无 import.meta.glob 管线，因此用 fs + gray-matter
 * 扫描 MDX、相对导入 content/data/*.ts 结构化数据，与 scripts/validate-content.ts
 * 的扫描方式保持一致。slug 与发布过滤规则与领域层一致（生产只出 published）。
 * 目录形态与 src/content-io/loader.ts 的 glob 完全一致：
 * articles 仅 {4位年份}/{slug}/index.mdx，lab 仅顶层 {slug}.mdx（非递归）。
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";

import { agents } from "../content/data/agents";
import { projects } from "../content/data/projects";
import { siteSettings } from "../content/data/site";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** RSS/feed 需要的文章元数据（published only，createdAt 倒序） */
export interface FeedEntry {
  slug: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt?: string;
}

interface MdxMeta {
  slug: string;
  status: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt?: string;
}

/** 仅收集 {4位年份}/{slug}/index.mdx 形态的文章（与 loader glob 一致） */
function articleMdxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const year of readdirSync(dir)) {
    const yearDir = join(dir, year);
    if (!/^\d{4}$/.test(year) || !statSync(yearDir).isDirectory()) continue;
    for (const slug of readdirSync(yearDir)) {
      const slugDir = join(yearDir, slug);
      const indexFile = join(slugDir, "index.mdx");
      if (statSync(slugDir).isDirectory() && existsSync(indexFile)) {
        files.push(indexFile);
      }
    }
  }
  return files.sort();
}

/** 仅收集顶层 .mdx（与 loader glob /content/lab/*.mdx 一致，非递归） */
function labMdxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(
      (name) => name.endsWith(".mdx") && statSync(join(dir, name)).isFile(),
    )
    .map((name) => join(dir, name))
    .sort();
}

/** YAML 未加引号的日期会被解析为 Date，统一归一化为 ISO 字符串 */
function toIsoDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}

function readMdxMeta(filePath: string): MdxMeta {
  const { data } = matter(readFileSync(filePath, "utf8"));
  return {
    slug: String(data.slug ?? ""),
    status: String(data.status ?? ""),
    title: String(data.title ?? ""),
    summary: String(data.summary ?? ""),
    createdAt: toIsoDate(data.createdAt) ?? "",
    updatedAt: toIsoDate(data.updatedAt),
  };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 日期防御：非法 createdAt/updatedAt 直接抛错中止，避免产出坏 RSS/sitemap */
function assertValidDates(meta: MdxMeta, filePath: string): void {
  if (!ISO_DATE_RE.test(meta.createdAt)) {
    throw new Error(
      `内容日期非法：${filePath}\n  - createdAt（"${meta.createdAt}"）须为 YYYY-MM-DD`,
    );
  }
  if (meta.updatedAt !== undefined && !ISO_DATE_RE.test(meta.updatedAt)) {
    throw new Error(
      `内容日期非法：${filePath}\n  - updatedAt（"${meta.updatedAt}"）须为 YYYY-MM-DD`,
    );
  }
}

function publishedMdxMetas(files: string[]): MdxMeta[] {
  return files
    .map((file) => ({ file, meta: readMdxMeta(file) }))
    .filter(({ meta }) => meta.status === "published")
    .map(({ file, meta }) => {
      assertValidDates(meta, file);
      return meta;
    });
}

/** 站点 URL（sitemap/RSS 用，来自 content/data/site.ts） */
export function getSiteUrl(): string {
  return siteSettings.url.replace(/\/$/, "");
}

export function getSiteMeta() {
  return {
    title: siteSettings.title,
    description: siteSettings.description,
    url: getSiteUrl(),
    locale: siteSettings.locale,
  };
}

/** 8 栏目 + 首页（/dev/ui 与 404 不进 sitemap，但要 prerender） */
export const STATIC_PATHS = [
  "/",
  "/agents",
  "/writing",
  "/lab",
  "/now",
  "/projects",
  "/toolbox",
  "/about",
];

/** 不进 sitemap 的 prerender 路径（/workspace 为私有页，只出轻量壳） */
export const INTERNAL_PATHS = ["/dev/ui", "/404", "/workspace"];

/** published 文章（RSS + 详情路径），createdAt 倒序 */
export function getPublishedArticles(): FeedEntry[] {
  return publishedMdxMetas(articleMdxFiles(join(ROOT, "content/articles")))
    .map(({ slug, title, summary, createdAt, updatedAt }) => ({
      slug,
      title,
      summary,
      createdAt,
      ...(updatedAt ? { updatedAt } : {}),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 全部动态详情路径（published only）：article/lab（MDX）+ project/agent（TS 数据） */
export function getDetailPaths(): string[] {
  const articlePaths = getPublishedArticles().map(
    (article) => `/writing/${article.slug}`,
  );
  const labPaths = publishedMdxMetas(labMdxFiles(join(ROOT, "content/lab"))).map(
    (experiment) => `/lab/${experiment.slug}`,
  );
  const projectPaths = projects
    .filter((project) => project.status === "published")
    .map((project) => `/projects/${project.slug}`);
  const agentPaths = agents
    .filter((agent) => agent.status === "published")
    .map((agent) => `/agents/${agent.slug}`);
  return [...articlePaths, ...labPaths, ...projectPaths, ...agentPaths];
}

/** prerender 全量路径：静态 + 内部 + 动态详情 */
export function getPrerenderPaths(): string[] {
  return [...STATIC_PATHS, ...INTERNAL_PATHS, ...getDetailPaths()];
}

/** sitemap 收录路径：排除 /dev/ui 与 404（任务约定） */
export function getSitemapPaths(): string[] {
  return [...STATIC_PATHS, ...getDetailPaths()];
}
