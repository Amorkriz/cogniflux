/**
 * 内容校验 CLI（tsx 运行）：`pnpm validate-content`。
 * 同时被 vite.config.ts 的 buildStart 插件复用 => 校验失败即构建失败。
 * 扫描范围：content/articles/{4位年份}/{slug}/index.mdx、content/lab/{slug}.mdx
 * （与 src/content-io/loader.ts 的 glob 完全一致；lab 不允许子目录；
 * 不符合路径形态的 .mdx 报路径结构错误；content/_templates 不参与校验）。
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";

import { privateArticles } from "../content/data/private-articles";
import {
  ContentValidationError,
  validateBaseContent,
} from "../src/content-io/validate";

import type { BaseContent } from "../src/shared/types/base";

interface ValidationResult {
  checked: string[];
  errors: string[];
}

function walkMdxFiles(
  dir: string,
  filter: (file: string) => boolean,
): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMdxFiles(full, filter));
    } else if (entry.isFile() && filter(full)) {
      out.push(full);
    }
  }
  return out.sort();
}

/** articles 合法路径：{4位年份}/{slug}/index.mdx（与 loader glob 一致） */
const ARTICLE_PATH_RE = /^\d{4}\/[^/]+\/index\.mdx$/;

/** lab 合法路径：仅顶层 {slug}.mdx，不允许子目录（与 loader glob 一致） */
const LAB_PATH_RE = /^[^/]+\.mdx$/;

/** 私密文章中性约定（ADR-010）：中性 slug 编号 + 固定中性 frontmatter */
const PRIVATE_SLUG_RE = /^p-\d{4}-\d{3}$/;
export const PRIVATE_TITLE = "私密文章";
export const PRIVATE_SUMMARY = "该文章仅作者可见。";

/**
 * 私密约束（仅 articles，ADR-010）：frontmatter 不得含秘密，
 * 公开文章 slug 不得误撞 nginx 保护路径 /writing/p-。
 * 导出供单测直接验证（不依赖磁盘 fixture）。
 */
export function collectPrivateConstraintIssues(
  meta: BaseContent,
  rawData: Record<string, unknown>,
): string[] {
  const issues: string[] = [];
  if (meta.visibility === "private") {
    if (meta.status !== "published") {
      issues.push(
        "visibility: private 文章必须 status: published（私密与草稿语义不得混用）",
      );
    }
    if (!PRIVATE_SLUG_RE.test(meta.slug)) {
      issues.push(
        `slug: 私密文章 slug 必须为中性编号 p-年份-序号（如 p-2026-001），当前为“${meta.slug}”`,
      );
    }
    if (meta.title !== PRIVATE_TITLE) {
      issues.push(
        `title: 私密文章 title 必须为中性文案“${PRIVATE_TITLE}”（真实标题写在正文首个 H1）`,
      );
    }
    if (meta.summary !== "" && meta.summary !== PRIVATE_SUMMARY) {
      issues.push(
        `summary: 私密文章 summary 须置空或固定为“${PRIVATE_SUMMARY}”（不得携带真实摘要）`,
      );
    }
    for (const field of ["cover", "seo", "related"] as const) {
      if (rawData[field] !== undefined) {
        issues.push(
          `${field}: 私密文章不得设置 ${field}（避免元数据/关联链路泄露）`,
        );
      }
    }
  } else if (/^p-\d/.test(meta.slug)) {
    issues.push(
      `slug: 公开文章 slug 不得以“p-数字”形态开头（会误撞 nginx 保护路径 /writing/p-）；若为私密文章请设 visibility: private`,
    );
  }
  return issues;
}

interface StructuredFiles {
  /** 结构合规、进入 frontmatter 校验的文件 */
  valid: string[];
  /** 路径结构违规错误（含文件路径） */
  errors: string[];
}

/**
 * 路径结构显式校验：递归发现全部 .mdx，不符合 loader glob 形态的
 * 文件报错（避免「sitemap/RSS 列出但运行时 404」）。
 */
function collectStructured(
  baseDir: string,
  rootDir: string,
  pathRe: RegExp,
  expectedShape: string,
): StructuredFiles {
  const valid: string[] = [];
  const errors: string[] = [];
  for (const file of walkMdxFiles(baseDir, (f) => f.endsWith(".mdx"))) {
    const relToBase = path.relative(baseDir, file).split(path.sep).join("/");
    if (pathRe.test(relToBase)) {
      valid.push(file);
    } else {
      errors.push(
        `内容校验失败：${path.relative(rootDir, file)}\n  - 路径结构：须为 ${expectedShape}（与 src/content-io/loader.ts 的 glob 一致，否则运行时不会被加载）`,
      );
    }
  }
  return { valid, errors };
}

