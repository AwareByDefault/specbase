/**
 * Governed-aware resolution and rendering for the top-level `show` command
 * (design decision 9, cli-show spec).
 *
 * The legacy flat show path never reaches this module: `show` only enters the
 * governed branch when the project's resolved spec model is `governed`, so
 * legacy spec/change output stays byte-for-byte unchanged. Under the governed
 * model this resolves a spec by plane-qualified nested locator OR stable spec ID
 * (reusing the Unit 1 `resolvePair`, plus an unqualified-basename convenience
 * that reports candidates when ambiguous), and shapes the paired enforcement +
 * coverage view the spec requires for both text (raw-first) and `--json` output.
 *
 * It consumes the Unit 1-2 governed repository/drift APIs and never re-parses the
 * governed file format itself.
 */
import { resolvePair } from '../governed/index.js';
import type {
  GovernedRepository,
  ParsedGovernedSpec,
  PairAnalysis,
} from '../governed/index.js';
import type {
  Binding,
  GovernedPairRecord,
  GovernedRequirement,
  PairCompleteness,
} from '../schemas/governed-spec.schema.js';
import type { SpecPlane } from './types.js';

/** Concise coverage/pair state, mirroring the cli-list ordering. */
export type GovernedCoverageState =
  | 'complete'
  | 'planned'
  | 'hanging'
  | 'stale'
  | 'broken'
  | 'incomplete-pair';

/** How a target string resolved to a governed pair. */
export type GovernedResolutionVia = 'locator' | 'spec-id' | 'basename';

/**
 * The outcome of resolving a show target against the governed repository:
 * a concrete pair, an ambiguous unqualified basename (multiple locators share
 * the final segment), or nothing found.
 */
export type GovernedShowResolution =
  | { kind: 'resolved'; via: GovernedResolutionVia; record: GovernedPairRecord }
  | { kind: 'ambiguous-basename'; basename: string; candidates: string[] }
  | { kind: 'not-found' };

/** The final path segment of a plane-qualified locator (its basename). */
function locatorBasename(locator: string): string {
  const segments = locator.split('/');
  return segments[segments.length - 1] ?? locator;
}

/**
 * Resolve a show target to a governed pair. First tries the Unit 1 resolver
 * (plane-qualified locator when the target has a `/`, otherwise stable spec ID),
 * which also resolves a moved spec by ID. When that yields nothing and the
 * target is an unqualified basename (no `/`), fall back to matching the final
 * locator segment: a unique match resolves, multiple matches are reported as
 * ambiguous so the user can qualify with a plane or stable spec ID.
 */
export function resolveGovernedShowTarget(
  repository: GovernedRepository,
  target: string
): GovernedShowResolution {
  const trimmed = target.trim();
  const direct = resolvePair(repository, trimmed);
  if (direct.found) {
    return { kind: 'resolved', via: direct.via, record: direct.pair };
  }

  // Basename fallback only applies to unqualified single-segment targets.
  if (!trimmed.includes('/')) {
    const matches = repository.discovery.pairs.filter(
      (pair) => locatorBasename(pair.locator) === trimmed
    );
    if (matches.length === 1) {
      return { kind: 'resolved', via: 'basename', record: matches[0] };
    }
    if (matches.length > 1) {
      return {
        kind: 'ambiguous-basename',
        basename: trimmed,
        candidates: matches.map((m) => m.locator).sort((a, b) => a.localeCompare(b)),
      };
    }
  }

  return { kind: 'not-found' };
}

/** One binding merged with its computed drift state for structured output. */
export interface GovernedBindingView {
  id: string;
  covers: string[];
  mechanism: Binding['mechanism'];
  strength: Binding['strength'];
  status: Binding['status'];
  targets: string[];
  /** Drift state from the coverage engine (`active`, `stale`, `broken`, ...). */
  state: string;
  /** True when this binding currently counts as coverage for its IDs. */
  complete: boolean;
}

export interface GovernedCoverageView {
  state: GovernedCoverageState;
  ready: boolean;
  covered: number;
  hanging: number;
  stale: number;
  broken: number;
  planned: number;
  hangingRequirementIds: string[];
  uncoveredScenarioIds: string[];
  staleBindingIds: string[];
  brokenBindingIds: string[];
  plannedBindingIds: string[];
}

/** The JSON-serializable governed spec view (root is attached by the caller). */
export interface GovernedSpecView {
  type: 'spec';
  locator: string;
  specId: string | null;
  plane: SpecPlane;
  pairStatus: PairCompleteness;
  incompletePair: boolean;
  /** The absent half of an incomplete pair, or null when complete. */
  missingPairMember: 'spec' | 'enforcement' | null;
  specPath: string | null;
  enforcementPath: string | null;
  dir: string;
  requirementCount: number;
  requirements: Array<{
    id: string;
    title: string;
    scenarios: Array<{ id: string; title: string }>;
  }>;
  bindings: GovernedBindingView[];
  coverage: GovernedCoverageView;
}

/**
 * Derive the concise coverage/pair state and drift counts from a pair analysis,
 * using the same distinguishing order as cli-list: an incomplete pair outranks
 * every coverage finding, then broken > stale > hanging > planned, else complete.
 */
