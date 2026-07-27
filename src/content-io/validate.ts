import { z } from "zod";

import type {
  BaseContent,
  ContentStatus,
  ContentRef,
} from "@/shared/types/base";

/**
 * Zod 校验入口（构建期，基线 §7）：BaseContent 基座 schema。
 * 校验失败 = 构建失败（validate-content 脚本 + vite buildStart 插件双入口），
 * 报错必须包含文件路径。各领域扩展 schema 由任务 4 在 domains/x/schema.ts
 * 中以 baseContentSchema.extend(...) 定义。
 */

export const contentStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
]) satisfies z.ZodType<ContentStatus>;

export const contentRefSchema = z.object({
  kind: z.enum(["article", "project", "agent", "lab", "tool"]),
  slug: z.string(),
}) satisfies z.ZodType<ContentRef>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/, {
    message: "必须是 ISO 日期（如 2026-07-26）",
  });

/** YAML 解析器（js-yaml 等）会把未加引号的日期解析为 Date，统一归一化为 ISO 字符串 */
const isoDateInput = z.union([
  isoDate,
  z.date().transform((d) => d.toISOString().slice(0, 10)),
]);

export const baseContentSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug 必须为小写字母/数字 + 连字符",
  }),
  title: z.string().min(1, { message: "title 不能为空" }),
  summary: z
    .string()
    .min(1, { message: "summary 必填（列表页与 SEO 的最低保障）" })
    .max(160, { message: "summary 不能超过 160 字" }),
  status: contentStatusSchema,
  createdAt: isoDateInput,
  updatedAt: isoDateInput.optional(),
  tags: z.array(z.string()).default([]),
  cover: z
    .object({
      src: z.string().min(1),
      alt: z.string().min(1, { message: "cover.alt 必填（无障碍红线）" }),
    })
    .optional(),
  featured: z.boolean().optional(),
  featuredOrder: z.number().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
});

// schema 与 TS 接口永不漂移（基线 §7 类型安全链路）
type _AssertBase =
  z.output<typeof baseContentSchema> extends BaseContent ? true : never;
const _assertBase: _AssertBase = true;
void _assertBase;

export class ContentValidationError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly issues: string[],
  ) {
    super(
      `内容校验失败：${filePath}\n${issues.map((i) => `  - ${i}`).join("\n")}`,
    );
    this.name = "ContentValidationError";
  }
}

/**
 * 校验一份 frontmatter；失败抛出含文件路径的 ContentValidationError。
 */
export function validateBaseContent(
  data: unknown,
  filePath: string,
): BaseContent {
  const result = baseContentSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    );
    throw new ContentValidationError(filePath, issues);
  }
  return result.data;
}
