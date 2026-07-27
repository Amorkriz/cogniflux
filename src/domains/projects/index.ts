/** Projects 领域唯一公开出口（基线 §6）。 */
export type { Project, ProjectStatus } from "./types";
export { projectSchema, projectStatusSchema } from "./schema";
export {
  getProjects,
  getProjectBySlug,
  getProjectReferenceRecords,
} from "./repository";
export {
  ProjectCard,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_VARIANT,
  formatPeriod,
} from "./components/ProjectCard";