export function validateAllContent(rootDir: string): ValidationResult {
  const contentDir = path.join(rootDir, "content");
  const articleScan = collectStructured(
    path.join(contentDir, "articles"),
    rootDir,
    ARTICLE_PATH_RE,
    "content/articles/{4位年份}/{slug}/index.mdx",
  );
  const labScan = collectStructured(
    path.join(contentDir, "lab"),
    rootDir,
    LAB_PATH_RE,
    "content/lab/{slug}.mdx（不允许子目录）",
  );
  const articleFiles = articleScan.valid;
  const labFiles = labScan.valid;

  const checked: string[] = [];
  const errors: string[] = [...articleScan.errors, ...labScan.errors];
  const seenSlugs = new Map<string, string>();
  // 注册表一致性（ADR-010）：p-* 文章目录 ↔ privateArticles 双向对应
  const registryBySlug = new Map(
    privateArticles.map((entry) => [entry.slug, entry]),
  );
  const seenPrivateDirs = new Set<string>();

  for (const file of [...articleFiles, ...labFiles]) {
    const isArticle = file.includes(`${path.sep}articles${path.sep}`);
    const relPath = path.relative(rootDir, file);
    checked.push(relPath);
    try {
      const raw = fs.readFileSync(file, "utf8");
      const { data } = matter(raw);
      const meta = validateBaseContent(data, relPath);

      // 私密约束（仅 articles；lab 无私密语义）
      if (isArticle) {
        for (const issue of collectPrivateConstraintIssues(
          meta,
          data as Record<string, unknown>,
        )) {
          errors.push(`内容校验失败：${relPath}\n  - ${issue}`);
        }

        // 注册表一致性：p-* 目录必须有同 slug 注册条目，且 createdAt 一致
        // （目录名判定与 loader 的 p-* glob 完全一致，公开文章不得住 p-* 目录）
        const dirSlug = path.basename(path.dirname(file));
        if (dirSlug.startsWith("p-")) {
          seenPrivateDirs.add(dirSlug);
          const registryEntry = registryBySlug.get(dirSlug);
          if (!registryEntry) {
            errors.push(
              `内容校验失败：${relPath}\n  - 注册表：p-* 目录文章必须在 content/data/private-articles.ts 注册同 slug 条目（否则 loader 不会加载该文章）`,
            );
          } else if (registryEntry.createdAt !== meta.createdAt) {
            errors.push(
              `内容校验失败：${relPath}\n  - 注册表：createdAt（${registryEntry.createdAt}）须与 frontmatter 的 createdAt（${meta.createdAt}）一致`,
            );
          }
        }
      }

      // slug 须与所在目录/文件名一致
      const expected =
        path.basename(file) === "index.mdx"
          ? path.basename(path.dirname(file))
          : path.basename(file, ".mdx");
      if (meta.slug !== expected) {
        errors.push(
          `内容校验失败：${relPath}\n  - slug: frontmatter 的 slug（${meta.slug}）须与目录/文件名（${expected}）一致`,
        );
      }

      // slug 全局唯一（CI 防大杂烩，基线 §8）
      const dup = seenSlugs.get(meta.slug);
      if (dup) {
        errors.push(
          `内容校验失败：${relPath}\n  - slug: “${meta.slug}” 与 ${dup} 重复`,
        );
      } else {
        seenSlugs.set(meta.slug, relPath);
      }
    } catch (error) {
      if (error instanceof ContentValidationError) {
        errors.push(error.message);
      } else {
        errors.push(
          `内容校验失败：${relPath}\n  - ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  // 注册表反向一致性：每个条目必须有对应文章目录（防孤儿条目漏进列表/详情）
  for (const entry of privateArticles) {
    if (!seenPrivateDirs.has(entry.slug)) {
      errors.push(
        `内容校验失败：content/data/private-articles.ts\n  - 注册表：条目“${entry.slug}”无对应文章目录 content/articles/{年}/${entry.slug}/index.mdx`,
      );
    }
  }

  return { checked, errors };
}

export function formatContentErrors(errors: string[]): string {
  return `内容校验未通过（${errors.length} 处）：\n\n${errors.join("\n\n")}`;
}

function main(): void {
  const rootDir = process.cwd();
  const { checked, errors } = validateAllContent(rootDir);

  if (errors.length > 0) {
    console.error(formatContentErrors(errors));
    process.exit(1);
  }
  console.log(`内容校验通过：${checked.length} 个文件`);
  for (const file of checked) console.log(`  ✓ ${file}`);
}

// 仅在作为 CLI 直接执行时运行（被 vite 插件 import 时不执行）
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
