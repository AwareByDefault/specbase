import type { GovernedPairRecord } from '../schemas/governed-spec.schema.js';
import type { ParsedGovernedSpec } from './spec-parser.js';

/**
 * Project-unique stable spec-ID index and pair-local identity validation
 * (design decision 3). Spec IDs are the only project-wide identity; requirement
 * and scenario IDs are validated inside each pair.
 */

/** A pairing of a discovered record with its parsed spec content. */
export interface IndexedPair {
  record: GovernedPairRecord;
  spec: ParsedGovernedSpec;
}

export interface SpecIdConflict {
  id: string;
  /** Every conflicting source location (native spec.md path, or dir). */
  locations: string[];
}

export interface SpecIdIndex {
  /** Stable spec ID → the single indexed pair that owns it (conflicts excluded). */
  bySpecId: Map<string, IndexedPair>;
  /** Every duplicated spec ID with all of its conflicting source locations. */
  conflicts: SpecIdConflict[];
}

function sourceLocation(pair: IndexedPair): string {
  return pair.record.specPath ?? pair.record.dir;
}

/**
 * Build the project-unique spec-ID index. A spec ID claimed by more than one
 * pair is reported as a conflict with every source location and is left out of
 * `bySpecId` so lookups never resolve an ambiguous ID.
 */
export function buildSpecIdIndex(pairs: IndexedPair[]): SpecIdIndex {
  const grouped = new Map<string, IndexedPair[]>();

  for (const pair of pairs) {
    const id = pair.spec.id;
    if (id === null) continue; // unparseable id surfaced by spec parser issues
    const bucket = grouped.get(id);
    if (bucket) {
      bucket.push(pair);
    } else {
      grouped.set(id, [pair]);
    }
  }

  const bySpecId = new Map<string, IndexedPair>();
  const conflicts: SpecIdConflict[] = [];

  for (const [id, bucket] of grouped) {
    if (bucket.length === 1) {
      bySpecId.set(id, bucket[0]);
    } else {
      conflicts.push({
        id,
        locations: bucket.map(sourceLocation).sort(),
      });
    }
  }

  conflicts.sort((a, b) => a.id.localeCompare(b.id));

  return { bySpecId, conflicts };
}

export type IdentityScope = 'requirement' | 'scenario';

export interface DuplicateLocalId {
  scope: IdentityScope;
  id: string;
  /** Titles of every node that declared the duplicated ID, in document order. */
  titles: string[];
}

/**
 * Validate requirement and scenario ID uniqueness within a single parsed spec.
 * Requirement IDs must be unique among requirements and scenario IDs unique
 * among scenarios across the whole spec (design decision 3). Blank IDs (a
 * parser-reported missing slug) are skipped here — the parser already flagged them.
 */
export function findDuplicateLocalIds(spec: ParsedGovernedSpec): DuplicateLocalId[] {
  const requirementTitles = new Map<string, string[]>();
  const scenarioTitles = new Map<string, string[]>();

  for (const requirement of spec.requirements) {
    if (requirement.id) {
      pushTitle(requirementTitles, requirement.id, requirement.title);
    }
    for (const scenario of requirement.scenarios) {
      if (scenario.id) {
        pushTitle(scenarioTitles, scenario.id, scenario.title);
      }
    }
  }

  const duplicates: DuplicateLocalId[] = [];
  collectDuplicates('requirement', requirementTitles, duplicates);
  collectDuplicates('scenario', scenarioTitles, duplicates);
  duplicates.sort(
    (a, b) => a.scope.localeCompare(b.scope) || a.id.localeCompare(b.id)
  );
  return duplicates;
}

function pushTitle(map: Map<string, string[]>, id: string, title: string): void {
  const bucket = map.get(id);
  if (bucket) bucket.push(title);
  else map.set(id, [title]);
}

function collectDuplicates(
  scope: IdentityScope,
  map: Map<string, string[]>,
  out: DuplicateLocalId[]
): void {
  for (const [id, titles] of map) {
    if (titles.length > 1) {
      out.push({ scope, id, titles });
    }
  }
}
