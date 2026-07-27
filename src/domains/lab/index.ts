/** Lab 领域唯一公开出口（基线 §6）。 */
export type { LabExperiment, LabOutcome } from "./types";
export { labSchema, labOutcomeSchema } from "./schema";
export {
  getLabExperiments,
  getLabExperimentBySlug,
  getLabReferenceRecords,
} from "./repository";
export type { LabDetail } from "./repository";
export {
  LabExperimentCard,
  LAB_OUTCOME_LABEL,
  LAB_OUTCOME_VARIANT,
} from "./components/LabExperimentCard";
