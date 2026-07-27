import { describe, expect, it } from "vitest";

import { getProfile, profileSchema } from "@/domains/profile";

describe("profile repository", () => {
  it("取单例：字段完整", async () => {
    const profile = await getProfile();
    expect(profile.name.length).toBeGreaterThan(0);
    expect(profile.title).toContain("AI Agent");
    expect(profile.skills.length).toBeGreaterThan(0);
    expect(profile.socials.length).toBeGreaterThan(0);
    expect(profile.avatar.length).toBeGreaterThan(0);
  });

  it("schema 拒绝坏数据（缺 name）", () => {
    expect(() =>
      profileSchema.parse({
        title: "x",
        bio: "b",
        story: "s",
        avatar: "/a.png",
      }),
    ).toThrow();
  });
});
