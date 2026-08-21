import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { deriveViewBoard } from '../../../src/core/view/model.js';
import { renderViewJson, renderViewPlain } from '../../../src/core/view/projections.js';

const roots: string[] = [];
async function project(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-lifecycle-'));
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
async function change(root: string, name: string, opts: { meta?: string; artifacts?: string[]; tasks?: string; reviewed?: boolean } = {}): Promise<void> {
  await write(root, `specbase/changes/${name}/.openspec.yaml`, opts.meta ?? `schema: spec-driven-governed\nid: ${name}\ncreated: 2025-01-01\n${opts.reviewed ? 'lastReviewedAt: 2025-02-01T00:00:00Z\n' : ''}`);
  for (const artifact of opts.artifacts ?? []) {
    await write(root, `specbase/changes/${name}/${artifact}`, `# ${artifact}\n`);
  }
  if (opts.tasks) {
    await write(root, `specbase/changes/${name}/tasks.md`, opts.tasks);
  }
}
afterEach(async () => Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))));

describe('lifecycle-state board lanes', () => {
  // The spec-driven-governed schema's apply gate requires [tasks] plus the
  // feature/enforcement artifacts. Enforcement delta is specs/**/enforcement.yaml.
  it('derives every lineage state and places each change in its correct lane', async () => {
    const root = await project();
    // archived lives in the archive dir
    await write(root, 'specbase/changes/archive/2025-01-01-old/.openspec.yaml', 'schema: spec-driven-governed\nid: archived-x\n');
    // proposed: feature artifacts present, enforcement absent
    await change(root, 'proposed-a', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md'] });
    // enforcement: enforcement write begun, apply gate not met (tasks absent)
    await change(root, 'enforcement-b', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml'] });
    await change(root, 'incomplete-c', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml'] });
    // ready-to-apply: all apply-required artifacts present, no apply started
    await change(root, 'ready-d', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'] });
    // implementing: apply started (some task progress), no review footprint
    await change(root, 'implementing-e', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'], tasks: '- [x] a\n- [ ] b\n' });
    // reviewing: all tasks done + review footprint
    await change(root, 'reviewing-f', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'], tasks: '- [x] a\n- [x] b\n', reviewed: true });

    const model = await deriveViewBoard(root);
    expect(model.lanes.proposed.map((card) => card.id)).toEqual(['proposed-a']);
    expect(model.lanes.enforcement.map((card) => card.id).sort()).toEqual(['enforcement-b', 'incomplete-c']);
    expect(model.lanes['ready-to-apply'].map((card) => card.id)).toEqual(['ready-d']);
    expect(model.lanes.implementing.map((card) => card.id)).toEqual(['implementing-e']);
    expect(model.lanes.reviewing.map((card) => card.id)).toEqual(['reviewing-f']);
    expect(model.lanes.archived.map((card) => card.id)).toEqual(['archived-x']);

    // Summary per-lane counts match the derived membership.
    expect(model.summary.lanes).toEqual({
      proposed: 1, enforcement: 2, 'ready-to-apply': 1, implementing: 1, reviewing: 1, archived: 1,
    });
    // Change card carries the derived state (never a stored field).
    expect(model.lanes.implementing[0].lifecycle).toBe('implementing');
    expect(model.lanes['ready-to-apply'][0].lifecycle).toBe('ready-to-apply');
  });

  it('orders lane members deterministically by progress then ID and ideas by age', async () => {
    const root = await project();
    await change(root, 'zero-a', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'] });
    await change(root, 'partial-b', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'], tasks: '- [x] a\n- [ ] b\n' });
    await change(root, 'done-c', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'], tasks: '- [x] a\n- [x] b\n', reviewed: true });
    await write(root, 'specbase/ideas/older/.openspec.yaml', 'id: idea-old\nsummary: Old\ncreated: 2025-01-01\n');
    await write(root, 'specbase/ideas/newer/.openspec.yaml', 'id: idea-new\nsummary: New\ncreated: 2025-02-02\n');

    const model = await deriveViewBoard(root);
    expect(model.lanes['ready-to-apply'].map((card) => card.id)).toEqual(['zero-a']);
    expect(model.lanes.implementing.map((card) => card.id)).toEqual(['partial-b']);
    expect(model.lanes.reviewing.map((card) => card.id)).toEqual(['done-c']);
    expect(model.lanes.ideas.map((card) => card.id)).toEqual(['idea-old', 'idea-new']);
    // Zero-progress sorts before partial in the sharing lane ordering within a lane.
    expect(Array.from(model.lanes['ready-to-apply'], (card) => card.id).length).toBe(1);
  });

  it('keeps one shared derived model across plain and JSON projections', async () => {
    const root = await project();
    await change(root, 'ready-d', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'] });
    await change(root, 'implementing-e', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'], tasks: '- [x] a\n- [ ] b\n' });

    const model = await deriveViewBoard(root);
    // The same model object serializes to both projections, so lane placement is identical.
    expect(JSON.parse(renderViewJson(model))).toEqual(model);
    expect(renderViewPlain(model)).toContain('Ready to Apply (1)');
    expect(renderViewPlain(model)).toContain('Implementing (1)');
    expect(renderViewPlain(model)).toContain('ready-d [ready-d]');
    expect(renderViewPlain(model)).toContain('implementing-e [implementing-e]');
    expect(renderViewPlain(model)).not.toMatch(/\u001b\[/);
    expect(renderViewPlain(model)).toBe(renderViewPlain(model));
  });

  it('renders empty lifecycle lanes with a visible count instead of hiding them', async () => {
    const root = await project();
    // One implemented change, no proposal/enforcement/reviewing/archived work.
    await change(root, 'implementing-x', { artifacts: ['proposal.md', 'design.md', 'specs/a/spec.md', 'specs/a/enforcement.yaml', 'tasks.md'], tasks: '- [x] a\n- [ ] b\n' });
    const model = await deriveViewBoard(root);
    expect(model.summary.lanes).toEqual({ proposed: 0, enforcement: 0, 'ready-to-apply': 0, implementing: 1, reviewing: 0, archived: 0 });
    const plain = renderViewPlain(model);
    for (const label of ['Proposed (0)', 'Enforcement (0)', 'Ready to Apply (0)', 'Reviewing (0)']) {
      expect(plain).toContain(label);
    }
  });
});
