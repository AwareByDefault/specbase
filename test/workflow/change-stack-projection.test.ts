import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

function project(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stack-workflow-'));
  fs.mkdirSync(path.join(root, 'specbase', 'changes', 'archive'), { recursive: true });
  fs.mkdirSync(path.join(root, 'specbase', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'specbase', 'config.yaml'), 'schema: spec-driven-governed\n');
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.writeFileSync(path.join(root, 'test', 'evidence.test.ts'), 'export {};\n');
  return root;
}
function change(root: string, id: string, operation: 'ADDED' | 'MODIFIED'): void {
  const dir = path.join(root, 'specbase', 'changes', id);
  const pair = path.join(dir, 'specs', 'behavior', 'chain');
  fs.mkdirSync(pair, { recursive: true });
  fs.writeFileSync(path.join(dir, '.openspec.yaml'), `schema: spec-driven-governed\nid: ${id}\n`);
  fs.writeFileSync(path.join(dir, 'proposal.md'), '## Why\nDelivery\n');
  fs.writeFileSync(path.join(dir, 'tasks.md'), '- [ ] implement\n');
  fs.writeFileSync(path.join(pair, 'spec.md'), `---\nid: behavior.chain\n---\n\n## ${operation} Requirements\n\n### Requirement: Chain truth\n**ID:** chain-truth\nThe system SHALL expose chain truth.\n\n#### Scenario: Visible\n**ID:** visible\n- **WHEN** used\n- **THEN** truth is visible\n`);
  fs.writeFileSync(path.join(pair, 'enforcement.yaml'), 'bindings:\n  chain:\n    type: test\n    covers: chain-truth\n    source: test/evidence.test.ts\n');
}

describe('stack-aware workflow output', () => {
  it('validates downstream changes against predecessor-projected truth and reports context in status/instructions', async () => {
    const root = project();
    change(root, 'slice-one', 'ADDED');
    change(root, 'slice-two', 'MODIFIED');
    expect((await runCLI(['stack', 'create', 'delivery', '--summary', 'Delivery', '--member', 'slice-one', '--member', 'slice-two', '--json'], { cwd: root })).exitCode).toBe(0);
    const validation = await runCLI(['stack', 'validate', 'delivery', '--json'], { cwd: root });
    expect(validation.exitCode).toBe(0);
    expect(JSON.parse(validation.stdout).stack.projection.steps.map((step: { status: string }) => step.status)).toEqual(['valid', 'valid']);

    const status = JSON.parse((await runCLI(['status', '--change', 'slice-two', '--json'], { cwd: root })).stdout);
    expect(status.stack).toMatchObject({ id: 'delivery', position: 2, archiveEligible: false, requiredPredecessor: 'slice-one' });
    const instructions = JSON.parse((await runCLI(['instructions', 'apply', '--change', 'slice-two', '--json'], { cwd: root })).stdout);
    expect(instructions.stack.predecessors[0]).toMatchObject({ id: 'slice-one', projection: 'valid' });
    expect(instructions.stack.projectedBase.predecessors[0]).toMatchObject({ member: 'slice-one', model: 'governed' });
    expect(instructions.stack.projectedBase.predecessors[0].specPath).toContain(path.join('slice-one', 'specs'));
    expect(instructions.stack.projectedResult.pairs[0]).toMatchObject({ locator: 'behavior/chain' });
    expect(JSON.stringify(instructions.stack)).not.toContain('specbase-stack-project-');
    expect(instructions.stack.blockedBy).toBeNull();
  });

  it('reports the first invalid prefix and blocks every downstream member', async () => {
    const root = project();
    change(root, 'bad-first', 'MODIFIED');
    change(root, 'later-second', 'ADDED');
    const thirdDir = path.join(root, 'specbase', 'ideas', 'planned-third');
    fs.mkdirSync(thirdDir, { recursive: true });
    fs.writeFileSync(path.join(thirdDir, '.openspec.yaml'), 'id: planned-third\nsummary: Third\ncreated: 2026-01-01\n');
    expect((await runCLI(['stack', 'create', 'broken-delivery', '--summary', 'Broken', '--member', 'bad-first', '--member', 'later-second', '--member', 'planned-third', '--json'], { cwd: root })).exitCode).toBe(0);
    const validation = await runCLI(['stack', 'validate', 'broken-delivery', '--json'], { cwd: root });
    expect(validation.exitCode).toBe(1);
    const projection = JSON.parse(validation.stdout).stack.projection;
    expect(projection.firstInvalidMember).toBe('bad-first');
    expect(projection.steps.map((step: { status: string }) => step.status)).toEqual(['invalid', 'blocked', 'blocked']);
    expect(projection.steps[1].blockedBy).toBe('bad-first');
  });

  it('resolves status and instructions membership by immutable id after a directory rename', async () => {
    const root = project();
    change(root, 'stable-one', 'ADDED');
    change(root, 'stable-two', 'MODIFIED');
    expect((await runCLI(['stack', 'create', 'renamed-delivery', '--summary', 'Renamed', '--member', 'stable-one', '--member', 'stable-two', '--json'], { cwd: root })).exitCode).toBe(0);
    fs.renameSync(path.join(root, 'specbase', 'changes', 'stable-two'), path.join(root, 'specbase', 'changes', 'renamed-two'));
    const status = JSON.parse((await runCLI(['status', '--change', 'renamed-two', '--json'], { cwd: root })).stdout);
    expect(status.stack).toMatchObject({ id: 'renamed-delivery', member: 'stable-two', position: 2, requiredPredecessor: 'stable-one' });
    const instructions = JSON.parse((await runCLI(['instructions', 'apply', '--change', 'renamed-two', '--json'], { cwd: root })).stdout);
    expect(instructions.stack).toMatchObject({ member: 'stable-two', requiredPredecessor: 'stable-one' });
  });
});
