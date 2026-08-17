import type { GovernedPairRecord } from '../schemas/governed-spec.schema.js';
import type { EnforcementType } from '../artifact-graph/types.js';
import type { ParsedGovernedSpec } from './spec-parser.js';
import type { ParsedEnforcement } from './enforcement-parser.js';
import { computeCoverage, type CoverageReport } from './coverage.js';
import {
  validateTargets,
  type TargetValidationOptions,
  type TargetValidationResult,
} from './target-validation.js';

/**
 * Cross-version drift: retired-target comparison (task 3.4) and the per-pair
 * readiness verdict that ties coverage and target validation together.
 *
 * When a requirement, scenario, or binding is removed, the enforcement targets
 * that a removed binding referenced can become cruft. This reports them as
 * cleanup *candidates* and whether any surviving binding still shares each one.
 * It never deletes anything — a target may be shared or intentionally retained
 * (design decision 5).
 */

export interface RetiredTargetCandidate {
  /** The target path/selector no longer referenced by its former binding(s). */
  path: string;
  /** Current binding IDs that referenced it and no longer do, sorted. */
  fromBindingIds: string[];
  /** True when a surviving (next) binding still references this target. */
  stillReferenced: boolean;
  /** Surviving binding IDs still referencing it (empty when not shared), sorted. */
  survivingBindingIds: string[];
}

function targetReferences(
  enforcement: ParsedEnforcement
): Map<string, Set<string>> {
  const refs = new Map<string, Set<string>>();
  for (const binding of enforcement.bindings) {
    const targets = binding.source ? [binding.source.split('#', 1)[0]] : binding.targets;
    for (const target of targets) {
      const bucket = refs.get(target);
      if (bucket) bucket.add(binding.id);
      else refs.set(target, new Set([binding.id]));
    }
  }
  return refs;
}

/**
 * Compare a current pair's enforcement with its prepared/next version and report
 * targets whose former referencing binding no longer references them. A target
 * is a candidate when at least one current binding that referenced it stops
 * doing so (binding removed, or target dropped from a surviving binding); it is
 * still-shared when any next binding continues to reference it.
 */
export function compareRetiredTargets(
  current: ParsedEnforcement,
  next: ParsedEnforcement
): RetiredTargetCandidate[] {
  const currentRefs = targetReferences(current);
  const nextRefs = targetReferences(next);

  const candidates: RetiredTargetCandidate[] = [];
  for (const [target, currentBindings] of currentRefs) {
    const nextBindings = nextRefs.get(target) ?? new Set<string>();
    // Binding IDs that referenced this target in the current pair but not in
    // the next pair — the "no longer referenced by that binding" set.
    const dropped = [...currentBindings].filter((id) => !nextBindings.has(id));
    if (dropped.length === 0) continue;

    candidates.push({
      path: target,
      fromBindingIds: dropped.sort((a, b) => a.localeCompare(b)),
      stillReferenced: nextBindings.size > 0,
      survivingBindingIds: [...nextBindings].sort((a, b) => a.localeCompare(b)),
    });
  }

  candidates.sort((a, b) => a.path.localeCompare(b.path));
  return candidates;
}

/**
 * A stable machine code explaining why a pair is not ready for governed
 * verification/archive. Ordering in `blockers` is deterministic.
 */
export type ReadinessBlocker =
  | 'incomplete-pair'
  | 'identity-mismatch'
  | 'spec-issues'
  | 'enforcement-issues'
  | 'hanging-requirements'
  | 'uncovered-scenarios'
  | 'stale-bindings'
  | 'broken-targets'
  | 'escaping-targets'
  | 'planned-bindings'
  | 'unenforced-bindings'
  | 'incomplete-bindings';

export interface PairAnalysisInput {
  record: GovernedPairRecord;
  spec: ParsedGovernedSpec;
  enforcement: ParsedEnforcement;
  /** Absolute project root that active binding targets must stay inside. */
  projectRoot: string;
  targetOptions?: TargetValidationOptions;
  enforcementTypes?: readonly EnforcementType[];
  lensIds?: readonly string[];
}

