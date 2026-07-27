import { profile as profileData } from "@content/data/profile";

import { profileSchema } from "./schema";

import type { Profile } from "./types";

/**
 * Profile 本地适配器（基线 §6/§7）：单例，非发布物，无 draft 过滤/无反向关联。
 * 结构化数据 import 自 @content/data/profile.ts，经 profileSchema 校验。
 */
export function getProfile(): Promise<Profile> {
  return Promise.resolve(profileSchema.parse(profileData));
}
