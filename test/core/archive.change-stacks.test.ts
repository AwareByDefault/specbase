import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

function root(governed = false): string {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'stack-archive-'));
  fs.mkdirSync(path.join(project, 'specbase', 'changes', 'archive'), { recursive: true });
  fs.mkdirSync(path.join(project, 'specbase', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(project, 'specbase', 'config.yaml'), `schema: ${governed ? 'spec-driven-governed' : 'spec-driven'}\n`);
  return project;
}
function change(project: string, id: string, governed = false): void {
  const dir = path.join(project, 'specbase', 'changes', id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '.openspec.yaml'), `schema: ${governed ? 'spec-driven-governed' : 'spec-driven'}\nid: ${id}\n`);
  fs.writeFileSync(path.join(dir, 'tasks.md'), '- [x] complete\n');
}
async function stack(project: string, members: string[]): Promise<void> {
  const result = await runCLI(['stack', 'create', 'delivery', '--summary', 'Delivery', ...members.flatMap((id) => ['--member', id]), '--json'], { cwd: project });
  expect(result.exitCode).toBe(0);
}

describe('stack archive ordering', () => {
  it('rejects out-of-order archive atomically and names the required predecessor', async () => {
    const project = root();
    change(project, 'first'); change(project, 'second');
    await stack(project, ['first', 'second']);
    const before = fs.readdirSync(path.join(project, 'specbase', 'specs'));
    const result = await runCLI(['archive', 'second', '--yes', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).status[0]).toMatchObject({ code: 'archive_stack_predecessor_required' });
    expect(JSON.parse(result.stdout).status[0].message).toContain('first');
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'second'))).toBe(true);
    expect(fs.readdirSync(path.join(project, 'specbase', 'specs'))).toEqual(before);
  });

  it('archives the eligible prefix normally and inspection advances from archived position', async () => {
    const project = root();
    change(project, 'first'); change(project, 'second');
    const formerMarker = path.join(project, 'specbase', 'changes', 'first', '.specbase-archive-reservation');
    fs.writeFileSync(formerMarker, 'user-owned content\n');
    await stack(project, ['first', 'second']);
    const result = await runCLI(['archive', 'first', '--yes', '--json'], { cwd: project });
    expect(result.exitCode).toBe(0);
    const archivedPath = JSON.parse(result.stdout).archive.path;
    expect(fs.readFileSync(path.join(archivedPath, '.specbase-archive-reservation'), 'utf-8')).toBe('user-owned content\n');
    const show = JSON.parse((await runCLI(['stack', 'show', 'delivery', '--json'], { cwd: project })).stdout).stack;
    expect(show.members[0].position).toBe('archived');
    expect(show.firstUnfinishedMember).toBe('second');
  });

  it('rejects --skip-specs for stacked governed deltas while leaving the change active', async () => {
    const project = root(true);
    change(project, 'first', true); change(project, 'second', true);
    const pair = path.join(project, 'specbase', 'changes', 'first', 'specs', 'behavior', 'slice');
    fs.mkdirSync(pair, { recursive: true });
    fs.writeFileSync(path.join(pair, 'spec.md'), '---\nid: behavior.slice\n---\n\n## ADDED Requirements\n\n### Requirement: Slice\n**ID:** slice\nThe system SHALL expose a slice.\n\n#### Scenario: Visible\n**ID:** visible\n- **WHEN** used\n- **THEN** it is visible\n');
    fs.writeFileSync(path.join(pair, 'enforcement.yaml'), 'bindings: {}\n');
    await stack(project, ['first', 'second']);
    const result = await runCLI(['archive', 'first', '--yes', '--skip-specs', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).status[0].code).toBe('archive_stack_delta_required');
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'first'))).toBe(true);
  });

  it('preserves ordinary unstacked archive compatibility including --skip-specs', async () => {
    const project = root();
    change(project, 'ordinary');
    const result = await runCLI(['archive', 'ordinary', '--yes', '--skip-specs', '--json'], { cwd: project });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).archive.change).toBe('ordinary');
  });

  it('rejects --skip-specs for stacked legacy deltas', async () => {
    const project = root();
    change(project, 'first'); change(project, 'second');
    const specDir = path.join(project, 'specbase', 'changes', 'first', 'specs', 'legacy-slice');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, 'spec.md'), '## ADDED Requirements\n\n### Requirement: Legacy slice\nThe system SHALL expose a legacy slice.\n\n#### Scenario: Visible\n- **WHEN** used\n- **THEN** it is visible\n');
    await stack(project, ['first', 'second']);
    const result = await runCLI(['archive', 'first', '--yes', '--skip-specs', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).status[0].code).toBe('archive_stack_delta_required');
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'first'))).toBe(true);
    expect(fs.readdirSync(path.join(project, 'specbase', 'specs'))).toEqual([]);
  });

  it('keeps a stacked legacy member active when the user declines required spec updates', async () => {
    const project = root();
    change(project, 'first'); change(project, 'second');
    const specDir = path.join(project, 'specbase', 'changes', 'first', 'specs', 'legacy-slice');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, 'spec.md'), '## ADDED Requirements\n\n### Requirement: Legacy slice\nThe system SHALL expose a legacy slice.\n\n#### Scenario: Visible\n- **WHEN** used\n- **THEN** it is visible\n');
    await stack(project, ['first', 'second']);
    const result = await runCLI(['archive', 'first'], { cwd: project, input: 'n\n', timeoutMs: 10_000 });
    expect(result.exitCode).not.toBe(0);
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'first'))).toBe(true);
    expect(fs.readdirSync(path.join(project, 'specbase', 'specs'))).toEqual([]);
  });

  it('uses immutable metadata IDs for archive ordering even when active directories are renamed', async () => {
    const project = root();
    change(project, 'first-dir'); change(project, 'second-dir');
    fs.writeFileSync(path.join(project, 'specbase', 'changes', 'first-dir', '.openspec.yaml'), 'schema: spec-driven\nid: first\n');
    fs.writeFileSync(path.join(project, 'specbase', 'changes', 'second-dir', '.openspec.yaml'), 'schema: spec-driven\nid: second\n');
    await stack(project, ['first', 'second']);
    const result = await runCLI(['archive', 'second-dir', '--yes', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).status[0]).toMatchObject({ code: 'archive_stack_predecessor_required' });
    expect(JSON.parse(result.stdout).status[0].message).toContain('first');
  });

  it('uses immutable metadata ID when a renamed legacy member creates accepted truth', async () => {
    const project = root();
    change(project, 'renamed-directory'); change(project, 'second-directory');
    fs.writeFileSync(path.join(project, 'specbase', 'changes', 'renamed-directory', '.openspec.yaml'), 'schema: spec-driven\nid: immutable-first\n');
    fs.writeFileSync(path.join(project, 'specbase', 'changes', 'second-directory', '.openspec.yaml'), 'schema: spec-driven\nid: immutable-second\n');
    const delta = path.join(project, 'specbase', 'changes', 'renamed-directory', 'specs', 'legacy-slice');
    fs.mkdirSync(delta, { recursive: true });
    fs.writeFileSync(path.join(delta, 'spec.md'), '## ADDED Requirements\n\n### Requirement: Legacy slice\nThe system SHALL expose a legacy slice.\n\n#### Scenario: Visible\n- **WHEN** used\n- **THEN** it is visible\n');
    await stack(project, ['immutable-first', 'immutable-second']);

    const result = await runCLI(['archive', 'renamed-directory', '--yes', '--json'], { cwd: project });
    expect(result.exitCode).toBe(0);
    const accepted = fs.readFileSync(path.join(project, 'specbase', 'specs', 'legacy-slice', 'spec.md'), 'utf-8');
    expect(accepted).toContain('created by archiving change immutable-first');
    expect(accepted).not.toContain('created by archiving change renamed-directory');
  });

  it('ignores malformed unrelated stacks for unstacked status, instructions, and archive', async () => {
    const project = root();
    change(project, 'ordinary');
    fs.writeFileSync(path.join(project, 'specbase', 'changes', 'ordinary', 'proposal.md'), '## Why\nOrdinary\n');
    const broken = path.join(project, 'specbase', 'stacks', 'broken');
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(path.join(broken, '.openspec.yaml'), 'id: [broken\n');
    expect((await runCLI(['status', '--change', 'ordinary', '--json'], { cwd: project })).exitCode).toBe(0);
    expect((await runCLI(['instructions', 'apply', '--change', 'ordinary', '--json'], { cwd: project })).exitCode).toBe(0);
    const archived = await runCLI(['archive', 'ordinary', '--yes', '--json'], { cwd: project });
    expect(archived.exitCode).toBe(0);
  });

  it('isolates a malformed neighboring stack from valid stacked status, instructions, and archive', async () => {
    const project = root();
    change(project, 'first'); change(project, 'second');
    fs.writeFileSync(path.join(project, 'specbase', 'changes', 'first', 'proposal.md'), '## Why\nFirst\n');
    await stack(project, ['first', 'second']);
    const broken = path.join(project, 'specbase', 'stacks', 'broken');
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(path.join(broken, '.openspec.yaml'), 'id: [broken\n');
    expect((await runCLI(['status', '--change', 'first', '--json'], { cwd: project })).exitCode).toBe(0);
    expect((await runCLI(['instructions', 'apply', '--change', 'first', '--json'], { cwd: project })).exitCode).toBe(0);
    const archived = await runCLI(['archive', 'first', '--yes', '--json'], { cwd: project });
    expect(archived.exitCode).toBe(0);
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'first'))).toBe(false);
  });

  it('keeps malformed stack errors strict when the manifest claims the selected member', async () => {
    const project = root();
    change(project, 'ordinary');
    fs.writeFileSync(path.join(project, 'specbase', 'changes', 'ordinary', 'proposal.md'), '## Why\nOrdinary\n');
    const broken = path.join(project, 'specbase', 'stacks', 'broken');
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(path.join(broken, '.openspec.yaml'), 'id: broken\nsummary: Broken\nmembers:\n  - ordinary\n  - other\n');
    const result = await runCLI(['status', '--change', 'ordinary', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('invalid_stack_manifest');
  });

  it('rejects a destination collision that appears during governed preparation before writing truth', async () => {
    const project = root(true);
    change(project, 'racing', true);
    for (let index = 0; index < 120; index += 1) {
      const locator = `slice-${String(index).padStart(3, '0')}`;
      const pair = path.join(project, 'specbase', 'changes', 'racing', 'specs', 'behavior', locator);
      fs.mkdirSync(pair, { recursive: true });
      fs.writeFileSync(path.join(pair, 'spec.md'), `---\nid: behavior.${locator}\n---\n\n## ADDED Requirements\n\n### Requirement: ${locator}\n**ID:** truth\nThe system SHALL expose ${locator}.\n\n#### Scenario: Visible\n**ID:** visible\n- **WHEN** used\n- **THEN** it is visible\n`);
      fs.writeFileSync(path.join(pair, 'enforcement.yaml'), 'bindings: {}\n');
    }
    const archiveName = `${new Date().toISOString().slice(0, 10)}-racing`;
    const archivePath = path.join(project, 'specbase', 'changes', 'archive', archiveName);
    const pending = runCLI(['archive', 'racing', '--yes', '--no-validate', '--json'], { cwd: project, timeoutMs: 30_000 });
    await new Promise((resolve) => setTimeout(resolve, 100));
    fs.mkdirSync(archivePath, { recursive: true });
    const result = await pending;
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).status[0].code).toBe('archive_target_exists');
    expect(fs.readdirSync(path.join(project, 'specbase', 'specs'))).toEqual([]);
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'racing'))).toBe(true);
  }, 40_000);

  it('removes a staged legacy archive and leaves the source untouched when truth writing fails', async () => {
    const project = root();
    change(project, 'write-failure');
    const source = path.join(project, 'specbase', 'changes', 'write-failure');
    fs.writeFileSync(path.join(source, 'source-proof.txt'), 'source remains complete\n');
    const delta = path.join(source, 'specs', 'legacy-slice');
    fs.mkdirSync(delta, { recursive: true });
    fs.writeFileSync(path.join(delta, 'spec.md'), '## ADDED Requirements\n\n### Requirement: Legacy slice\nThe system SHALL expose a legacy slice.\n\n#### Scenario: Visible\n- **WHEN** used\n- **THEN** it is visible\n');
    fs.mkdirSync(path.join(project, 'specbase', 'specs', 'legacy-slice', 'spec.md'), { recursive: true });

    const result = await runCLI(['archive', 'write-failure', '--yes', '--no-validate', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(fs.readFileSync(path.join(source, 'source-proof.txt'), 'utf-8')).toBe('source remains complete\n');
    const archiveName = `${new Date().toISOString().slice(0, 10)}-write-failure`;
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'archive', archiveName))).toBe(false);
  });

  it('preflights an existing archive target before writing governed truth', async () => {
    const project = root(true);
    change(project, 'collision', true);
    const pair = path.join(project, 'specbase', 'changes', 'collision', 'specs', 'behavior', 'collision');
    fs.mkdirSync(pair, { recursive: true });
    fs.writeFileSync(path.join(pair, 'spec.md'), '---\nid: behavior.collision\n---\n\n## ADDED Requirements\n\n### Requirement: Collision\n**ID:** collision\nThe system SHALL expose collision.\n\n#### Scenario: Visible\n**ID:** visible\n- **WHEN** used\n- **THEN** it is visible\n');
    fs.writeFileSync(path.join(pair, 'enforcement.yaml'), 'bindings: {}\n');
    const archiveName = `${new Date().toISOString().slice(0, 10)}-collision`;
    fs.mkdirSync(path.join(project, 'specbase', 'changes', 'archive', archiveName), { recursive: true });
    const result = await runCLI(['archive', 'collision', '--yes', '--no-validate', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).status[0].code).toBe('archive_target_exists');
    expect(fs.readdirSync(path.join(project, 'specbase', 'specs'))).toEqual([]);
    expect(fs.existsSync(path.join(project, 'specbase', 'changes', 'collision'))).toBe(true);
  });
});
