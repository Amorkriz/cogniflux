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

import {
  ContentValidationError,
  validateBaseContent,
} from "../src/content-io/validate";

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

  for (const file of [...articleFiles, ...labFiles]) {
    const relPath = path.relative(rootDir, file);
    checked.push(relPath);
    try {
      const raw = fs.readFileSync(file, "utf8");
      const { data } = matter(raw);
      const meta = validateBaseContent(data, relPath);

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
