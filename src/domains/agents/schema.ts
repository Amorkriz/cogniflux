import { z } from "zod";

import { baseContentSchema, contentRefSchema } from "@/content-io/validate";

/**
 * Agent 领域 schema（基线 §7）：agentStatus 驱动 AgentStatus 徽章组件。
 */
export const agentStatusSchema = z.enum([
  "concept",
  "building",
  "usable",
  "retired",
]);

export const agentDemoSchema = z.object({
  type: z.enum(["video", "link", "embed"]),
  src: z.string().min(1),
});

/**
 * Agent 色彩标记（视觉改版）：映射到语义令牌 --accent-secondary/tertiary/warm/pink。
 * 注意：optional 且无 default——未指定时渲染侧回退主 accent 蓝，避免污染存量数据。
 */
export const agentAccentTagSchema = z.enum(["purple", "cyan", "warm", "pink"]);

export const agentSchema = baseContentSchema.extend({
  role: z.string().min(1, { message: "role 必填" }),
  capabilities: z.array(z.string()).default([]),
  stack: z.array(z.string()).default([]),
  agentStatus: agentStatusSchema,
  demo: agentDemoSchema.optional(),
  /** 色彩标记：无 default，缺省时渲染侧回退主 accent */
  accentTag: agentAccentTagSchema.optional(),
  /** lucide 图标名字符串（如 "bot"）；渲染侧白名单映射，防任意注入 */
  icon: z.string().optional(),
  related: contentRefSchema.array().default([]),
});
