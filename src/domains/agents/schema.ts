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

export const agentSchema = baseContentSchema.extend({
  role: z.string().min(1, { message: "role 必填" }),
  capabilities: z.array(z.string()).default([]),
  stack: z.array(z.string()).default([]),
  agentStatus: agentStatusSchema,
  demo: agentDemoSchema.optional(),
  related: contentRefSchema.array().default([]),
});
