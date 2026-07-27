import type {
  nowEntryCategorySchema,
  nowEntrySchema,
  nowUpdateSchema,
} from "./schema";
import type { z } from "zod";

export type NowEntryCategory = z.infer<typeof nowEntryCategorySchema>;
export type NowEntry = z.infer<typeof nowEntrySchema>;

/** 近况更新领域对象（每月一条） */
export type NowUpdate = z.infer<typeof nowUpdateSchema>;
