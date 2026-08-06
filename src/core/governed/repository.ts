import { promises as fs } from 'node:fs';
import type { SpecPlane } from '../artifact-graph/types.js';
import { discoverGovernedPairs, type GovernedDiscovery } from './discovery.js';
import { parseGovernedSpec, type ParsedGovernedSpec } from './spec-parser.js';
import {
  buildSpecIdIndex,
  findDuplicateLocalIds,
  type DuplicateLocalId,
  type IndexedPair,
  type SpecIdIndex,
} from './spec-id-index.js';
import {
  buildPairLookup,
  resolveGovernedPair,
  type GovernedPairLookup,
  type PairResolution,
} from './pair-resolver.js';

/**
 * One assembled view of a project's governed repository: discovery, parsed
 * specs, the project-unique spec-ID index, and the resolver lookup. Shared CLI
 * surfaces (later units) consume this rather than re-reading the file format.
 */
export interface GovernedRepository {
  discovery: GovernedDiscovery;
  indexedPairs: IndexedPair[];
  index: SpecIdIndex;
  lookup: GovernedPairLookup;
  /** Pair locator → duplicate requirement/scenario IDs found within that pair. */
  duplicateLocalIds: Map<string, DuplicateLocalId[]>;
}

/**
 * Discover, parse, and index every governed pair beneath `openspecRoot`. Reads
 * each pair's `spec.md` when present; incomplete/enforcement-only pairs are kept
 * with an empty parsed spec so callers can still report them. `planes` is the
 * resolved plane set; when omitted, the historical two-plane set is assumed.
 */
export async function loadGovernedRepository(
  openspecRoot: string,
  planes?: readonly SpecPlane[]
): Promise<GovernedRepository> {
  const discovery = await discoverGovernedPairs(openspecRoot, planes);

  const indexedPairs: IndexedPair[] = [];
  const duplicateLocalIds = new Map<string, DuplicateLocalId[]>();

  for (const record of discovery.pairs) {
    let spec: ParsedGovernedSpec;
    if (record.specPath) {
      const content = await fs.readFile(record.specPath, 'utf-8');
      spec = parseGovernedSpec(content);
    } else {
      spec = { id: null, requirements: [], issues: [] };
    }
    indexedPairs.push({ record, spec });

    const duplicates = findDuplicateLocalIds(spec);
    if (duplicates.length > 0) {
      duplicateLocalIds.set(record.locator, duplicates);
    }
  }

  const index = buildSpecIdIndex(indexedPairs);
  const lookup = buildPairLookup(discovery, index);

  return { discovery, indexedPairs, index, lookup, duplicateLocalIds };
}

/** Resolve a governed pair from a loaded repository by locator or spec ID. */
export function resolvePair(
  repository: GovernedRepository,
  query: string
): PairResolution {
  return resolveGovernedPair(repository.lookup, query);
}
