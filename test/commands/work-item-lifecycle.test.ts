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
import {
  DIRECT_ACTION_CATALOG_VERSION,
  getDirectActions,
  getDirectActionsWithReadProbe,
  validateDirectActionIntent,
} from '../../src/core/direct-actions.js';

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

describe('direct action catalog', () => {
  it('returns a closed, deterministic idea policy and validates only exact current intent', async () => {
    const root = lifecycleFixture('active', 'change-directory', 'change-id');
    const ideaDir = path.join(root, 'specbase', 'ideas', 'idea-directory');
    mkdirSync(ideaDir, { recursive: true });
    writeFileSync(path.join(ideaDir, '.openspec.yaml'), 'id: idea-id\nsummary: Catalog idea\ncreated: 2025-01-01\n', 'utf8');

    const catalog = await getDirectActions({ root, workItemId: 'idea-id' });
    expect(catalog).toMatchObject({
      version: DIRECT_ACTION_CATALOG_VERSION,
      target: { storeId: null, workItemId: 'idea-id', position: 'idea' },
      diagnostics: [],
    });
    expect(catalog.actions.map((action) => action.actionId)).toEqual([
      'explore', 'propose-feature', 'explore-enforcement', 'propose-enforcement', 'apply', 'deliver-local', 'review', 'open-draft-pr', 'archive',
    ]);
    expect(catalog.actions.filter((action) => action.availability === 'blocked').every((action) =>
      action.blocker !== null && action.blocker.code.length > 0 && action.blocker.remediation.length > 0
    )).toBe(true);
    expect(catalog.actions[0]).toMatchObject({
      availability: 'available',
      dispatch: { kind: 'skill', skillId: 'specbase-explore', arguments: { workItemId: 'idea-id' } },
    });

    const intent = {
      version: DIRECT_ACTION_CATALOG_VERSION,
      storeId: null,
      workItemId: 'idea-id',
      actionId: 'explore' as const,
      dispatchKind: 'skill' as const,
    };
    await expect(validateDirectActionIntent(intent, { root })).resolves.toMatchObject({
      accepted: true,
      descriptor: { actionId: 'explore', availability: 'available' },
      diagnostics: [],
    });
    await expect(validateDirectActionIntent({ ...intent, command: 'rm -rf /' }, { root })).resolves.toMatchObject({
      accepted: false,
      descriptor: null,
      diagnostics: [{
        code: 'direct_action_intent_executable_field',
        target: { storeId: null, workItemId: 'idea-id' },
        actionId: 'explore',
      }],
    });
    await expect(validateDirectActionIntent({ ...intent, actionId: 'not-a-route' }, { root })).resolves.toMatchObject({
      accepted: false,
      descriptor: null,
      diagnostics: [{ code: 'direct_action_unknown_action' }],
    });
  });

  it('never uses presentation state and returns action-level stack blockers from fresh facts', async () => {
    const root = lifecycleFixture('active', 'change-directory', 'change-id');
    const catalog = await getDirectActions({ root, workItemId: 'change-id' });
    expect(catalog.target).toEqual({ storeId: null, workItemId: 'change-id', position: 'active' });
    expect(catalog.actions.find((action) => action.actionId === 'explore')).toMatchObject({
      availability: 'available',
      dispatch: { skillId: 'specbase-explore', arguments: { workItemId: 'change-id' } },
    });
    expect(catalog.actions.find((action) => action.actionId === 'archive')).toMatchObject({
      availability: 'blocked',
      blocker: { code: 'direct_action_tasks_incomplete' },
    });
  });

  it('gates enforcement to governed feature-complete changes and hides completed apply work', async () => {
    const legacyRoot = lifecycleFixture('active', 'legacy-change', 'legacy-id');
    const legacy = await getDirectActions({ root: legacyRoot, workItemId: 'legacy-id' });
    for (const actionId of ['explore-enforcement', 'propose-enforcement']) {
      expect(legacy.actions.find((action) => action.actionId === actionId)).toMatchObject({
        availability: 'blocked',
        blocker: { code: 'direct_action_governed_required' },
      });
    }

    const governedRoot = lifecycleFixture('active', 'governed-change', 'governed-id');
    const governedDir = path.join(governedRoot, 'specbase', 'changes', 'governed-change');
    writeFileSync(path.join(governedDir, '.openspec.yaml'), 'schema: spec-driven-governed\nid: governed-id\n', 'utf8');
    const governed = await getDirectActions({ root: governedRoot, workItemId: 'governed-id' });
    for (const actionId of ['explore-enforcement', 'propose-enforcement']) {
      expect(governed.actions.find((action) => action.actionId === actionId)).toMatchObject({
        availability: 'blocked',
        blocker: { code: 'direct_action_feature_incomplete' },
      });
    }

    writeFileSync(path.join(governedDir, 'tasks.md'), '- [x] verified\n- [x] complete\n', 'utf8');
    const completed = await getDirectActions({ root: governedRoot, workItemId: 'governed-id' });
    expect(completed.actions.find((action) => action.actionId === 'apply')).toMatchObject({
      availability: 'blocked',
      blocker: { code: 'direct_action_apply_complete' },
    });
    expect(completed.actions.find((action) => action.actionId === 'review')).toMatchObject({
      availability: 'blocked',
      blocker: { code: 'direct_action_strict_validation' },
    });
  });

  it('retries when the planning revision changes and returns one coherent fresh policy', async () => {
    const root = lifecycleFixture('active', 'change-directory', 'change-id');
    const tasks = path.join(root, 'specbase', 'changes', 'change-directory', 'tasks.md');
    let probes = 0;
    const catalog = await getDirectActionsWithReadProbe({ root, workItemId: 'change-id' }, (attempt) => {
      probes++;
      if (attempt === 0) writeFileSync(tasks, '- [x] verified\n- [x] complete\n', 'utf8');
    });
    expect(probes).toBe(2);
    expect(catalog.actions.find((action) => action.actionId === 'apply')).toMatchObject({
      availability: 'blocked',
      blocker: { code: 'direct_action_apply_complete' },
    });
  });

  it('rejects unsupported, malformed, and stale exact intents with stable identity', async () => {
    const root = lifecycleFixture('active', 'change-directory', 'change-id');
    const base = {
      version: DIRECT_ACTION_CATALOG_VERSION,
      storeId: null,
      workItemId: 'change-id',
      actionId: 'explore' as const,
      dispatchKind: 'skill' as const,
    };
    await expect(validateDirectActionIntent({ ...base, version: 99 }, { root })).resolves.toMatchObject({
      accepted: false,
      diagnostics: [{ code: 'direct_action_unsupported_version', target: { workItemId: 'change-id' }, actionId: 'explore' }],
    });
    await expect(validateDirectActionIntent({ ...base, dispatchKind: 'workflow' }, { root })).resolves.toMatchObject({
      accepted: false,
      diagnostics: [{ code: 'direct_action_intent_malformed', target: { workItemId: 'change-id' }, actionId: 'explore' }],
    });
    await expect(validateDirectActionIntent({ ...base, storeId: 'missing-store' }, {
      root,
      globalDataDir: path.join(root, 'global-data'),
    })).resolves.toMatchObject({
      accepted: false,
      diagnostics: [{ code: 'direct_action_store_unresolved', target: { storeId: 'missing-store', workItemId: 'change-id' } }],
    });
    await expect(validateDirectActionIntent({ ...base, workItemId: 'missing-change' }, { root })).resolves.toMatchObject({
      accepted: false,
      diagnostics: [{ code: 'direct_action_target_unresolved', target: { workItemId: 'missing-change' } }],
    });
    rmSync(path.join(root, 'specbase', 'changes', 'change-directory'), { recursive: true, force: true });
    await expect(validateDirectActionIntent(base, { root })).resolves.toMatchObject({
      accepted: false,
      diagnostics: [{ code: 'direct_action_target_unresolved', target: { workItemId: 'change-id' } }],
    });
  });

  it('prioritizes stack predecessor ordering before archive readiness details', async () => {
    const root = lifecycleFixture('active', 'predecessor-change', 'predecessor-id');
    const successor = path.join(root, 'specbase', 'changes', 'successor-change');
    const stack = path.join(root, 'specbase', 'stacks', 'catalog-stack');
    mkdirSync(successor, { recursive: true });
    mkdirSync(stack, { recursive: true });
    writeFileSync(path.join(successor, '.openspec.yaml'), 'schema: spec-driven\nid: successor-id\n', 'utf8');
    writeFileSync(path.join(successor, 'tasks.md'), '- [x] done\n', 'utf8');
    writeFileSync(path.join(stack, '.openspec.yaml'), [
      'id: catalog-stack',
      'summary: Catalog stack',
      'created: 2025-01-01',
      'members:',
      '  - predecessor-id',
      '  - successor-id',
      '',
    ].join('\n'), 'utf8');

    const catalog = await getDirectActions({ root, workItemId: 'successor-id' });
    expect(catalog.actions.find((action) => action.actionId === 'archive')).toMatchObject({
      availability: 'blocked',
      blocker: {
        code: 'direct_action_stack_predecessor',
        remediation: expect.stringContaining('predecessor-id'),
      },
    });
  });

  it('returns stable target diagnostics without an action catalog', async () => {
    const root = lifecycleFixture('active', 'change-directory', 'change-id');
    const firstIdea = path.join(root, 'specbase', 'ideas', 'duplicate-one');
    const secondIdea = path.join(root, 'specbase', 'ideas', 'duplicate-two');
    mkdirSync(firstIdea, { recursive: true });
    mkdirSync(secondIdea, { recursive: true });
    writeFileSync(path.join(firstIdea, '.openspec.yaml'), 'id: duplicate-idea\n', 'utf8');
    writeFileSync(path.join(secondIdea, '.openspec.yaml'), 'id: duplicate-idea\n', 'utf8');
    await expect(getDirectActions({ root, workItemId: 'duplicate-idea' })).resolves.toMatchObject({
      target: null,
      actions: [],
      diagnostics: [{ code: 'direct_action_target_ambiguous', target: { workItemId: 'duplicate-idea' } }],
    });
    await expect(getDirectActions({ root, workItemId: 'missing-id' })).resolves.toEqual({
      version: DIRECT_ACTION_CATALOG_VERSION,
      target: null,
      actions: [],
      diagnostics: [{
        code: 'direct_action_target_unresolved',
        target: { storeId: null, workItemId: 'missing-id' },
        message: "No work item resolves to 'missing-id'.",
        remediation: 'Choose an immutable ID from the selected planning store.',
      }],
    });
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