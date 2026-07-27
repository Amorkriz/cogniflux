import type {
  agentAccentTagSchema,
  agentSchema,
  agentStatusSchema,
} from "./schema";
import type { z } from "zod";

export type AgentStatus = z.infer<typeof agentStatusSchema>;

/** Agent 色彩标记（视觉改版）：缺省时渲染侧回退主 accent */
export type AgentAccentTag = z.infer<typeof agentAccentTagSchema>;

/** Agent 领域对象 */
export type Agent = z.infer<typeof agentSchema>;
