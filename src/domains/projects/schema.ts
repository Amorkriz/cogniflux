import { z } from "zod";

import { baseContentSchema, contentRefSchema } from "@/content-io/validate";

/**
 * Project 领域 schema（基线 §7）：projectStatus 与发布 status 分离——
 * 归档项目（projectStatus:'archived'）在 status:'published' 时仍可展示。
 */
export const projectStatusSchema = z.enum([
  "active",
  "completed",
  "archived",
  "in-progress",
]);

export const projectSchema = baseContentSchema.extend({
  techStack: z.array(z.string()).default([]),
  projectStatus: projectStatusSchema,
  period: z.object({
    start: z.string().min(1),
    end: z.string().optional(),
  }),
  links: z
    .object({
      repo: z.string().optional(),
      demo: z.string().optional(),
      docs: z.string().optional(),
    })
    .default({}),
  highlights: z.array(z.string()).default([]),
  related: contentRefSchema.array().default([]),
});
