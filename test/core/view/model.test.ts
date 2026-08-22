import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  KANBAN_BOARD_VERSION,
  deriveKanbanBoard,
  deriveViewBoard,
  type LifecycleSnapshotResult,
} from '../../../src/core/view/model.js';
import { renderViewJson, renderViewPlain } from '../../../src/core/view/projections.js';

const roots: string[] = [];
async function project(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-view-model-'));
  roots.push(root);
  await fs.mkdir(path.join(root, 'specbase', 'ideas'), { recursive: true });
  await fs.mkdir(path.join(root, 'specbase', 'changes', 'archive'), { recursive: true });
  await fs.mkdir(path.join(root, 'specbase', 'specs'), { recursive: true });
  return root;
}
async function write(root: string, relative: string, content: string): Promise<void> {
  const file = path.join(root, ...relative.split('/'));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}
afterEach(async () => Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))));

describe('versioned lifecycle board model', () => {
  it('derives lifecycle membership, stable ids, progress, summaries, and deterministic ordering', async () => {
    const root = await project();
    await write(root, 'specbase/ideas/newer/.openspec.yaml', 'id: idea-b\nsummary: Newer\ncreated: 2025-02-02\n');
    await write(root, 'specbase/ideas/older/.openspec.yaml', 'id: idea-a\nsummary: Older\ncreated: 2025-01-01\n');
    await write(root, 'specbase/changes/high/.openspec.yaml', 'schema: missing\nid: change-z\ncreated: 2025-01-01\n');
    await write(root, 'specbase/changes/high/tasks.md', '- [x] a\n- [ ] b\n');
    await write(root, 'specbase/changes/high/proposal.md', '# Proposal\n');
    await write(root, 'specbase/changes/zero/.openspec.yaml', 'schema: missing\nid: change-a\n');
    await write(root, 'specbase/changes/done/.openspec.yaml', 'schema: missing\nid: change-done\n');
    await write(root, 'specbase/changes/done/tasks.md', '- [x] remains active until archive\n');
    await write(root, 'specbase/changes/done/proposal.md', '# Done proposal\n');
    await write(root, 'specbase/changes/partial/.openspec.yaml', 'schema: missing\nid: change-partial\n');
    await write(root, 'specbase/changes/partial/tasks.md', '- [x] a\n- [ ] b\n- [ ] c\n');
    await write(root, 'specbase/changes/archive/2025-01-01-old/.openspec.yaml', 'schema: missing\nid: archive-a\n');
    await write(root, 'specbase/changes/archive/2025-03-01-new/.openspec.yaml', 'schema: missing\nid: archive-z\n');
    await write(root, 'specbase/specs/behavior/heavy/spec.md', '---\nid: behavior.heavy\n---\n### Requirement: One\n**ID:** one\nText.\n### Requirement: Two\n**ID:** two\nText.\n');
    await write(root, 'specbase/specs/behavior/light/spec.md', '---\nid: behavior.light\n---\n### Requirement: One\n**ID:** one\nText.\n');

    const lifecycleSnapshot = (_root: string, id: string): LifecycleSnapshotResult => ({
      version: 1,
      snapshot: {
        id,
        position: id.startsWith('archive-') ? 'archived' : 'active',
        lifecycle: id.startsWith('archive-') ? 'archived' : 'proposed',
        artifacts: { complete: id === 'change-a' ? 0 : 1, total: 3 },
        tasks: id === 'change-a' ? { complete: 0, total: 0 } : id === 'change-partial' || id === 'change-z' ? { complete: 1, total: id === 'change-partial' ? 3 : 2 } : { complete: 1, total: 1 },
      },
      diagnostics: [],
    });
    const model = await deriveViewBoard(root, {
      readDir: (dir) => fs.readdir(dir, { withFileTypes: true }),
      readFile: (file) => fs.readFile(file, 'utf8'),
      lifecycleSnapshot,
    });
    expect(model.version).toBe(KANBAN_BOARD_VERSION);
    expect(model.project.name).toBe(path.basename(root));
    expect(model.lanes.ideas.map((card) => card.id)).toEqual(['idea-a', 'idea-b']);
    // Every fixture change uses a missing schema, so each resolves to a derived
    // `proposed` lifecycle and lands in the proposed lane (ordered by progress then ID).
    expect(model.lanes.proposed.map((card) => card.id)).toEqual(['change-a', 'change-partial', 'change-z', 'change-done']);
    expect(model.lanes.proposed.find((card) => card.id === 'change-done')?.tasks).toEqual({ completed: 1, total: 1 });
    expect(model.lanes.proposed.find((card) => card.id === 'change-partial')?.tasks).toEqual({ completed: 1, total: 3 });
    expect(model.lanes.proposed.find((card) => card.id === 'change-partial')?.artifacts).toBeDefined();
    expect(model.lanes.proposed.find((card) => card.id === 'change-z')?.artifacts).toBeDefined();
    expect(model.lanes.proposed.find((card) => card.id === 'change-a')?.artifacts).toBeDefined();
    expect(model.lanes.archived.map((card) => card.id)).toEqual(['archive-z', 'archive-a']);
    expect(model.specs.map((spec) => spec.id)).toEqual(['behavior.heavy', 'behavior.light']);
    expect(model.specs[0].requirements).toEqual(['One', 'Two']);
    expect(model.summary).toMatchObject({ acceptedSpecs: 2, requirements: 3, openIdeas: 2, completedTasks: 3, totalTasks: 6 });
    expect(model.summary.lanes).toEqual({ proposed: 4, enforcement: 0, 'ready-to-apply': 0, implementing: 0, reviewing: 0, archived: 2 });
    expect(JSON.parse(renderViewJson(model))).toEqual(model);
    expect(renderViewPlain(model)).not.toMatch(/\u001b\[/);
    expect(renderViewPlain(model)).toBe(renderViewPlain(model));

    // Zero-task change has artifact progress
    expect(model.lanes.proposed.find((c) => c.id === 'change-a')?.tasks).toEqual({ completed: 0, total: 0 });
    expect(model.lanes.proposed.find((c) => c.id === 'change-a')?.artifacts).toBeDefined();

    // Equal-progress changes are ordered by ID ascending
    const zeroTask = model.lanes.proposed.filter((c) => c.tasks.total === 0);
    expect(zeroTask.length).toBe(1);
    expect(zeroTask[0].id).toBe('change-a');
  });

  it('composes active and archived cards from the lifecycle resolver without duplicating lifecycle facts', async () => {
    const root = await project();
    await write(root, 'specbase/changes/active/.openspec.yaml', 'id: immutable-active\ngoal: Active\ncreated: 2025-01-01\n');
    await write(root, 'specbase/changes/archive/2025-02-03-archive/.openspec.yaml', 'id: immutable-archive\ngoal: Archive\n');
    const calls: string[] = [];
    const model = await deriveViewBoard(root, {
      readDir: (dir) => fs.readdir(dir, { withFileTypes: true }),
      readFile: (file) => fs.readFile(file, 'utf8'),
      lifecycleSnapshot: (_root, id) => {
        calls.push(id);
        const archived = id === 'immutable-archive';
        return {
          version: 1,
          snapshot: {
            id,
            position: archived ? 'archived' : 'active',
            lifecycle: archived ? 'archived' : 'implementing',
            artifacts: { complete: archived ? 4 : 2, total: 4 },
            tasks: { complete: archived ? 5 : 1, total: 5 },
          },
          diagnostics: archived ? [{ code: 'lifecycle_snapshot_unresolved', id, message: 'Archived diagnostic', remediation: 'Restore it.' }] : [],
        };
      },
    });
    expect(calls.sort()).toEqual(['immutable-active', 'immutable-archive']);
    expect(model.lanes.implementing[0]).toMatchObject({ id: 'immutable-active', position: 'active', lifecycle: 'implementing', artifacts: { completed: 2, total: 4 }, tasks: { completed: 1, total: 5 } });
    expect(model.lanes.archived[0]).toMatchObject({ id: 'immutable-archive', position: 'archived', lifecycle: 'archived', artifacts: { completed: 4, total: 4 }, tasks: { completed: 5, total: 5 } });
    expect(model.lanes.archived[0].diagnostics).toEqual([expect.objectContaining({ code: 'lifecycle_snapshot_unresolved', remediation: 'Restore it.' })]);
    expect(model.diagnostics).toEqual([expect.objectContaining({ code: 'lifecycle_snapshot_unresolved', source: path.join('specbase', 'changes', 'archive', '2025-02-03-archive') })]);
  });

  it('derives the public headless snapshot without terminal imports', async () => {
    const root = await project();
    await write(root, 'specbase/changes/active/.openspec.yaml', 'schema: spec-driven\nid: public-active\n');
    await write(root, 'specbase/changes/active/tasks.md', '- [x] done\n');
    const board = await deriveKanbanBoard(root);
    expect(board.version).toBe(KANBAN_BOARD_VERSION);
    expect(board.lanes.implementing[0]).toMatchObject({ id: 'public-active', position: 'active' });
  });

  it('derives the v4 work-only board with canonical stack context', async () => {
    const root = await project();
    await write(root, 'specbase/ideas/stacked/.openspec.yaml', 'id: stacked-idea\nsummary: Stacked idea\ncreated: 2025-01-01\n');
    await write(root, 'specbase/ideas/loose/.openspec.yaml', 'id: loose-idea\nsummary: Loose idea\ncreated: 2025-01-02\n');
    await write(root, 'specbase/changes/stacked/.openspec.yaml', 'id: stacked-change\n');
    await write(root, 'specbase/changes/loose/.openspec.yaml', 'id: loose-change\n');
    await write(root, 'specbase/changes/archive/2025-01-03-stacked/.openspec.yaml', 'id: stacked-archive\n');
    await write(root, 'specbase/specs/behavior/accepted/spec.md', '---\nid: behavior.accepted\n---\n### Requirement: Accepted\n**ID:** accepted\nText.\n');
    await write(root, 'specbase/stacks/delivery/.openspec.yaml', 'id: delivery\nsummary: Delivery\ncreated: 2025-01-01\nmembers:\n  - stacked-idea\n  - stacked-change\n  - stacked-archive\n');

    const model = await deriveViewBoard(root, {
      readDir: (dir) => fs.readdir(dir, { withFileTypes: true }),
      readFile: (file) => fs.readFile(file, 'utf8'),
      lifecycleSnapshot: (_root, id) => ({
        version: 1,
        snapshot: {
          id,
          position: id === 'stacked-archive' ? 'archived' : 'active',
          lifecycle: id === 'stacked-archive' ? 'archived' : 'implementing',
          artifacts: { complete: 0, total: 1 },
          tasks: { complete: 0, total: 1 },
        },
        diagnostics: [],
      }),
    });
    // v3 types deliberately remain in production during this RED stage.
    const board = model as unknown as Record<string, unknown>;
    const summary = board.summary as Record<string, unknown>;
    const lanes = board.lanes as Record<string, unknown[]>;
    const cards = Object.values(lanes).flat() as Array<Record<string, unknown>>;
    const card = (id: string) => cards.find((entry) => entry.id === id)!;

    expect({
      version: board.version,
      hasSpecs: Object.hasOwn(board, 'specs'),
      hasAcceptedSpecs: Object.hasOwn(summary, 'acceptedSpecs'),
      hasRequirements: Object.hasOwn(summary, 'requirements'),
      stacks: ['stacked-idea', 'stacked-change', 'stacked-archive'].map((id) => ({ id, stack: card(id).stack })),
      unstacked: ['loose-idea', 'loose-change'].map((id) => ({ id, hasStack: Object.hasOwn(card(id), 'stack') })),
    }).toEqual({
      version: 4,
      hasSpecs: false,
      hasAcceptedSpecs: false,
      hasRequirements: false,
      stacks: [
        { id: 'stacked-idea', stack: { id: 'delivery', position: 1, total: 3 } },
        { id: 'stacked-change', stack: { id: 'delivery', position: 2, total: 3 } },
        { id: 'stacked-archive', stack: { id: 'delivery', position: 3, total: 3 } },
      ],
      unstacked: [
        { id: 'loose-idea', hasStack: false },
        { id: 'loose-change', hasStack: false },
      ],
    });
  });

  it('omits unreadable lifecycle entries, retains readable unparseable specs, and reports diagnostics', async () => {
    const root = await project();
    await write(root, 'specbase/ideas/bad/.openspec.yaml', '[invalid');
    await write(root, 'specbase/ideas/good/.openspec.yaml', 'id: good-id\nsummary: Good\ncreated: 2025-01-01\n');
    await write(root, 'specbase/specs/behavior/broken/spec.md', 'readable but not a governed specification');
    const model = await deriveViewBoard(root);
    expect(model.lanes.ideas.map((card) => card.id)).toEqual(['good-id']);
    expect(model.specs[0]).toMatchObject({ locator: 'behavior/broken', requirementCount: 0 });
    expect(model.specs[0].diagnostic).toBeTruthy();
    expect(model.diagnostics.some((item) => item.source.includes('ideas'))).toBe(true);
    expect(model.diagnostics.some((item) => item.source.includes(path.join('specs', 'behavior', 'broken', 'spec.md')))).toBe(true);
  });

  it('reports non-optional section read failures instead of presenting a confident empty lane', async () => {
    const root = await project();
    const ideasDir = path.join(root, 'specbase', 'ideas');
    const model = await deriveViewBoard(root, {
      readDir: async (dir) => {
        if (dir === ideasDir) throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
        return fs.readdir(dir, { withFileTypes: true });
      },
      readFile: (file) => fs.readFile(file, 'utf8'),
    });
    expect(model.lanes.ideas).toEqual([]);
    expect(model.diagnostics).toContainEqual(expect.objectContaining({
      source: path.relative(root, ideasDir),
      message: expect.stringContaining('permission denied'),
    }));
  });

  it('reports specification subtree read failures while retaining readable siblings', async () => {
    const root = await project();
    await write(root, 'specbase/specs/behavior/good/spec.md', '---\nid: behavior.good\n---\n### Requirement: Good\n**ID:** good\nText.\n');
    await fs.mkdir(path.join(root, 'specbase', 'specs', 'behavior', 'blocked'), { recursive: true });
    const blocked = path.join(root, 'specbase', 'specs', 'behavior', 'blocked');
    const model = await deriveViewBoard(root, {
      readDir: async (dir) => {
        if (dir === blocked) throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
        return fs.readdir(dir, { withFileTypes: true });
      },
      readFile: (file) => fs.readFile(file, 'utf8'),
    });
    expect(model.specs.map((spec) => spec.id)).toEqual(['behavior.good']);
    expect(model.diagnostics).toContainEqual(expect.objectContaining({
      source: path.relative(root, blocked),
      message: expect.stringContaining('permission denied'),
    }));
  });

  it('derives lifecycle through the injected model boundary when provided', async () => {
    const root = await project();
    await write(root, 'specbase/changes/injected/.openspec.yaml', 'schema: missing\nid: injected-change\n');
    const model = await deriveViewBoard(root, {
      readDir: (dir) => fs.readdir(dir, { withFileTypes: true }),
      readFile: (file) => fs.readFile(file, 'utf8'),
      lifecycleSnapshot: (_root, id) => ({
        version: 1,
        snapshot: { id, position: 'active', lifecycle: 'ready-to-apply', artifacts: { complete: 3, total: 3 }, tasks: { complete: 0, total: 0 } },
        diagnostics: [],
      }),
    });
    expect(model.lanes['ready-to-apply'].map((card) => card.id)).toEqual(['injected-change']);
    expect(model.lanes.proposed).toEqual([]);
  });

  it('reports an all-zero empty summary', async () => {
    const model = await deriveViewBoard(await project());
    expect(model.summary.acceptedSpecs).toBe(0);
    expect(model.summary.requirements).toBe(0);
    expect(model.summary.openIdeas).toBe(0);
    expect(model.summary.completedTasks).toBe(0);
    expect(model.summary.totalTasks).toBe(0);
    expect(Object.values(model.summary.lanes).every((value) => value === 0)).toBe(true);
  });
});
