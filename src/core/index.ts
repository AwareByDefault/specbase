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
export * from './change-stacks/index.js';
export * from './store/index.js';
export * from './planning-home.js';
export * from './openspec-root.js';
export {
  EnforcementTypeSchema,
  EnforcementStrengthSchema,
  EnforcementSourceKindSchema,
  DEFAULT_ENFORCEMENT_TYPES,
  type EnforcementType,
} from './artifact-graph/types.js';
