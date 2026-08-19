import { describe, it, expect } from 'vitest';
import {
  deriveLifecycleState,
  countTaskCheckboxes,
  type LifecycleInput,
} from '../../src/core/work-item-lifecycle.js';

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