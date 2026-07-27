import type { agentSchema, agentStatusSchema } from "./schema";
import type { z } from "zod";

export type AgentStatus = z.infer<typeof agentStatusSchema>;

/** Agent 领域对象 */
export type Agent = z.infer<typeof agentSchema>;
