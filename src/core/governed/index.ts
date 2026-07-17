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
