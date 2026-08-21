import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createStack, projectStack } from '../../../src/core/change-stacks/index.js';

const roots: string[] = [];
async function project(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'stack-projection-'));
  roots.push(root);
  await fs.mkdir(path.join(root, 'specbase', 'changes', 'archive'), { recursive: true });
  await fs.mkdir(path.join(root, 'specbase', 'specs'), { recursive: true });
  await fs.writeFile(path.join(root, 'specbase', 'config.yaml'), 'schema: spec-driven-governed\n');
  await fs.mkdir(path.join(root, 'test'), { recursive: true });
  await fs.writeFile(path.join(root, 'test', 'evidence.test.ts'), 'export {};\n');
  return root;
}
async function change(root: string, id: string, section: 'ADDED' | 'MODIFIED', title: string): Promise<void> {
  const dir = path.join(root, 'specbase', 'changes', id);
  const pair = path.join(dir, 'specs', 'behavior', 'stack-chain');
  await fs.mkdir(pair, { recursive: true });
  await fs.writeFile(path.join(dir, '.openspec.yaml'), `schema: spec-driven-governed\nid: ${id}\n`);
  await fs.writeFile(path.join(pair, 'spec.md'), `---\nid: behavior.stack-chain\n---\n\n## ${section} Requirements\n\n### Requirement: ${title}\n**ID:** chain-truth\nThe system SHALL expose ${title.toLowerCase()}.\n\n#### Scenario: Observable\n**ID:** observable\n- **WHEN** the slice is used\n- **THEN** ${title.toLowerCase()} is observable\n`);
  await fs.writeFile(path.join(pair, 'enforcement.yaml'), `bindings:\n  chain-test:\n    type: test\n    covers: chain-truth\n    source: test/evidence.test.ts\n`);
}
async function archived(root: string, id: string): Promise<void> {
  const dir = path.join(root, 'specbase', 'changes', 'archive', `2026-01-01-${id}`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, '.openspec.yaml'), `schema: spec-driven-governed\nid: ${id}\n`);
}
afterEach(async () => Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))));

