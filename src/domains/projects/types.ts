import type { projectSchema, projectStatusSchema } from "./schema";
import type { z } from "zod";

export type ProjectStatus = z.infer<typeof projectStatusSchema>;

/** 项目领域对象 */
export type Project = z.infer<typeof projectSchema>;
