import { describe, it, expect } from 'vitest';
import {
  buildSpecIdIndex,
  findDuplicateLocalIds,
  type IndexedPair,
} from '../../../src/core/governed/spec-id-index.js';
import type { ParsedGovernedSpec } from '../../../src/core/governed/spec-parser.js';
import type { GovernedPairRecord } from '../../../src/core/schemas/governed-spec.schema.js';

function record(locator: string, specPath: string): GovernedPairRecord {
  const plane = locator.split('/')[0] as GovernedPairRecord['plane'];
  return {
    plane,
    locator,
    dir: specPath.replace(/\/spec\.md$/, ''),
    specPath,
    enforcementPath: null,
    completeness: 'spec-only',
  };
}

function indexed(
  locator: string,
  specPath: string,
  spec: ParsedGovernedSpec
): IndexedPair {
  return { record: record(locator, specPath), spec };
}

const emptySpec = (id: string | null): ParsedGovernedSpec => ({
  id,
  requirements: [],
  issues: [],
});

describe('governed/spec-id-index', () => {
  describe('buildSpecIdIndex', () => {
    it('indexes unique spec IDs and resolves them', () => {
      const a = indexed('behavior/a', '/p/a/spec.md', emptySpec('behavior.a'));
      const b = indexed('architecture/b', '/p/b/spec.md', emptySpec('architecture.b'));
      const index = buildSpecIdIndex([a, b]);
      expect(index.conflicts).toEqual([]);
      expect(index.bySpecId.get('behavior.a')).toBe(a);
      expect(index.bySpecId.get('architecture.b')).toBe(b);
    });

    it('reports duplicate spec IDs with every conflicting source location', () => {
      const a = indexed('behavior/a', '/p/a/spec.md', emptySpec('shared.id'));
      const b = indexed('behavior/b', '/p/b/spec.md', emptySpec('shared.id'));
      const index = buildSpecIdIndex([a, b]);
      expect(index.bySpecId.has('shared.id')).toBe(false);
      expect(index.conflicts).toHaveLength(1);
      expect(index.conflicts[0].id).toBe('shared.id');
      expect(index.conflicts[0].locations).toEqual([
        '/p/a/spec.md',
        '/p/b/spec.md',
      ]);
    });

    it('skips pairs whose spec id could not be parsed', () => {
      const a = indexed('behavior/a', '/p/a/spec.md', emptySpec(null));
      const index = buildSpecIdIndex([a]);
      expect(index.bySpecId.size).toBe(0);
      expect(index.conflicts).toEqual([]);
    });
  });

  describe('findDuplicateLocalIds', () => {
    it('returns no duplicates for a clean spec', () => {
      const spec: ParsedGovernedSpec = {
        id: 'behavior.x',
        requirements: [
          {
            id: 'r1',
            title: 'R1',
            scenarios: [{ id: 's1', title: 'S1' }],
          },
          {
            id: 'r2',
            title: 'R2',
            scenarios: [{ id: 's2', title: 'S2' }],
          },
        ],
        issues: [],
      };
      expect(findDuplicateLocalIds(spec)).toEqual([]);
    });

    it('detects duplicate requirement IDs with their titles', () => {
      const spec: ParsedGovernedSpec = {
        id: 'behavior.x',
        requirements: [
          { id: 'dup', title: 'First', scenarios: [] },
          { id: 'dup', title: 'Second', scenarios: [] },
        ],
        issues: [],
      };
      const dups = findDuplicateLocalIds(spec);
      expect(dups).toHaveLength(1);
      expect(dups[0]).toMatchObject({
        scope: 'requirement',
        id: 'dup',
        titles: ['First', 'Second'],
      });
    });

    it('detects duplicate scenario IDs across the whole spec', () => {
      const spec: ParsedGovernedSpec = {
        id: 'behavior.x',
        requirements: [
          { id: 'r1', title: 'R1', scenarios: [{ id: 'sdup', title: 'A' }] },
          { id: 'r2', title: 'R2', scenarios: [{ id: 'sdup', title: 'B' }] },
        ],
        issues: [],
      };
      const dups = findDuplicateLocalIds(spec);
      expect(dups.some((d) => d.scope === 'scenario' && d.id === 'sdup')).toBe(true);
    });

    it('ignores blank IDs (already reported as missing by the parser)', () => {
      const spec: ParsedGovernedSpec = {
        id: 'behavior.x',
        requirements: [
          { id: '', title: 'A', scenarios: [] },
          { id: '', title: 'B', scenarios: [] },
        ],
        issues: [],
      };
      expect(findDuplicateLocalIds(spec)).toEqual([]);
    });
  });
});