describe('stack projection', () => {
  it('folds active deltas once in order so a downstream member modifies predecessor-added truth', async () => {
    const root = await project();
    await change(root, 'first-slice', 'ADDED', 'First truth');
    await change(root, 'second-slice', 'MODIFIED', 'Refined truth');
    await createStack(root, { id: 'chain', summary: 'Chain', members: ['first-slice', 'second-slice'] });
    const result = await projectStack(root, 'chain');
    expect(result.valid).toBe(true);
    expect(result.steps.map((step) => step.status)).toEqual(['valid', 'valid']);
    expect(result.steps[0].result?.pairs[0].operations.added).toBe(1);
    const downstreamOps = result.steps[1].result?.pairs[0].operations;
    expect((downstreamOps?.modified ?? 0) + (downstreamOps?.renamed ?? 0)).toBe(1);
    expect(result.steps[1].base.predecessors[0]).toMatchObject({ member: 'first-slice', model: 'governed' });
    expect(result.steps[1].base.predecessors[0].specPath).toContain(path.join('first-slice', 'specs'));
    expect(JSON.stringify(result)).not.toContain('specbase-stack-project-');
    expect(await fs.readdir(path.join(root, 'specbase', 'specs'))).toEqual([]);
  });

  it('skips archived predecessors and stops at the first invalid prefix, blocking later members', async () => {
    const root = await project();
    await archived(root, 'already-shipped');
    await change(root, 'bad-slice', 'MODIFIED', 'Missing base');
    await change(root, 'later-slice', 'ADDED', 'Later truth');
    await createStack(root, { id: 'broken-chain', summary: 'Broken', members: ['already-shipped', 'bad-slice', 'later-slice'] });
    const result = await projectStack(root, 'broken-chain');
    expect(result.valid).toBe(false);
    expect(result.firstInvalidMember).toBe('bad-slice');
    expect(result.steps.map((step) => step.status)).toEqual(['skipped-archived', 'invalid', 'blocked']);
    expect(result.steps[1].result?.diagnostics.length).toBeGreaterThan(0);
  });

  it('treats incomplete governed pairs atomically', async () => {
    const root = await project();
    await change(root, 'one-sided', 'ADDED', 'One sided');
    await fs.rm(path.join(root, 'specbase', 'changes', 'one-sided', 'specs', 'behavior', 'stack-chain', 'enforcement.yaml'));
    await change(root, 'later', 'ADDED', 'Later');
    await createStack(root, { id: 'atomic-chain', summary: 'Atomic', members: ['one-sided', 'later'] });
    const result = await projectStack(root, 'atomic-chain');
    expect(result.steps.map((step) => step.status)).toEqual(['invalid', 'blocked']);
    expect(result.steps[0].result?.diagnostics.join(' ')).toContain('missing enforcement.md');
  });

  it('folds legacy flat deltas with the same legacy archive transition', async () => {
    const root = await project();
    await fs.writeFile(path.join(root, 'specbase', 'config.yaml'), 'schema: spec-driven\n');
    for (const [id, section, title] of [
      ['legacy-one', 'ADDED', 'Legacy truth'],
      ['legacy-two', 'MODIFIED', 'Legacy truth'],
    ] as const) {
      const dir = path.join(root, 'specbase', 'changes', id);
      const specDir = path.join(dir, 'specs', 'legacy-chain');
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(path.join(dir, '.openspec.yaml'), `schema: spec-driven\nid: ${id}\n`);
      await fs.writeFile(path.join(specDir, 'spec.md'), `## ${section} Requirements\n\n### Requirement: ${title}\nThe system SHALL expose ${title.toLowerCase()}.\n\n#### Scenario: Visible\n- **WHEN** used\n- **THEN** it is visible\n`);
    }
    await createStack(root, { id: 'legacy-chain', summary: 'Legacy chain', members: ['legacy-one', 'legacy-two'] });
    const result = await projectStack(root, 'legacy-chain');
    expect(result.valid).toBe(true);
    expect(result.steps.map((step) => step.status)).toEqual(['valid', 'valid']);
    expect(result.steps.map((step) => step.result?.model)).toEqual(['legacy', 'legacy']);
    expect(result.steps[1].base.predecessors[0]).toMatchObject({ member: 'legacy-one', locator: 'legacy-chain', model: 'legacy' });
    expect(await fs.readdir(path.join(root, 'specbase', 'specs'))).toEqual([]);
  });

  it('reports a planned-only downstream chain as blocked and invalid', async () => {
    const root = await project();
    for (const id of ['planned-first', 'planned-second']) {
      const idea = path.join(root, 'specbase', 'ideas', id);
      await fs.mkdir(idea, { recursive: true });
      await fs.writeFile(path.join(idea, '.openspec.yaml'), `id: ${id}\nsummary: ${id}\ncreated: 2026-01-01\n`);
    }
    await createStack(root, { id: 'planned-only', summary: 'Planned only', members: ['planned-first', 'planned-second'] });
    const result = await projectStack(root, 'planned-only');
    expect(result.valid).toBe(false);
    expect(result.blockedByPlannedMember).toBe('planned-first');
    expect(result.steps.map((step) => step.status)).toEqual(['planned', 'blocked']);
  });

  it('blocks downstream projection when a planned predecessor has no delta', async () => {
    const root = await project();
    const idea = path.join(root, 'specbase', 'ideas', 'planned-first');
    await fs.mkdir(idea, { recursive: true });
    await fs.writeFile(path.join(idea, '.openspec.yaml'), 'id: planned-first\nsummary: Planned\ncreated: 2026-01-01\n');
    await change(root, 'active-second', 'ADDED', 'Second truth');
    await createStack(root, { id: 'planned-chain', summary: 'Planned chain', members: ['planned-first', 'active-second'] });
    const result = await projectStack(root, 'planned-chain');
    expect(result.valid).toBe(false);
    expect(result.firstInvalidMember).toBeNull();
    expect(result.blockedByPlannedMember).toBe('planned-first');
    expect(result.steps.map((step) => step.status)).toEqual(['planned', 'blocked']);
    expect(result.steps[1].blockedBy).toBe('planned-first');
  });
});
