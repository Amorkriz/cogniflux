/** Profile 领域唯一公开出口（基线 §6）。 */
export type { Profile, SkillGroup, Social } from "./types";
export { profileSchema, skillGroupSchema, socialSchema } from "./schema";
export { getProfile } from "./repository";