function summarizeCoverage(
  completeness: PairCompleteness,
  analysis: PairAnalysis
): GovernedCoverageView {
  const { coverage } = analysis;
  const covered = coverage.requirements.filter((r) => r.state === 'covered').length;
  const hanging = coverage.hangingRequirementIds.length;
  const stale = coverage.staleBindingIds.length;
  const broken = coverage.brokenBindingIds.length;
  const planned = coverage.plannedBindingIds.length;

  let state: GovernedCoverageState;
  if (completeness !== 'complete') state = 'incomplete-pair';
  else if (broken > 0) state = 'broken';
  else if (stale > 0) state = 'stale';
  else if (hanging > 0) state = 'hanging';
  else if (planned > 0) state = 'planned';
  else state = 'complete';

  return {
    state,
    ready: analysis.ready,
    covered,
    hanging,
    stale,
    broken,
    planned,
    hangingRequirementIds: coverage.hangingRequirementIds,
    uncoveredScenarioIds: coverage.uncoveredScenarioIds,
    staleBindingIds: coverage.staleBindingIds,
    brokenBindingIds: coverage.brokenBindingIds,
    plannedBindingIds: coverage.plannedBindingIds,
  };
}

function mapRequirements(requirements: GovernedRequirement[]) {
  return requirements.map((req) => ({
    id: req.id,
    title: req.title,
    scenarios: req.scenarios.map((s) => ({ id: s.id, title: s.title })),
  }));
}

/** The half of an incomplete pair that is absent on disk, or null. */
function missingPairMember(
  completeness: PairCompleteness
): 'spec' | 'enforcement' | null {
  if (completeness === 'spec-only') return 'enforcement';
  if (completeness === 'enforcement-only') return 'spec';
  return null;
}

/**
 * Build the structured governed spec view from a resolved pair, its parsed spec,
 * parsed enforcement, and drift analysis. Bindings merge their declared fields
 * with the coverage engine's computed drift state.
 */
export function buildGovernedSpecView(input: {
  record: GovernedPairRecord;
  spec: ParsedGovernedSpec;
  bindings: Binding[];
  analysis: PairAnalysis;
}): GovernedSpecView {
  const { record, spec, bindings, analysis } = input;

  const driftById = new Map(analysis.coverage.bindings.map((b) => [b.id, b]));
  const bindingViews: GovernedBindingView[] = bindings.map((binding) => {
    const drift = driftById.get(binding.id);
    return {
      id: binding.id,
      covers: binding.covers,
      mechanism: binding.mechanism,
      strength: binding.strength,
      status: binding.status,
      targets: binding.targets,
      state: drift?.state ?? 'active',
      complete: drift?.complete ?? false,
    };
  });

  return {
    type: 'spec',
    locator: record.locator,
    specId: spec.id,
    plane: record.plane,
    pairStatus: record.completeness,
    incompletePair: record.completeness !== 'complete',
    missingPairMember: missingPairMember(record.completeness),
    specPath: record.specPath,
    enforcementPath: record.enforcementPath,
    dir: record.dir,
    requirementCount: spec.requirements.length,
    requirements: mapRequirements(spec.requirements),
    bindings: bindingViews,
    coverage: summarizeCoverage(record.completeness, analysis),
  };
}

/**
 * Render the governed spec's paired enforcement + coverage summary as text. In
 * text mode the raw `spec.md` is printed first (raw-first display) by the
 * caller; this returns the trailing pair/enforcement/coverage block.
 */
export function renderGovernedSpecSummary(view: GovernedSpecView): string {
  const lines: string[] = [];
  lines.push('Governed spec');
  lines.push(`  locator:     ${view.locator}`);
  lines.push(`  spec id:     ${view.specId ?? '(none)'}`);
  lines.push(`  plane:       ${view.plane}`);
  lines.push(`  spec:        ${view.specPath ?? '(missing)'}`);
  lines.push(`  enforcement: ${view.enforcementPath ?? '(missing)'}`);
  lines.push(`  pair:        ${view.pairStatus}`);
  if (view.missingPairMember) {
    const missingFile =
      view.missingPairMember === 'enforcement' ? 'enforcement.md' : 'spec.md';
    lines.push(`  Missing ${missingFile} for this pair.`);
  }

  lines.push('');
  if (view.bindings.length === 0) {
    lines.push('Enforcement: no bindings');
  } else {
    lines.push(`Enforcement: ${view.bindings.length} binding(s)`);
    for (const binding of view.bindings) {
      const covers = binding.covers.length > 0 ? binding.covers.join(', ') : '(nothing)';
      const targets =
        binding.targets.length > 0 ? `  targets ${binding.targets.join(', ')}` : '';
      lines.push(
        `  - ${binding.id} [${binding.mechanism}/${binding.strength}/${binding.status}` +
          ` -> ${binding.state}]  covers ${covers}${targets}`
      );
    }
  }

  lines.push('');
  const c = view.coverage;
  const detail: string[] = [`covered ${c.covered}`];
  if (c.broken > 0) detail.push(`broken ${c.broken}`);
  if (c.stale > 0) detail.push(`stale ${c.stale}`);
  if (c.hanging > 0) detail.push(`hanging ${c.hanging}`);
  if (c.planned > 0) detail.push(`planned ${c.planned}`);
  lines.push(`Coverage: ${c.state} (${detail.join(', ')})`);

  return lines.join('\n');
}
