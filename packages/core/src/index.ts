// Explicit rather than `export *`, so a new internal helper does not silently widen the surface
// that `adapters` and `cli` compile against.

export {
  applyPlan,
  PlanApplier,
  type PlanTarget,
} from "./apply/plan-applier.js";
export { composeAppPlugins, composeMetroConfig } from "./compose.js";
export { detectPlanConflicts } from "./conflicts.js";
export {
  type CheckResult,
  type CheckStatus,
  checkEnvironment,
  type EnvCheckResult,
  runDoctorChecks,
} from "./doctor/index.js";
export {
  type ExecutePlanOptions,
  executePlan,
  type PlanExecutionResult,
} from "./executor.js";
export { ExitCode, type ExitCodeValue } from "./exit-codes.js";
export {
  type AppConfigContribution,
  type DependencyKind,
  type EnvVariableDefinition,
  type GenerationPlan,
  type JsonEdit,
  type JsonValue,
  type MetroContribution,
  type Operation,
  type PlanConflict,
  PlanConflictError,
} from "./operations.js";
export {
  type DetectedPackageManager,
  detectPackageManager,
  getBinaryVersion,
  parseUserAgent,
} from "./package-manager.js";
export { resolvePlanPath, UnsafePlanPathError } from "./plan-path.js";
export {
  deletePreset,
  getPreset,
  getPresetSync,
  getPresetsDirectory,
  getPresetsFilePath,
  listPresets,
  loadPresets,
  loadPresetsSync,
  savePreset,
  savePresetSync,
} from "./presets.js";
export { type MaterializedFile, materializePlan } from "./preview.js";
export { loadProjectContext, type ProjectContext, projectRelativePath } from "./project.js";
export {
  ProjectPathError,
  type ValidateProjectPathOptions,
  validateProjectPath,
} from "./project-path.js";
export { redactRecord, redactText } from "./redact.js";
export {
  assertNoSymlinkAncestors,
  inspectSkillDestination,
  installSkillDirectory,
  skillTreeHash,
  withSkillRecordLock,
  writeSkillRecord,
} from "./skill-files.js";
