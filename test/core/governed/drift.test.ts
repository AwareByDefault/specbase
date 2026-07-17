import { describe, it, expect } from 'vitest';
import {
  compareRetiredTargets,
  analyzePairDrift,
} from '../../../src/core/governed/drift.js';
import type { ParsedGovernedSpec } from '../../../src/core/governed/spec-parser.js';
import type { ParsedEnforcement } from '../../../src/core/governed/enforcement-parser.js';
import type {
  Binding,
  GovernedPairRecord,
} from '../../../src/core/schemas/governed-spec.schema.js';

function enforcement(bindings: Binding[]): ParsedEnforcement {
  return { version: 1, spec: 'architecture.domain', bindings, issues: [] };
}

function automated(
  id: string,
  covers: string[],
  targets: string[],
  overrides: Partial<Binding> = {}
): Binding {
  return {
    id,
    covers,
    mechanism: 'test',
    strength: 'automated',
    status: 'active',
    targets,
    run: { command: 'pnpm', args: ['vitest'], cwd: '.' },
    ...overrides,
  };
}

describe('governed/drift compareRetiredTargets', () => {
  it('reports a removed binding target as a retired candidate when no binding survives it', () => {
    const current = enforcement([automated('b1', ['r'], ['test/a.test.ts'])]);
    const next = enforcement([]);
    const retired = compareRetiredTargets(current, next);
    expect(retired).toHaveLength(1);
    expect(retired[0]).toMatchObject({
      path: 'test/a.test.ts',
      fromBindingIds: ['b1'],
      stillReferenced: false,
      survivingBindingIds: [],
    });
  });

  it('reports a still-shared target when a surviving binding references it', () => {
    const current = enforcement([
      automated('b1', ['r1'], ['test/shared.test.ts']),
      automated('b2', ['r2'], ['test/shared.test.ts']),
    ]);
    // b1 removed; b2 survives and still references the shared target.
    const next = enforcement([automated('b2', ['r2'], ['test/shared.test.ts'])]);
    const retired = compareRetiredTargets(current, next);
    expect(retired).toHaveLength(1);
    expect(retired[0]).toMatchObject({
      path: 'test/shared.test.ts',
      fromBindingIds: ['b1'],
      stillReferenced: true,
      survivingBindingIds: ['b2'],
    });
  });

  it('does not report targets fully preserved by the same binding', () => {
    const current = enforcement([automated('b1', ['r'], ['test/a.test.ts'])]);
    const next = enforcement([automated('b1', ['r'], ['test/a.test.ts'])]);
    expect(compareRetiredTargets(current, next)).toEqual([]);
  });
});

const oneRequirement: ParsedGovernedSpec = {
  id: 'architecture.domain',
  requirements: [
    {
      id: 'domain-determinism',
      title: 'Domain determinism',
      scenarios: [{ id: 'ambient-time-rejected', title: 'Ambient time' }],
    },
  ],
  issues: [],
};

function record(overrides: Partial<GovernedPairRecord> = {}): GovernedPairRecord {
  return {
    plane: 'architecture',
    locator: 'architecture/domain',
    dir: '/p/architecture/domain',
    specPath: '/p/architecture/domain/spec.md',
    enforcementPath: '/p/architecture/domain/enforcement.md',
    completeness: 'complete',
    ...overrides,
  };
}

describe('governed/drift analyzePairDrift', () => {
  it('is ready when coverage is complete and targets are present', async () => {
    const analysis = await analyzePairDrift({
      record: record(),
      spec: oneRequirement,
      enforcement: enforcement([
        automated('b1', ['domain-determinism'], ['test/a.test.ts']),
      ]),
      projectRoot: '/p',
      targetOptions: { pathExists: async () => true },
    });
    expect(analysis.ready).toBe(true);
    expect(analysis.blockers).toEqual([]);
  });

  it('blocks and orders blockers deterministically when planned and hanging coexist', async () => {
    const analysis = await analyzePairDrift({
      record: record(),
      spec: oneRequirement,
      enforcement: enforcement([
        automated('b1', ['domain-determinism'], ['test/a.test.ts'], {
          status: 'planned',
        }),
      ]),
      projectRoot: '/p',
      targetOptions: { pathExists: async () => true },
    });
    expect(analysis.ready).toBe(false);
    // A planned binding covers nothing, so the requirement is hanging and its
    // scenario uncovered; blockers stay in the canonical order.
    expect(analysis.blockers).toEqual([
      'hanging-requirements',
      'uncovered-scenarios',
      'planned-bindings',
    ]);
  });

  it('detects a pair identity mismatch', async () => {
    const analysis = await analyzePairDrift({
      record: record(),
      spec: oneRequirement,
      enforcement: {
        version: 1,
        spec: 'architecture.other',
        bindings: [automated('b1', ['domain-determinism'], ['test/a.test.ts'])],
        issues: [],
      },
      projectRoot: '/p',
      targetOptions: { pathExists: async () => true },
    });
    expect(analysis.identityMismatch).toEqual({
      specId: 'architecture.domain',
      enforcementSpecId: 'architecture.other',
    });
    expect(analysis.blockers).toContain('identity-mismatch');
  });

  it('blocks an incomplete pair', async () => {
    const analysis = await analyzePairDrift({
      record: record({ enforcementPath: null, completeness: 'spec-only' }),
      spec: oneRequirement,
      enforcement: { version: null, spec: null, bindings: [], issues: [] },
      projectRoot: '/p',
    });
    expect(analysis.incompletePair).toBe(true);
    expect(analysis.blockers).toContain('incomplete-pair');
    expect(analysis.ready).toBe(false);
  });
});
