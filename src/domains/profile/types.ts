import type { profileSchema, skillGroupSchema, socialSchema } from "./schema";
import type { z } from "zod";

export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Social = z.infer<typeof socialSchema>;

/** 个人档案单例领域对象 */
export type Profile = z.infer<typeof profileSchema>;
