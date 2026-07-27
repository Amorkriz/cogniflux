import type { labSchema, labOutcomeSchema } from "./schema";
import type { z } from "zod";

export type LabOutcome = z.infer<typeof labOutcomeSchema>;

/** Lab 实验记录领域对象 */
export type LabExperiment = z.infer<typeof labSchema>;
