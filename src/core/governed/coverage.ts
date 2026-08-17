import type {
  Binding,
  BindingStatus,
  BindingStrength,
} from '../schemas/governed-spec.schema.js';
import { DEFAULT_ENFORCEMENT_TYPES, type EnforcementType } from '../artifact-graph/types.js';
import type { ParsedGovernedSpec } from './spec-parser.js';
import type { ParsedEnforcement } from './enforcement-parser.js';

/**
 * Enforcement coverage and single-pair drift (design decision 5, tasks 3.1-3.2).
 *
 * From one governed pair — a parsed `spec.md` and a parsed `enforcement.md` —
 * this computes, per normative ID and per binding, the drift states:
 *
 *   normative id exists + complete binding + target present → covered
 *   normative id exists + no complete binding               → hanging claim
 *   normative id missing + binding still covers it          → stale binding
 *   active binding + declared target missing                → broken enforcement
 *   binding planned / unenforced                            → not yet enforcing
 *
 * Coverage is requirement-level, not per-scenario: every requirement (a
 * normative claim in a governed spec) needs at least one complete binding, and
 * each scenario is covered either directly by a binding or by a requirement-level
 * binding that covers its owning requirement. It never requires one binding per
 * scenario.
 *
 * The engine is pure. Target existence is supplied by the caller
 * (`missingTargetsByBinding`, produced by target validation), so coverage can be
 * unit-tested without a filesystem.
 */

export type CoverageState = 'covered' | 'hanging' | 'uncovered';

export interface NormativeCoverage {
  kind: 'requirement' | 'scenario';
  /** The pair-local normative slug. */
  id: string;
  /** Owning requirement slug (equal to `id` for requirements). */
  requirementId: string;
  state: CoverageState;
  /** IDs of complete bindings that cover this normative node, sorted. */
  coveredBy: string[];
}

/**
 * A binding's primary drift state. When more than one condition holds, the most
 * actionable is chosen by the priority: stale > broken > incomplete > unenforced
 * > planned > active. The detail arrays (`staleCoveredIds`, `missingTargets`)
 * always carry every finding regardless of the chosen primary state.
 */
export type BindingDriftState =
  | 'active'
  | 'planned'
  | 'unenforced'
  | 'stale'
  | 'broken'
  | 'incomplete';

export interface BindingDrift {
  id: string;
  mechanism: string;
  type: string;
  source: string;
  strength: BindingStrength;
  status: BindingStatus;
  covers: string[];
  state: BindingDriftState;
  /** True when this binding currently counts as coverage for its IDs. */
  complete: boolean;
  /** Covered IDs no longer present in the paired spec (stale enforcement). */
  staleCoveredIds: string[];
  /** Declared active target paths reported missing on disk (broken enforcement). */
  missingTargets: string[];
}

export interface CoverageInput {
  spec: ParsedGovernedSpec;
  enforcement: ParsedEnforcement;
  /**
   * Per-binding list of declared target paths reported missing on disk. Absent
   * or empty means every declared target is assumed present (pure coverage).
   */
  missingTargetsByBinding?: ReadonlyMap<string, readonly string[]>;
  /**
   * Binding IDs whose target or working directory resolves outside the project
   * root. An escaping binding is rejected, so — like a broken one — it never
   * counts as complete coverage for its IDs. Absent means none escape.
   */
  escapingBindingIds?: ReadonlySet<string>;
  /** Resolved project roster. Omission uses shipped defaults plus legacy fields. */
  enforcementTypes?: readonly EnforcementType[];
}

export interface CoverageReport {
  requirements: NormativeCoverage[];
  scenarios: NormativeCoverage[];
  bindings: BindingDrift[];
  /** Requirement IDs with no complete binding (hanging claims), sorted. */
  hangingRequirementIds: string[];
  /** Scenario IDs neither directly nor requirement-level covered, sorted. */
  uncoveredScenarioIds: string[];
  /** Binding IDs covering an ID absent from the spec, sorted. */
  staleBindingIds: string[];
  /** Active binding IDs with a missing declared target, sorted. */
  brokenBindingIds: string[];
  /** Binding IDs still in `planned` status, sorted. */
  plannedBindingIds: string[];
  /** Binding IDs classified `unenforced`, sorted. */
  unenforcedBindingIds: string[];
  /** Active binding IDs missing their required evidence declaration, sorted. */
  incompleteBindingIds: string[];
}

/**
 * Whether a binding declares the evidence its strength requires. Automated
 * bindings need an executable and at least one target; review bindings need a
 * procedure; manual bindings need a procedure and rationale. Unenforced bindings
 * never satisfy this.
 */
function hasRequiredEvidence(binding: Binding, compact: boolean): boolean {
  if (compact) return Boolean(binding.source);
  switch (binding.strength) {
    case 'automated':
      return Boolean(binding.run && binding.run.command) && binding.targets.length > 0;
    case 'review':
      return Boolean(binding.review && binding.review.procedure);
    case 'manual':
      return Boolean(binding.procedure && binding.rationale);
    case 'unenforced':
      return false;
  }
}

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/**
 * Compute coverage and per-binding drift for one governed pair. Never throws;
 * an empty/incomplete pair yields hanging claims rather than an error, which the
 * pair-level readiness verdict then blocks.
 */
