import { afterEach, describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
  deriveLifecycleState,
  countTaskCheckboxes,
  type LifecycleInput,
} from '../../src/core/work-item-lifecycle.js';
import { resolveLifecycleSnapshot } from '../../src/core/lifecycle-snapshot.js';

/**
 * Behavior: a work item's lifecycle state is DERIVED from the artifact set,
 * task completion, a review footprint, and the archive location — never read
 * from a stored `state` field. These tests exercise the pure derivation across
 * every state.
 */

const done = (_id?: string) => 'done' as const;

function baseInput(over: Partial<LifecycleInput> = {}): LifecycleInput {
  return {
    archived: false,
    artifactDispositions: {},
    applyRequires: ['tasks'],
    tasksChecked: 0,
    tasksTotal: 0,
    reviewFootprint: false,
    ...over,
  };
}

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length) rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
});

function lifecycleFixture(position: 'active' | 'archived', directoryName: string, id: string): string {
  const root = mkdtempSync(path.join(tmpdir(), 'specbase-lifecycle-'));
  temporaryRoots.push(root);
  const changeDir = position === 'active'
    ? path.join(root, 'specbase', 'changes', directoryName)
    : path.join(root, 'specbase', 'changes', 'archive', directoryName);
  mkdirSync(changeDir, { recursive: true });
  writeFileSync(path.join(changeDir, '.openspec.yaml'), `schema: spec-driven\nid: ${id}\n`, 'utf8');
  writeFileSync(path.join(changeDir, 'tasks.md'), '- [x] verified\n- [ ] pending\n', 'utf8');
  return root;
}

describe('deriveLifecycleState', () => {
  it('archived is terminal regardless of artifacts', () => {
    expect(deriveLifecycleState(baseInput({ archived: true }))).toBe('archived');
  });

  it('proposed when feature artifacts exist but enforcement is not begun', () => {
    expect(deriveLifecycleState(baseInput({ artifactDispositions: {} }))).toBe('proposed');
  });

  it('enforcement when the enforcement write has begun but the apply gate is not met', () => {
    expect(
      deriveLifecycleState(
        baseInput({
          applyRequires: ['tasks'],
          artifactDispositions: { enforcement: done('enforcement') },
        })
      )
    ).toBe('enforcement');
  });

  it('ready-to-apply when every apply-required artifact is present and nothing started', () => {
    expect(
      deriveLifecycleState(
        baseInput({
          applyRequires: ['tasks'],
          artifactDispositions: { tasks: done('tasks') },
        })
      )
    ).toBe('ready-to-apply');
  });

  it('implementing when apply started (some tasks checked)', () => {
    expect(
      deriveLifecycleState(
        baseInput({
          applyRequires: ['tasks'],
          artifactDispositions: { tasks: done('tasks') },
          tasksChecked: 1,
          tasksTotal: 3,
        })
      )
    ).toBe('implementing');
  });

  it('reviewing only when tasks are done AND the review footprint is present', () => {
    expect(
      deriveLifecycleState(
        baseInput({
          applyRequires: ['tasks'],
          artifactDispositions: { tasks: done('tasks') },
          tasksChecked: 3,
          tasksTotal: 3,
          reviewFootprint: true,
        })
      )
    ).toBe('reviewing');
  });

  it('tasks complete without a review footprint stays implementing (awaiting review)', () => {
    expect(
      deriveLifecycleState(
        baseInput({
          applyRequires: ['tasks'],
          artifactDispositions: { tasks: done('tasks') },
          tasksChecked: 3,
          tasksTotal: 3,
          reviewFootprint: false,
        })
      )
    ).toBe('implementing');
  });
});

describe('lifecycle snapshot resolver contract', () => {
  it('normalizes active and dated archive work-item IDs through one resolver', () => {
    const activeRoot = lifecycleFixture('active', 'renamed-active-directory', 'active-id');
    const archivedRoot = lifecycleFixture('archived', '2025-01-02-renamed-archive-directory', 'archive-id');

    const active = resolveLifecycleSnapshot({ root: activeRoot, id: 'active-id' });
    const archived = resolveLifecycleSnapshot({ root: archivedRoot, id: 'archive-id' });

    expect(active.snapshot).toMatchObject({
      id: 'active-id', position: 'active', lifecycle: 'implementing',
      tasks: { complete: 1, total: 2 },
    });
    expect(archived.snapshot).toMatchObject({
      id: 'archive-id', position: 'archived', lifecycle: 'archived',
      tasks: { complete: 1, total: 2 },
    });
    // Status is an adapter over the resolver's already-normalized context.
    expect(active.status?.lifecycle).toBe(active.snapshot?.lifecycle);
    expect(active.status?.artifacts.filter((artifact) => artifact.status === 'done')).toHaveLength(
      active.snapshot?.artifacts.complete ?? -1
    );
  });

  it('isolates unrelated malformed metadata while preserving explicit fallback errors', () => {
    const root = lifecycleFixture('active', 'selected-directory', 'selected-id');
    const malformed = path.join(root, 'specbase', 'changes', 'unrelated-malformed');
    mkdirSync(malformed, { recursive: true });
    writeFileSync(path.join(malformed, '.openspec.yaml'), 'schema: unknown-schema\nid: broken-id\n', 'utf8');

    expect(resolveLifecycleSnapshot({ root, id: 'selected-id' }).snapshot).toMatchObject({
      id: 'selected-id',
      position: 'active',
    });
    expect(() => resolveLifecycleSnapshot({
      root,
      id: 'unrelated-malformed',
      allowDirectoryFallback: true,
    })).toThrow(/Unknown schema 'unknown-schema'/);
  });

  it('returns ordered, actionable unresolved and ambiguous ID diagnostics', () => {
    const root = lifecycleFixture('active', 'first', 'duplicate-id');
    const second = path.join(root, 'specbase', 'changes', 'archive', '2025-01-02-second');
    mkdirSync(second, { recursive: true });
    writeFileSync(path.join(second, '.openspec.yaml'), 'schema: spec-driven\nid: duplicate-id\n', 'utf8');

    expect(resolveLifecycleSnapshot({ root, id: 'missing-id' })).toMatchObject({
      snapshot: null,
      diagnostics: [{ code: 'lifecycle_snapshot_unresolved', id: 'missing-id' }],
    });
    const ambiguous = resolveLifecycleSnapshot({ root, id: 'duplicate-id' });
    expect(ambiguous.snapshot).toBeNull();
    expect(ambiguous.diagnostics).toEqual([{
      code: 'lifecycle_snapshot_ambiguous',
      id: 'duplicate-id',
      message: "More than one active or archived work item resolves to 'duplicate-id'.",
      remediation: 'Restore unique immutable IDs before resolving this work item.',
    }]);
  });
});

describe('countTaskCheckboxes', () => {
  it('counts checked and unchecked Markdown checkboxes independently of bullet style', () => {
    const content = [
      '## 1. Group',
      '- [x] done one',
      '- [ ] pending',
      '* [X] done two (uppercase)',
      '- [ ] another',
    ].join('\n');
    expect(countTaskCheckboxes(content)).toEqual({ checked: 2, total: 4 });
  });

  it('ignores non-checkbox lines', () => {
    expect(countTaskCheckboxes('plain line\n- [ ] only box\n')).toEqual({
      checked: 0,
      total: 1,
    });
  });
});