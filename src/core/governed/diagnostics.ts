import type { SpecPlane } from '../artifact-graph/types.js';
import type { PairAnalysis } from './drift.js';
import type { RetiredTargetCandidate } from './drift.js';

/**
 * Deterministic diagnostics (task 3.5). Turns a pair analysis into stable,
 * sorted diagnostic objects that carry the stable spec ID, normative ID, binding
 * ID, native source path, and target details. Later CLI/JSON units render these;
 * this module owns the stable ordering and machine codes so those renderings
 * stay reproducible.
 */

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export type DiagnosticCode =
  // parse / structure
  | 'spec/parse-issue'
  | 'enforcement/parse-issue'
  | 'pair/incomplete'
  | 'pair/identity-mismatch'
  // scoped stable identity (project-wide spec IDs; pair-local requirement/scenario IDs)
  | 'identity/duplicate-spec-id'
  | 'identity/duplicate-requirement-id'
  | 'identity/duplicate-scenario-id'
  // coverage / drift
  | 'coverage/hanging-requirement'
  | 'coverage/uncovered-scenario'
  | 'binding/stale'
  | 'binding/broken-target'
  | 'binding/planned'
  | 'binding/unenforced'
  | 'binding/incomplete'
  // targets
  | 'target/escapes-root'
  | 'target/missing'
  // cleanup
  | 'cleanup/retired-target';

export interface Diagnostic {
  code: DiagnosticCode;
  severity: DiagnosticSeverity;
  /** Stable spec ID of the pair, or null when unparsed. */
  specId: string | null;
  /** Plane-qualified normalized locator of the pair. */
  locator: string;
  plane: SpecPlane;
  message: string;
  /** Pair-local normative ID (requirement/scenario), when scoped to one. */
  normativeId?: string;
  /** Pair-local binding ID, when scoped to one. */
  bindingId?: string;
  /** Native source path (spec.md or enforcement.md) the finding points at. */
  sourcePath?: string;
  /** Declared target path/selector, when the finding is about one. */
  targetPath?: string;
}

export interface DiagnosticsOptions {
  /**
   * Retired-target cleanup candidates from a sync comparison. Reported as info
   * (still-shared) or warning (fully retired) diagnostics when supplied.
   */
  retiredTargets?: RetiredTargetCandidate[];
}

function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  return (
    a.code.localeCompare(b.code) ||
    (a.normativeId ?? '').localeCompare(b.normativeId ?? '') ||
    (a.bindingId ?? '').localeCompare(b.bindingId ?? '') ||
    (a.targetPath ?? '').localeCompare(b.targetPath ?? '') ||
    a.message.localeCompare(b.message)
  );
}

/**
 * Produce the deterministic, sorted diagnostic list for one analyzed pair.
 * Ordering depends only on the diagnostic content, never on discovery or map
 * iteration order, so two runs over the same inputs emit identical output.
 */