export function computeCoverage(input: CoverageInput): CoverageReport {
  const { spec, enforcement } = input;
  const missingByBinding = input.missingTargetsByBinding ?? new Map();
  const escapingBindingIds = input.escapingBindingIds ?? new Set<string>();
  const compact = enforcement.format === 'yaml';
  const typeRoster = input.enforcementTypes ?? DEFAULT_ENFORCEMENT_TYPES;
  const typesById = new Map(typeRoster.map((type) => [type.id, type]));

  // Normative identity present in the current spec.
  const requirementIds = new Set<string>();
  const scenarioOwner = new Map<string, string>(); // scenario id → requirement id
  for (const requirement of spec.requirements) {
    if (requirement.id) requirementIds.add(requirement.id);
    for (const scenario of requirement.scenarios) {
      if (scenario.id && requirement.id) {
        scenarioOwner.set(scenario.id, requirement.id);
      }
    }
  }
  // Bindings are intentionally requirement-level. Scenario IDs never form a
  // binding boundary; scenarios inherit only from their owning requirement.
  const normativeIds = requirementIds;

  // Per-binding drift, and the map of which complete bindings cover each ID.
  const bindings: BindingDrift[] = [];
  const completeCoverers = new Map<string, Set<string>>(); // normative id → binding ids

  for (const binding of enforcement.bindings) {
    const missingTargets = [...(missingByBinding.get(binding.id) ?? [])].sort(
      (a, b) => a.localeCompare(b)
    );
    const staleCoveredIds = sortedUnique(
      binding.covers.filter((id) => !normativeIds.has(id))
    );
    const typeId = binding.type ?? binding.mechanism;
    const resolvedType = compact ? typesById.get(typeId) : undefined;
    const strength = compact ? resolvedType?.strength ?? 'unenforced' : binding.strength;
    const planned = binding.status === 'planned';
    const unenforced = strength === 'unenforced';
    const escaping = escapingBindingIds.has(binding.id);
    const broken =
      binding.status === 'active' && (missingTargets.length > 0 || escaping);
    const declaredEvidence = hasRequiredEvidence(binding, compact);
    // Incomplete: active + enforced, but the required evidence is not declared.
    const incomplete =
      binding.status === 'active' && (compact && !resolvedType || !unenforced && !declaredEvidence);

    const complete =
      binding.status === 'active' &&
      !unenforced &&
      declaredEvidence &&
      !broken;

    if (complete) {
      for (const id of binding.covers) {
        if (!normativeIds.has(id)) continue;
        const bucket = completeCoverers.get(id);
        if (bucket) bucket.add(binding.id);
        else completeCoverers.set(id, new Set([binding.id]));
      }
    }

    let state: BindingDriftState = 'active';
    if (staleCoveredIds.length > 0) state = 'stale';
    else if (broken) state = 'broken';
    else if (incomplete) state = 'incomplete';
    else if (unenforced) state = 'unenforced';
    else if (planned) state = 'planned';

    bindings.push({
      id: binding.id,
      mechanism: typeId,
      type: typeId,
      source: binding.source ?? binding.targets[0] ?? '',
      strength,
      status: binding.status,
      covers: [...binding.covers],
      state,
      complete,
      staleCoveredIds,
      missingTargets,
    });
  }

  const coveredBy = (id: string): string[] =>
    [...(completeCoverers.get(id) ?? [])].sort((a, b) => a.localeCompare(b));

  // Requirement-level coverage: a requirement is covered by any complete binding
  // whose `covers` names the requirement ID.
  const requirements: NormativeCoverage[] = spec.requirements
    .filter((r) => r.id)
    .map((requirement) => {
      const by = coveredBy(requirement.id);
      return {
        kind: 'requirement' as const,
        id: requirement.id,
        requirementId: requirement.id,
        state: by.length > 0 ? ('covered' as const) : ('hanging' as const),
        coveredBy: by,
      };
    });

  // Scenario coverage derives only from its owning requirement.
  const scenarios: NormativeCoverage[] = [];
  for (const requirement of spec.requirements) {
    if (!requirement.id) continue;
    const requirementCovered = completeCoverers.has(requirement.id);
    for (const scenario of requirement.scenarios) {
      if (!scenario.id) continue;
      const by = requirementCovered ? coveredBy(requirement.id) : [];
      scenarios.push({
        kind: 'scenario',
        id: scenario.id,
        requirementId: requirement.id,
        state: by.length > 0 ? 'covered' : 'uncovered',
        coveredBy: by,
      });
    }
  }

  return {
    requirements,
    scenarios,
    bindings,
    hangingRequirementIds: sortedUnique(
      requirements.filter((r) => r.state === 'hanging').map((r) => r.id)
    ),
    uncoveredScenarioIds: sortedUnique(
      scenarios.filter((s) => s.state === 'uncovered').map((s) => s.id)
    ),
    staleBindingIds: sortedUnique(
      bindings.filter((b) => b.staleCoveredIds.length > 0).map((b) => b.id)
    ),
    brokenBindingIds: sortedUnique(
      bindings.filter((b) => b.missingTargets.length > 0 && b.status === 'active').map((b) => b.id)
    ),
    plannedBindingIds: sortedUnique(
      bindings.filter((b) => b.status === 'planned').map((b) => b.id)
    ),
    unenforcedBindingIds: sortedUnique(
      bindings.filter((b) => b.strength === 'unenforced').map((b) => b.id)
    ),
    incompleteBindingIds: sortedUnique(
      bindings.filter((b) => b.state === 'incomplete').map((b) => b.id)
    ),
  };
}
