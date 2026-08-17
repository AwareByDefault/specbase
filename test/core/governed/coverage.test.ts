import { describe, it, expect } from 'vitest';
import { computeCoverage } from '../../../src/core/governed/coverage.js';
import type { ParsedGovernedSpec } from '../../../src/core/governed/spec-parser.js';
import type { ParsedEnforcement } from '../../../src/core/governed/enforcement-parser.js';
import type { Binding } from '../../../src/core/schemas/governed-spec.schema.js';

function spec(
  requirements: ParsedGovernedSpec['requirements']
): ParsedGovernedSpec {
  return { id: 'architecture.domain', requirements, issues: [] };
}

function enforcement(bindings: Binding[]): ParsedEnforcement {
  return { version: 1, spec: 'architecture.domain', bindings, issues: [] };
}

function automated(
  id: string,
  covers: string[],
  overrides: Partial<Binding> = {}
): Binding {
  return {
    id,
    covers,
    mechanism: 'test',
    strength: 'automated',
    status: 'active',
    targets: ['test/a.test.ts'],
    run: { command: 'pnpm', args: ['vitest'], cwd: '.' },
    ...overrides,
  };
}

const oneRequirement = spec([
  {
    id: 'domain-determinism',
    title: 'Domain determinism',
    scenarios: [
      { id: 'ambient-time-rejected', title: 'Ambient time is rejected' },
      { id: 'injected-time-accepted', title: 'Injected time is accepted' },
    ],
  },
]);

describe('governed/coverage', () => {
  it('marks a requirement and its scenarios covered by a requirement-level binding', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([automated('b1', ['domain-determinism'])]),
    });
    expect(report.hangingRequirementIds).toEqual([]);
    expect(report.uncoveredScenarioIds).toEqual([]);
    expect(report.requirements[0].state).toBe('covered');
    expect(report.requirements[0].coveredBy).toEqual(['b1']);
    // Scenarios are covered by requirement-level coverage without their own binding.
    expect(report.scenarios.every((s) => s.state === 'covered')).toBe(true);
    expect(report.scenarios[0].coveredBy).toEqual(['b1']);
  });

  it('rejects scenario IDs as binding boundaries while scenarios inherit from the requirement', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([
        automated('req', ['domain-determinism']),
        automated('scen', ['ambient-time-rejected']),
      ]),
    });
    const ambient = report.scenarios.find((s) => s.id === 'ambient-time-rejected');
    expect(ambient?.coveredBy).toEqual(['req']);
    expect(report.staleBindingIds).toEqual(['scen']);
  });

  it('reports a hanging requirement when no binding covers it', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([]),
    });
    expect(report.hangingRequirementIds).toEqual(['domain-determinism']);
    expect(report.requirements[0].state).toBe('hanging');
  });

  it('reports an uncovered scenario when the requirement is covered only by a direct-scenario binding for another scenario', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      // Covers only one scenario directly; requirement itself is not covered.
      enforcement: enforcement([automated('s', ['ambient-time-rejected'])]),
    });
    expect(report.hangingRequirementIds).toEqual(['domain-determinism']);
    expect(report.uncoveredScenarioIds).toEqual([
      'ambient-time-rejected',
      'injected-time-accepted',
    ]);
    expect(report.staleBindingIds).toEqual(['s']);
  });

  it('flags a stale binding covering a removed normative ID', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([
        automated('b1', ['domain-determinism', 'removed-scenario']),
      ]),
    });
    expect(report.staleBindingIds).toEqual(['b1']);
    expect(report.bindings[0].state).toBe('stale');
    expect(report.bindings[0].staleCoveredIds).toEqual(['removed-scenario']);
  });

  it('flags a broken binding whose active target is missing and leaves the claim hanging', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([automated('b1', ['domain-determinism'])]),
      missingTargetsByBinding: new Map([['b1', ['test/a.test.ts']]]),
    });
    expect(report.brokenBindingIds).toEqual(['b1']);
    expect(report.bindings[0].state).toBe('broken');
    // A broken binding does not count as coverage: the requirement is hanging.
    expect(report.hangingRequirementIds).toEqual(['domain-determinism']);
  });

  it('does not count an escaping-target binding as coverage', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([
        automated('b1', ['domain-determinism'], {
          targets: ['../outside/a.test.ts'],
        }),
      ]),
      escapingBindingIds: new Set(['b1']),
    });
    // An escaping binding is rejected, so it leaves the claim hanging.
    expect(report.hangingRequirementIds).toEqual(['domain-determinism']);
    expect(report.bindings[0].complete).toBe(false);
  });

  it('does not count a planned binding as coverage', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([
        automated('b1', ['domain-determinism'], { status: 'planned' }),
      ]),
    });
    expect(report.plannedBindingIds).toEqual(['b1']);
    expect(report.bindings[0].state).toBe('planned');
    expect(report.hangingRequirementIds).toEqual(['domain-determinism']);
  });

  it('does not count an unenforced binding as coverage', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([
        automated('b1', ['domain-determinism'], { strength: 'unenforced' }),
      ]),
    });
    expect(report.unenforcedBindingIds).toEqual(['b1']);
    expect(report.hangingRequirementIds).toEqual(['domain-determinism']);
  });

  it('flags an active binding missing its declared evidence as incomplete', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([
        automated('b1', ['domain-determinism'], { run: undefined, targets: [] }),
      ]),
    });
    expect(report.incompleteBindingIds).toEqual(['b1']);
    expect(report.bindings[0].state).toBe('incomplete');
    expect(report.hangingRequirementIds).toEqual(['domain-determinism']);
  });

  it('derives compact binding strength from a custom resolved type', () => {
    const compact = automated('custom', ['domain-determinism'], {
      type: 'nix-check',
      source: 'checks/domain.nix',
      mechanism: 'nix-check',
      strength: 'unenforced',
      targets: ['checks/domain.nix'],
      run: undefined,
    });
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: { ...enforcement([compact]), format: 'yaml' },
      enforcementTypes: [{
        id: 'nix-check',
        purpose: 'Evaluated Nix assertions.',
        strength: 'automated',
        sourceKind: 'file',
      }],
    });
    expect(report.bindings[0]).toMatchObject({
      type: 'nix-check',
      strength: 'automated',
      complete: true,
    });
    expect(report.hangingRequirementIds).toEqual([]);
  });

  it('counts a complete review binding as coverage', () => {
    const report = computeCoverage({
      spec: oneRequirement,
      enforcement: enforcement([
        {
          id: 'rev',
          covers: ['domain-determinism'],
          mechanism: 'review',
          strength: 'review',
          status: 'active',
          targets: [],
          review: { procedure: 'Inspect the module.', inputs: [] },
        },
      ]),
    });
    expect(report.hangingRequirementIds).toEqual([]);
    expect(report.requirements[0].coveredBy).toEqual(['rev']);
  });
});
