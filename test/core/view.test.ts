import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { deriveViewBoard, type ViewBoardModel } from '../../src/core/view/model.js';
import { createViewerState, keyboardCommand, reduceViewerState } from '../../src/core/view/commands.js';

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))));

const commandModel: ViewBoardModel = {
  version: 4,
  project: { name: 'command-project' },
  summary: { openIdeas: 0, completedTasks: 0, totalTasks: 12, lanes: { proposed: 0, enforcement: 0, 'ready-to-apply': 12, implementing: 0, reviewing: 0, archived: 0 } },
  lanes: {
    ideas: [], proposed: [], enforcement: [],
    'ready-to-apply': Array.from({ length: 12 }, (_, index) => ({
      kind: 'change' as const, id: `ready-${index}`, title: `Ready ${index}`, created: null,
      artifacts: { completed: 3, total: 3 }, tasks: { completed: index, total: 12 }, lifecycle: 'ready-to-apply' as const,
    })),
    implementing: [], reviewing: [], archived: [],
  },
  diagnostics: [],
};

describe('viewer command feedback', () => {
  it('pages within the focused lane and reports boundaries or empty lanes', () => {
    let state = createViewerState(commandModel);
    state = reduceViewerState(state, { type: 'select-pane', pane: 'ready-to-apply' }, commandModel);
    state = reduceViewerState(state, keyboardCommand({ name: 'up' })!, commandModel);
    expect(state.selected['ready-to-apply']).toBe(0);
    expect(state.announcement).toContain('Start of Ready to Apply');
    state = reduceViewerState(state, keyboardCommand({ name: 'pagedown' })!, commandModel);
    expect(state.pane).toBe('ready-to-apply');
    expect(state.selected['ready-to-apply']).toBe(10);
    expect(state.announcement).toBe('Ready to Apply: item 11 of 12.');

    state = reduceViewerState(state, keyboardCommand({ name: 'pagedown' })!, commandModel);
    expect(state.selected['ready-to-apply']).toBe(11);
    state = reduceViewerState(state, keyboardCommand({ name: 'pagedown' })!, commandModel);
    expect(state.selected['ready-to-apply']).toBe(11);
    expect(state.announcement).toContain('End of Ready to Apply');

    state = reduceViewerState(state, { type: 'select-pane', pane: 'proposed' }, commandModel);
    state = reduceViewerState(state, keyboardCommand({ name: 'down' })!, commandModel);
    expect(state.announcement).toContain('Proposed has no items');
  });

  it('uses one close convention for help and details while preserving selection', () => {
    let state = createViewerState(commandModel);
    state = reduceViewerState(state, { type: 'select-pane', pane: 'ready-to-apply' }, commandModel);
    state = reduceViewerState(state, { type: 'select-item', pane: 'ready-to-apply', index: 3 }, commandModel);
    state = reduceViewerState(state, keyboardCommand({ name: '?' })!, commandModel);
    expect(state.overlay).toBe('help');
    state = reduceViewerState(state, keyboardCommand({ name: 'escape' })!, commandModel);
    expect(state.overlay).toBeNull();
    expect(state.selected['ready-to-apply']).toBe(3);
    state = reduceViewerState(state, keyboardCommand({ name: 'enter' })!, commandModel);
    expect(state.detail).toEqual({ pane: 'ready-to-apply', index: 3 });
    state = reduceViewerState(state, keyboardCommand({ name: 'escape' })!, commandModel);
    expect(state.detail).toBeNull();
    expect(state.selected['ready-to-apply']).toBe(3);
  });
});

describe('legacy tracked-task view coverage', () => {
  it('keeps every on-disk change active and orders by aggregated tracked-task progress', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-view-tracked-'));
    roots.push(root);
    const store = path.join(root, 'specbase');
    const schema = path.join(store, 'schemas', 'glob-tasks');
    await fs.mkdir(schema, { recursive: true });
    await fs.writeFile(path.join(schema, 'schema.yaml'), [
      'name: glob-tasks', 'version: 1', 'artifacts:',
      '  - id: tasks', '    generates: "**/tasks.md"', '    description: Nested tasks', '    template: tasks.md', '    requires: []',
      'apply:', '  requires: [tasks]', '  tracks: "**/tasks.md"', '',
    ].join('\n'));
    const changes = path.join(store, 'changes');
    await fs.mkdir(path.join(changes, 'archive'), { recursive: true });
    await fs.mkdir(path.join(changes, 'empty'), { recursive: true });
    const nested = path.join(changes, 'nested');
    await fs.mkdir(path.join(nested, 'one'), { recursive: true });
    await fs.mkdir(path.join(nested, 'two'), { recursive: true });
    await fs.writeFile(path.join(nested, '.openspec.yaml'), 'schema: glob-tasks\nid: nested-id\n');
    await fs.writeFile(path.join(nested, 'one', 'tasks.md'), '- [x] a\n- [ ] b\n');
    await fs.writeFile(path.join(nested, 'two', 'tasks.md'), '- [x] c\n');

    const model = await deriveViewBoard(root);
    // `empty` has no tasks artifact -> proposed; `nested-id` has the tasks artifact
    // present and its apply gate met, so its derived lifecycle is ready-to-apply.
    expect(model.lanes.proposed.map((card) => card.id)).toEqual(['empty']);
    expect(model.lanes['ready-to-apply'].map((card) => card.id)).toEqual(['nested-id']);
    expect(model.lanes['ready-to-apply'][0].tasks).toEqual({ completed: 2, total: 3 });
    expect(model.summary).toMatchObject({ completedTasks: 2, totalTasks: 3 });
    expect(model.summary.lanes).toEqual({ proposed: 1, enforcement: 0, 'ready-to-apply': 1, implementing: 0, reviewing: 0, archived: 0 });
  });
});
