import type { GovernedPairRecord } from '../schemas/governed-spec.schema.js';
import { isSpecId } from '../id.js';
import type { GovernedDiscovery } from './discovery.js';
import type { IndexedPair, SpecIdIndex } from './spec-id-index.js';

/**
 * Resolve one governed pair by plane-qualified locator or stable spec ID and
 * return its native `spec.md` and `enforcement.md` paths as a single record
 * (design decision 6, requirement "Governed pair resolution").
 *
 * A query with a `/` is a locator (`behavior/session-loop`); otherwise it is a
 * stable spec ID (`architecture.domain`). Because spec IDs are locator-independent,
 * a moved spec still resolves by ID.
 */

export type PairResolution =
  | { found: true; via: 'locator' | 'spec-id'; pair: GovernedPairRecord }
  | { found: false; reason: 'unknown-locator' | 'unknown-spec-id' | 'ambiguous-query' };

export interface GovernedPairLookup {
  byLocator: Map<string, GovernedPairRecord>;
  index: SpecIdIndex;
}

/** Build the lookup maps a resolver needs from discovery + parsed specs. */
export function buildPairLookup(
  discovery: GovernedDiscovery,
  index: SpecIdIndex
): GovernedPairLookup {
  const byLocator = new Map<string, GovernedPairRecord>();
  for (const pair of discovery.pairs) {
    byLocator.set(pair.locator, pair);
  }
  return { byLocator, index };
}

/**
 * True when a query addresses by stable spec ID rather than by locator. A
 * locator always carries a `/` (plane + at least one segment); a spec ID never
 * does.
 */
function isSpecIdQuery(query: string): boolean {
  return !query.includes('/') && isSpecId(query);
}

export function resolveGovernedPair(
  lookup: GovernedPairLookup,
  query: string
): PairResolution {
  const trimmed = query.trim();

  if (trimmed.includes('/')) {
    const pair = lookup.byLocator.get(trimmed);
    return pair
      ? { found: true, via: 'locator', pair }
      : { found: false, reason: 'unknown-locator' };
  }

  if (isSpecIdQuery(trimmed)) {
    const indexed: IndexedPair | undefined = lookup.index.bySpecId.get(trimmed);
    return indexed
      ? { found: true, via: 'spec-id', pair: indexed.record }
      : { found: false, reason: 'unknown-spec-id' };
  }

  return { found: false, reason: 'ambiguous-query' };
}

/** True when a resolved pair is missing one of its two files. */
export function isIncompletePair(pair: GovernedPairRecord): boolean {
  return pair.completeness !== 'complete';
}
