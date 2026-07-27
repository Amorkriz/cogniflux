import type { toolSchema, toolCategorySchema } from "./schema";
import type { z } from "zod";

export type ToolCategory = z.infer<typeof toolCategorySchema>;

/** 工具领域对象 */
export type Tool = z.infer<typeof toolSchema>;
