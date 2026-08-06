/**
 * Governed validation engine shared by the `spec validate` noun command and the
 * standalone top-level `validate` command (design decisions 3, 5, 6; cli-validate
 * spec). It composes the Unit 1-2 primitives into one deterministic report so
 * both surfaces stay semantically identical:
 *
 *   - per-pair drift via {@link analyzeGovernedPair} + {@link collectDiagnostics}
 *     (incomplete pair, identity mismatch, hanging claims, uncovered scenarios,
 *     stale/broken/planned bindings, escaping/missing targets), plus
 *   - the classes the single-pair drift engine cannot see: spec/enforcement parse
 *     issues, pair-local duplicate requirement/scenario IDs, project-wide
 *     duplicate spec IDs (with every conflicting location), and repo-level unsafe
 *     locators.
 *
 * The legacy flat validator is untouched; callers only reach this under the
 * governed spec model.
 */
import {
  collectDiagnostics,
  type Diagnostic,
  type GovernedRepository,
  type ParsedEnforcement,
  type ParsedGovernedSpec,
  type UnsafeLocator,
} from '../governed/index.js';
import type { GovernedPairRecord } from '../schemas/governed-spec.schema.js';
import type { SpecPlane } from './types.js';
import { analyzeGovernedPair } from './governed-show.js';

/** A repo-level validation issue (e.g. an unknown plane root). */
export interface GovernedValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  sourcePath: string;
}

/** One governed pair's validation verdict with its deterministic diagnostics. */
export interface GovernedPairValidation {
  locator: string;
  specId: string | null;
  plane: SpecPlane;
  valid: boolean;
  diagnostics: Diagnostic[];
}

/** The full governed validation report over one or more pairs. */
export interface GovernedValidationReport {
  valid: boolean;
  specs: GovernedPairValidation[];
  /**
   * Directories rejected for unsafe locators (absolute, empty/dot segment,
   * parent traversal, hidden control dir). Repo-level, never a pair; any entry
   * makes the report invalid. Only populated for whole-repository validation.
   */
  unsafeLocators: UnsafeLocator[];
  /** Pairs discovered under a plane id not in the resolved set (unknown planes). */
  unknownPlanes?: GovernedValidationIssue[];
}

/** Deterministic diagnostic ordering, matching the Unit 2 collector's keys. */
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
 * The governed diagnostic classes the single-pair drift engine does not compute:
 * spec/enforcement parse issues, pair-local duplicate requirement/scenario IDs
 * (from the repository index), and the project-wide duplicate-spec-ID conflict
 * this pair participates in (with every conflicting source location).
 */
function extraDiagnostics(input: {
  repository: GovernedRepository;
  record: GovernedPairRecord;
  spec: ParsedGovernedSpec;
  enforcement: ParsedEnforcement;
}): Diagnostic[] {
  const { repository, record, spec, enforcement } = input;
  const base = { specId: spec.id, locator: record.locator, plane: record.plane };
  const specPath = record.specPath ?? undefined;
  const enforcementPath = record.enforcementPath ?? undefined;
  const out: Diagnostic[] = [];

  for (const issue of spec.issues) {
    const where = issue.line ? ` (line ${issue.line})` : '';
    out.push({
      ...base,
      code: 'spec/parse-issue',
      severity: 'error',
      sourcePath: specPath,
      message: `spec.md ${issue.code}: ${issue.message}${where}`,
    });
  }

  for (const issue of enforcement.issues) {
    out.push({
      ...base,
      code: 'enforcement/parse-issue',
      severity: 'error',
      ...(issue.bindingId ? { bindingId: issue.bindingId } : {}),
      sourcePath: enforcementPath,
      message: `enforcement.md ${issue.code}: ${issue.message}`,
    });
  }

  for (const dup of repository.duplicateLocalIds.get(record.locator) ?? []) {
    out.push({
      ...base,
      code:
        dup.scope === 'requirement'
          ? 'identity/duplicate-requirement-id'
          : 'identity/duplicate-scenario-id',
      severity: 'error',
      normativeId: dup.id,
      sourcePath: specPath,
      message: `Duplicate ${dup.scope} ID '${dup.id}' declared by: ${dup.titles.join(', ')}.`,
    });
  }

  if (spec.id !== null) {
    const conflict = repository.index.conflicts.find((c) => c.id === spec.id);
    if (conflict) {
      out.push({
        ...base,
        code: 'identity/duplicate-spec-id',
        severity: 'error',
        sourcePath: specPath,
        message: `Spec ID '${conflict.id}' is claimed by multiple pairs: ${conflict.locations.join(', ')}.`,
      });
    }
  }

  return out;
}

/**
 * Validate one governed pair: the Unit 2 drift diagnostics plus the parse /
 * scoped-identity classes above, merged into one deterministically ordered list.
 * A pair is valid when it emits no error-severity diagnostic.
 */
export async function validateGovernedPair(input: {
  repository: GovernedRepository;
  record: GovernedPairRecord;
  projectRoot: string;
}): Promise<GovernedPairValidation> {
  const { repository, record, projectRoot } = input;
  const { spec, enforcement, analysis } = await analyzeGovernedPair({
    repository,
    record,
    projectRoot,
  });

  const diagnostics = [
    ...collectDiagnostics(analysis),
    ...extraDiagnostics({ repository, record, spec, enforcement }),
  ].sort(compareDiagnostics);

  return {
    locator: record.locator,
    specId: analysis.specId,
    plane: record.plane,
    valid: diagnostics.every((d) => d.severity !== 'error'),
    diagnostics,
  };
}

/**
 * Validate a set of governed pairs and assemble the report. Pass every discovered
 * pair (whole-repository validation, which also surfaces repo-level unsafe
 * locators) or a single resolved pair (targeted validation).
 */
export async function validateGovernedPairs(input: {
  repository: GovernedRepository;
  records: GovernedPairRecord[];
  projectRoot: string;
  /** Include repo-level unsafe locators (whole-repository validation only). */
  includeUnsafeLocators?: boolean;
  /** Resolved plane ids; pairs under an id not in this set are reported unknown. */
  planes?: readonly string[];
}): Promise<GovernedValidationReport> {
  const { repository, records, projectRoot, includeUnsafeLocators, planes } = input;

  const specs: GovernedPairValidation[] = [];
  const unknownPlanes: GovernedValidationIssue[] = [];
  if (planes) {
    const declared = new Set(planes);
    const seenUnknown = new Set<string>();
    for (const record of records) {
      if (!declared.has(record.plane) && !seenUnknown.has(record.plane)) {
        seenUnknown.add(record.plane);
        unknownPlanes.push({
          severity: 'error',
          code: 'unknown-plane',
          message: `Pair under plane '${record.plane}' which is not in the resolved plane set (declared: ${[...declared].sort().join(', ')}).`,
          sourcePath: record.specPath ?? record.enforcementPath ?? record.dir,
        });
      }
    }
  }
  for (const record of records) {
    specs.push(await validateGovernedPair({ repository, record, projectRoot }));
  }
  specs.sort((a, b) => a.locator.localeCompare(b.locator));

  const unsafeLocators = includeUnsafeLocators
    ? repository.discovery.unsafeLocators
    : [];

  const valid =
    specs.every((s) => s.valid) &&
    unsafeLocators.length === 0 &&
    unknownPlanes.length === 0;
  return { valid, specs, unsafeLocators, unknownPlanes };
}
