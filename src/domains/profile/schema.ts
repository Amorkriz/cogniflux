import { z } from "zod";

/**
 * Profile 领域 schema（基线 §7）：Profile 是单例、非发布物——
 * 不继承 BaseContent（无 slug/status/发布语义），存 content/data/profile.ts。
 */
export const skillGroupSchema = z.object({
  group: z.string().min(1, { message: "skills.group 必填" }),
  items: z.array(z.string()).default([]),
});

export const socialSchema = z.object({
  platform: z.string().min(1, { message: "socials.platform 必填" }),
  url: z.string().min(1, { message: "socials.url 必填" }),
});

export const profileSchema = z.object({
  name: z.string().min(1, { message: "name 必填" }),
  title: z.string().min(1, { message: "title 必填" }),
  bio: z.string().min(1, { message: "bio 必填" }),
  story: z.string().min(1, { message: "story 必填" }),
  skills: z.array(skillGroupSchema).default([]),
  socials: z.array(socialSchema).default([]),
  avatar: z.string().min(1, { message: "avatar 必填" }),
});
