import { describe, it, expect } from 'vitest';
import {
  collectDiagnostics,
  renderDiagnostics,
} from '../../../src/core/governed/diagnostics.js';
import { analyzePairDrift } from '../../../src/core/governed/drift.js';
import type { ParsedGovernedSpec } from '../../../src/core/governed/spec-parser.js';
import type { ParsedEnforcement } from '../../../src/core/governed/enforcement-parser.js';
import type {
  Binding,
  GovernedPairRecord,
} from '../../../src/core/schemas/governed-spec.schema.js';

const spec: ParsedGovernedSpec = {
  id: 'architecture.domain',
  requirements: [
    {
      id: 'domain-determinism',
      title: 'Domain determinism',
      scenarios: [{ id: 'ambient-time-rejected', title: 'Ambient time' }],
    },
    {
      id: 'other-rule',
      title: 'Other rule',
      scenarios: [],
    },
  ],
  issues: [],
};

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

const record: GovernedPairRecord = {
  plane: 'architecture',
  locator: 'architecture/domain',
  dir: '/p/architecture/domain',
  specPath: '/p/architecture/domain/spec.md',
  enforcementPath: '/p/architecture/domain/enforcement.md',
  completeness: 'complete',
};

// A pair with a hanging requirement (other-rule) and a stale binding.
const enforcement: ParsedEnforcement = {
  version: 1,
  spec: 'architecture.domain',
  bindings: [
    automated('b1', ['domain-determinism', 'ghost-id'], ['test/a.test.ts']),
  ],
  issues: [],
};

describe('governed/diagnostics', () => {
  it('emits diagnostics carrying stable spec, normative, binding, and source details', async () => {
    const analysis = await analyzePairDrift({
      record,
      spec,
      enforcement,
      projectRoot: '/p',
      targetOptions: { pathExists: async () => true },
    });
    const diagnostics = collectDiagnostics(analysis);

    const stale = diagnostics.find((d) => d.code === 'binding/stale');
    expect(stale).toMatchObject({
      specId: 'architecture.domain',
      locator: 'architecture/domain',
      plane: 'architecture',
      bindingId: 'b1',
      normativeId: 'ghost-id',
      sourcePath: '/p/architecture/domain/enforcement.md',
    });

    const hanging = diagnostics.find(
      (d) => d.code === 'coverage/hanging-requirement'
    );
    expect(hanging).toMatchObject({
      normativeId: 'other-rule',
      sourcePath: '/p/architecture/domain/spec.md',
    });
  });

  it('is deterministic: identical inputs produce byte-identical output regardless of run', async () => {
    const run = async () =>
      collectDiagnostics(
        await analyzePairDrift({
          record,
          spec,
          enforcement,
          projectRoot: '/p',
          targetOptions: { pathExists: async () => true },
        })
      );
    const a = renderDiagnostics(await run());
    const b = renderDiagnostics(await run());
    expect(a).toBe(b);
    // Sorted by code: 'binding/stale' sorts before 'coverage/...'.
    const codes = (await run()).map((d) => d.code);
    const sorted = [...codes].sort((x, y) => x.localeCompare(y));
    expect(codes).toEqual(sorted);
  });

  it('renders retired-target cleanup candidates with shared vs retired severity', async () => {
    const analysis = await analyzePairDrift({
      record,
      spec,
      enforcement,
      projectRoot: '/p',
      targetOptions: { pathExists: async () => true },
    });
    const diagnostics = collectDiagnostics(analysis, {
      retiredTargets: [
        {
          path: 'test/old.test.ts',
          fromBindingIds: ['b0'],
          stillReferenced: false,
          survivingBindingIds: [],
        },
        {
          path: 'test/shared.test.ts',
          fromBindingIds: ['b0'],
          stillReferenced: true,
          survivingBindingIds: ['b1'],
        },
      ],
    });
    const cleanup = diagnostics.filter((d) => d.code === 'cleanup/retired-target');
    expect(cleanup).toHaveLength(2);
    const retired = cleanup.find((d) => d.targetPath === 'test/old.test.ts');
    const shared = cleanup.find((d) => d.targetPath === 'test/shared.test.ts');
    expect(retired?.severity).toBe('warning');
    expect(shared?.severity).toBe('info');
  });
});
