import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { deriveViewBoard } from '../../../src/core/view/model.js';
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

    const model = await deriveViewBoard(root);
    expect(model.version).toBe(3);
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
      lifecycleState: () => 'ready-to-apply',
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
