import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { deriveViewBoard } from '../../src/core/view/model.js';

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))));

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
    expect(model.columns.changes.map((card) => card.id)).toEqual(['empty', 'nested-id']);
    expect(model.columns.changes[1].tasks).toEqual({ completed: 2, total: 3 });
    expect(model.summary).toMatchObject({ activeChanges: 2, completedTasks: 2, totalTasks: 3 });
  });
});
