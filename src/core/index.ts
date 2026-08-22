// Core Specbase logic will be implemented here
export {
  GLOBAL_CONFIG_DIR_NAME,
  GLOBAL_CONFIG_FILE_NAME,
  GLOBAL_DATA_DIR_NAME,
  type GlobalDataDirOptions,
  type GlobalConfig,
  getGlobalConfigDir,
  getGlobalConfigPath,
  getGlobalConfig,
  saveGlobalConfig,
  getGlobalDataDir
} from './global-config.js';

export * from './references.js';
export {
  PullRequestObservationSchema,
  type PullRequestObservation,
  /** @deprecated Legacy metadata source compatibility only. */
  DraftPullRequestSchema,
  /** @deprecated Use PullRequestObservation. */
  type DraftPullRequest,
} from './change-metadata/index.js';
export * from './change-stacks/index.js';
export * from './store/index.js';
export * from './planning-home.js';
export * from './openspec-root.js';
export {
  LIFECYCLE_SNAPSHOT_VERSION,
  getLifecycleSnapshot,
  type GetLifecycleSnapshotOptions,
  type LifecycleSnapshot,
  type LifecycleSnapshotDiagnostic,
  type LifecycleSnapshotPosition,
  type LifecycleSnapshotResult,
} from './lifecycle-snapshot.js';
export {
  KANBAN_BOARD_VERSION,
  deriveKanbanBoard,
  deriveKanbanSnapshot,
  validateKanbanBoardSnapshot,
  validateKanbanSnapshot,
  isKanbanBoardSnapshot,
  type ArchiveCard,
  type ChangeCard,
  type IdeaCard,
  type KanbanBoardSnapshot,
  type KanbanBoardValidationResult,
  type LegacyKanbanBoardSnapshot,
  type KanbanSnapshot,
  type KanbanValidationResult,
  type KanbanCard,
  type KanbanColumn,
  type KanbanDiagnostic,
  type KanbanSummary,
  type KanbanValidationDiagnostic,
  type KanbanStackContext,
  type ProgressCount,
  type SpecCard,
} from './view/model.js';
export {
  DIRECT_ACTION_CATALOG_VERSION,
  getDirectActions,
  validateDirectActionIntent,
  recordDirectActionResult,
  type DirectActionAvailability,
  type DirectActionBlocker,
  type CapabilityDispatchContext,
  type DirectActionCapabilityId,
  type DirectActionCatalog,
  type DirectActionDescriptor,
  type DirectActionDiagnostic,
  type DirectActionDispatchContext,
  type DirectActionDispatchKind,
  type DirectActionId,
  type DirectActionIntent,
  type DirectActionIntentValidation,
  type DirectActionResultRecording,
  type RecordDirectActionResultOptions,
  type DirectActionSkillId,
  type DirectActionTarget,
  type DirectActionTargetPosition,
  type GetDirectActionsOptions,
  type SkillDispatchContext,
} from './direct-actions.js';
export {
  EnforcementTypeSchema,
  EnforcementStrengthSchema,
  EnforcementSourceKindSchema,
  DEFAULT_ENFORCEMENT_TYPES,
  type EnforcementType,
} from './artifact-graph/types.js';
