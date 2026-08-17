/**
 * Governed spec model: foundational repository plumbing (discovery, locators,
 * parsing, spec-ID indexing, pair resolution). The enforcement drift engine and
 * CLI surfaces build on these primitives in later units.
 */
export {
  GOVERNED_SPECS_DIRNAME,
  analyzeRelativeLocator,
  locatorFromSegments,
  isSpecPlane,
  parseLocator,
  type UnsafeLocator,
  type UnsafeLocatorReason,
  type LocatorAnalysis,
  type ParsedLocator,
} from './locator.js';

export {
  discoverGovernedPairs,
  governedSpecsRoot,
  planeRoot,
  type GovernedDiscovery,
} from './discovery.js';

export {
  parseGovernedSpec,
  type ParsedGovernedSpec,
  type GovernedSpecIssue,
  type GovernedSpecIssueCode,
} from './spec-parser.js';

export {
  buildSpecIdIndex,
  findDuplicateLocalIds,
  type IndexedPair,
  type SpecIdIndex,
  type SpecIdConflict,
  type DuplicateLocalId,
  type IdentityScope,
} from './spec-id-index.js';

export {
  buildPairLookup,
  resolveGovernedPair,
  isIncompletePair,
  type PairResolution,
  type GovernedPairLookup,
} from './pair-resolver.js';

export {
  loadGovernedRepository,
  resolvePair,
  type GovernedRepository,
} from './repository.js';

export {
  parseEnforcement,
  type ParsedEnforcement,
  type EnforcementIssue,
  type EnforcementIssueCode,
  type ParseEnforcementOptions,
} from './enforcement-parser.js';

export {
  DEFAULT_LENSES,
  DEFAULT_PLANES,
  LENS_QUESTIONS,
  lensesFromPlanes,
  scopeCovers,
  scopeDepth,
  resolveDefaultLens,
  resolveLensForBinding,
  type LensDefinition,
  type LensResolution,
  type LensResolutionVia,
  type ReviewModelLike,
} from './lenses.js';

export {
  mergeGovernedSpec,
  mergeEnforcement,
  type SpecMergeResult,
  type EnforcementMergeResult,
} from './pair-merge.js';

export {
  computeCoverage,
  type CoverageInput,
  type CoverageReport,
  type CoverageState,
  type NormativeCoverage,
  type BindingDrift,
  type BindingDriftState,
} from './coverage.js';

export {
  validateTargets,
  looksLikePath,
  type TargetField,
  type TargetProblem,
  type TargetProblemKind,
  type TargetValidationResult,
  type TargetValidationOptions,
} from './target-validation.js';

export {
  compareRetiredTargets,
  analyzePairDrift,
  type RetiredTargetCandidate,
  type ReadinessBlocker,
  type PairAnalysis,
  type PairAnalysisInput,
} from './drift.js';

export {
  collectDiagnostics,
  renderDiagnostics,
  type Diagnostic,
  type DiagnosticCode,
  type DiagnosticSeverity,
  type DiagnosticsOptions,
} from './diagnostics.js';