export function collectDiagnostics(
  analysis: PairAnalysis,
  options: DiagnosticsOptions = {}
): Diagnostic[] {
  const { record, coverage, targets } = analysis;
  const specId = analysis.specId;
  const base = {
    specId,
    locator: record.locator,
    plane: record.plane,
  };
  const specPath = record.specPath ?? undefined;
  const enforcementPath = record.enforcementPath ?? undefined;

  const out: Diagnostic[] = [];

  // Structure / identity.
  if (analysis.incompletePair) {
    out.push({
      ...base,
      code: 'pair/incomplete',
      severity: 'error',
      sourcePath: specPath ?? enforcementPath,
      message: `Governed pair '${record.locator}' is ${record.completeness}; both spec.md and enforcement.yaml are required (a lone legacy enforcement.md remains readable during migration).`,
    });
  }
  if (analysis.identityMismatch) {
    out.push({
      ...base,
      code: 'pair/identity-mismatch',
      severity: 'error',
      sourcePath: enforcementPath,
      message: `enforcement.md references spec '${analysis.identityMismatch.enforcementSpecId}' but the paired spec.md declares '${analysis.identityMismatch.specId}'.`,
    });
  }

  // Coverage / drift.
  for (const id of coverage.hangingRequirementIds) {
    out.push({
      ...base,
      code: 'coverage/hanging-requirement',
      severity: 'error',
      normativeId: id,
      sourcePath: specPath,
      message: `Requirement '${id}' has no complete binding (hanging claim).`,
    });
  }
  for (const id of coverage.uncoveredScenarioIds) {
    out.push({
      ...base,
      code: 'coverage/uncovered-scenario',
      severity: 'error',
      normativeId: id,
      sourcePath: specPath,
      message: `Scenario '${id}' is neither directly covered nor included by a requirement-level binding.`,
    });
  }

  for (const binding of coverage.bindings) {
    for (const staleId of binding.staleCoveredIds) {
      out.push({
        ...base,
        code: 'binding/stale',
        severity: 'error',
        bindingId: binding.id,
        normativeId: staleId,
        sourcePath: enforcementPath,
        message: `Binding '${binding.id}' covers '${staleId}', which no longer exists in the spec (stale enforcement).`,
      });
    }
    for (const target of binding.missingTargets) {
      out.push({
        ...base,
        code: 'binding/broken-target',
        severity: 'error',
        bindingId: binding.id,
        targetPath: target,
        sourcePath: enforcementPath,
        message: `Binding '${binding.id}' has missing source '${target}' (broken enforcement); covered IDs: ${binding.covers.join(', ') || 'none'}.`,
      });
    }
    if (binding.state === 'planned') {
      out.push({
        ...base,
        code: 'binding/planned',
        severity: 'warning',
        bindingId: binding.id,
        sourcePath: enforcementPath,
        message: `Binding '${binding.id}' is still planned; it does not yet enforce its covered IDs.`,
      });
    }
    if (binding.strength === 'unenforced') {
      out.push({
        ...base,
        code: 'binding/unenforced',
        severity: 'warning',
        bindingId: binding.id,
        sourcePath: enforcementPath,
        message: `Binding '${binding.id}' is classified unenforced; it provides no enforcement evidence.`,
      });
    }
    if (binding.state === 'incomplete') {
      out.push({
        ...base,
        code: 'binding/incomplete',
        severity: 'error',
        bindingId: binding.id,
        sourcePath: enforcementPath,
        message: `Binding '${binding.id}' does not declare the source its '${binding.strength}' strength requires.`,
      });
    }
  }

  // Target structural problems.
  for (const problem of targets.problems) {
    out.push({
      ...base,
      code: problem.kind === 'escapes-root' ? 'target/escapes-root' : 'target/missing',
      severity: 'error',
      bindingId: problem.bindingId,
      targetPath: problem.path,
      sourcePath: enforcementPath,
      message: problem.message,
    });
  }

  // Retired-target cleanup candidates (from a sync comparison).
  for (const candidate of options.retiredTargets ?? []) {
    out.push({
      ...base,
      code: 'cleanup/retired-target',
      severity: candidate.stillReferenced ? 'info' : 'warning',
      targetPath: candidate.path,
      sourcePath: enforcementPath,
      message: candidate.stillReferenced
        ? `Target '${candidate.path}' is no longer referenced by ${candidate.fromBindingIds.join(', ')} but remains shared by ${candidate.survivingBindingIds.join(', ')}; not a safe automatic cleanup.`
        : `Target '${candidate.path}', formerly referenced by ${candidate.fromBindingIds.join(', ')}, is now a retired cleanup candidate (no surviving binding references it).`,
    });
  }

  out.sort(compareDiagnostics);
  return out;
}

/**
 * Render diagnostics as deterministic, human-readable text lines. Pure function
 * of the diagnostics, so the output is stable for a given analysis.
 */
export function renderDiagnostics(diagnostics: Diagnostic[]): string {
  return diagnostics
    .map((d) => {
      const scope = [
        d.locator,
        d.normativeId ? `#${d.normativeId}` : null,
        d.bindingId ? `@${d.bindingId}` : null,
        d.targetPath ? `→${d.targetPath}` : null,
      ]
        .filter(Boolean)
        .join(' ');
      return `${d.severity.toUpperCase()} [${d.code}] ${scope}: ${d.message}`;
    })
    .join('\n');
}
