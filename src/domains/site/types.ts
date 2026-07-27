import type {
  navItemSchema,
  navigationSchema,
  siteSettingsSchema,
} from "./schema";
import type { z } from "zod";

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type NavItem = z.infer<typeof navItemSchema>;
export type Navigation = z.infer<typeof navigationSchema>;