export interface PairAnalysis {
  record: GovernedPairRecord;
  /** The stable spec ID from the parsed spec, or null. */
  specId: string | null;
  /** Present when `enforcement.spec` disagrees with the spec's own `id`. */
  identityMismatch: {
    specId: string | null;
    enforcementSpecId: string | null;
  } | null;
  /** True when a member of the pair is missing on disk. */
  incompletePair: boolean;
  coverage: CoverageReport;
  targets: TargetValidationResult;
  /** True only when nothing blocks governed verification/archive readiness. */
  ready: boolean;
  /** Deterministically ordered readiness blockers. */
  blockers: ReadinessBlocker[];
}

const BLOCKER_ORDER: ReadinessBlocker[] = [
  'incomplete-pair',
  'identity-mismatch',
  'spec-issues',
  'enforcement-issues',
  'hanging-requirements',
  'uncovered-scenarios',
  'stale-bindings',
  'broken-targets',
  'escaping-targets',
  'planned-bindings',
  'unenforced-bindings',
  'incomplete-bindings',
];

/**
 * Analyze one governed pair end-to-end: validate targets against the project
 * root, compute coverage with the resulting broken targets, and derive the
 * readiness verdict. Planned, unenforced, unresolved, stale, hanging, and
 * missing-target findings all block readiness while remaining allowed during
 * authoring (design decision 5).
 */
export async function analyzePairDrift(
  input: PairAnalysisInput
): Promise<PairAnalysis> {
  const { record, spec, enforcement } = input;

  const targets = await validateTargets(
    enforcement.bindings,
    input.projectRoot,
    {
      ...input.targetOptions,
      enforcementTypes: input.enforcementTypes,
      lensIds: input.lensIds,
      compactBindings: enforcement.format === 'yaml',
    }
  );

  const coverage = computeCoverage({
    spec,
    enforcement,
    missingTargetsByBinding: targets.missingTargetsByBinding,
    escapingBindingIds: targets.escapingBindingIds,
    enforcementTypes: input.enforcementTypes,
  });

  const incompletePair = record.completeness !== 'complete';

  // Identity: the enforcement's declared spec must match the spec's own id.
  // Only meaningful when both files are present and the spec has a parsed id.
  const identityMismatch =
    !incompletePair &&
    spec.id !== null &&
    enforcement.spec !== null &&
    enforcement.spec !== spec.id
      ? { specId: spec.id, enforcementSpecId: enforcement.spec }
      : null;

  const blockerSet = new Set<ReadinessBlocker>();
  if (incompletePair) blockerSet.add('incomplete-pair');
  if (identityMismatch) blockerSet.add('identity-mismatch');
  if (spec.issues.length > 0) blockerSet.add('spec-issues');
  if (enforcement.issues.length > 0) blockerSet.add('enforcement-issues');
  if (coverage.hangingRequirementIds.length > 0)
    blockerSet.add('hanging-requirements');
  if (coverage.uncoveredScenarioIds.length > 0)
    blockerSet.add('uncovered-scenarios');
  if (coverage.staleBindingIds.length > 0) blockerSet.add('stale-bindings');
  if (coverage.brokenBindingIds.length > 0) blockerSet.add('broken-targets');
  if (targets.escapingBindingIds.size > 0) blockerSet.add('escaping-targets');
  if (coverage.plannedBindingIds.length > 0) blockerSet.add('planned-bindings');
  if (coverage.unenforcedBindingIds.length > 0)
    blockerSet.add('unenforced-bindings');
  if (coverage.incompleteBindingIds.length > 0)
    blockerSet.add('incomplete-bindings');

  const blockers = BLOCKER_ORDER.filter((code) => blockerSet.has(code));

  return {
    record,
    specId: spec.id,
    identityMismatch,
    incompletePair,
    coverage,
    targets,
    ready: blockers.length === 0,
    blockers,
  };
}
