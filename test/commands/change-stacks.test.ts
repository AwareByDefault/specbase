import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';
import { createSpecbaseRoot } from '../helpers/specbase-fixtures.js';

function root(): string {
  const value = fs.mkdtempSync(path.join(os.tmpdir(), 'change-stack-cli-'));
  createSpecbaseRoot(value);
  return value;
}
async function addIdea(project: string, title: string): Promise<string> {
  const result = await runCLI(['ideas', 'add', '--title', title, '--json'], { cwd: project });
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout).id;
}
async function create(project: string, id: string | undefined, summary: string, members: string[], extra: string[] = []) {
  const args = ['stack', 'create', ...(id ? [id] : []), '--summary', summary, ...members.flatMap((member) => ['--member', member]), ...extra, '--json'];
  return runCLI(args, { cwd: project });
}

describe('stack commands', () => {
  it('creates, lists, and shows members in manifest order with one-document JSON', async () => {
    const project = root();
    const first = await addIdea(project, 'First visible slice');
    const second = await addIdea(project, 'Second visible slice');
    const result = await create(project, 'visible-delivery', 'Visible delivery', [first, second]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.stack.members.map((member: { id: string }) => member.id)).toEqual([first, second]);
    expect(payload.stack.firstUnfinishedMember).toBe(first);

    const list = await runCLI(['stack', 'list', '--json'], { cwd: project });
    expect(JSON.parse(list.stdout).stacks[0].id).toBe('visible-delivery');
    const show = await runCLI(['stack', 'show', 'visible-delivery', '--json'], { cwd: project });
    expect(JSON.parse(show.stdout).stack.members.map((member: { position: string }) => member.position)).toEqual(['idea', 'idea']);
  });

  it('graduates an umbrella idea to stack context without losing metadata, notes, or supporting files', async () => {
    const project = root();
    const umbrella = await addIdea(project, 'Umbrella outcome');
    const first = await addIdea(project, 'Slice one');
    const second = await addIdea(project, 'Slice two');
    const ideaDir = path.join(project, 'specbase', 'ideas', umbrella);
    fs.writeFileSync(path.join(ideaDir, 'notes.md'), 'decomposition notes\n');
    fs.writeFileSync(path.join(ideaDir, 'research.txt'), 'supporting evidence\n');
    const before = fs.readFileSync(path.join(ideaDir, '.openspec.yaml'), 'utf-8');

    const result = await create(project, undefined, 'ignored replacement', [first, second], ['--from-idea', umbrella]);
    expect(result.exitCode).toBe(0);
    const destination = path.join(project, 'specbase', 'stacks', umbrella);
    expect(fs.existsSync(ideaDir)).toBe(false);
    expect(fs.readFileSync(path.join(destination, 'notes.md'), 'utf-8')).toBe('decomposition notes\n');
    expect(fs.readFileSync(path.join(destination, 'research.txt'), 'utf-8')).toBe('supporting evidence\n');
    expect(before).toContain(`id: ${umbrella}`);
    expect(fs.readFileSync(path.join(destination, '.openspec.yaml'), 'utf-8')).toContain('summary: Umbrella outcome');
  });

  it('derives mixed lifecycle progress and the first unfinished member', async () => {
    const project = root();
    const archived = await addIdea(project, 'Archived slice');
    const active = await addIdea(project, 'Active slice');
    const planned = await addIdea(project, 'Planned slice');
    const created = await create(project, 'mixed-stack', 'Mixed', [archived, active, planned]);
    expect(created.exitCode).toBe(0);
    fs.renameSync(path.join(project, 'specbase', 'ideas', archived), path.join(project, 'specbase', 'changes', 'archive', `2026-01-01-${archived}`));
    fs.renameSync(path.join(project, 'specbase', 'ideas', active), path.join(project, 'specbase', 'changes', active));
    fs.writeFileSync(path.join(project, 'specbase', 'changes', active, '.openspec.yaml'), `schema: spec-driven\nid: ${active}\n`);
    fs.writeFileSync(path.join(project, 'specbase', 'changes', active, 'tasks.md'), '- [x] first\n- [ ] second\n');

    const show = await runCLI(['stack', 'show', 'mixed-stack', '--json'], { cwd: project });
    const stack = JSON.parse(show.stdout).stack;
    expect(stack.members.map((member: { position: string }) => member.position)).toEqual(['archived', 'change', 'idea']);
    expect(stack.members[1].taskProgress).toEqual({ complete: 1, total: 2 });
    expect(stack.firstUnfinishedMember).toBe(active);
  });

  it('returns actionable JSON failures atomically and keeps unstacked behavior unchanged', async () => {
    const project = root();
    const first = await addIdea(project, 'Only member');
    const failure = await create(project, 'broken-stack', 'Broken', [first, 'missing-member']);
    expect(failure.exitCode).toBe(1);
    const payload = JSON.parse(failure.stdout);
    expect(payload.stack).toBeNull();
    expect(payload.status[0]).toMatchObject({ code: 'missing_member', member: 'missing-member' });
    expect(fs.existsSync(path.join(project, 'specbase', 'stacks', 'broken-stack'))).toBe(false);

    const ideas = await runCLI(['ideas', 'show', first, '--json'], { cwd: project });
    expect(ideas.exitCode).toBe(0);
    expect(JSON.parse(ideas.stdout).id).toBe(first);
  });

  it('returns one JSON document for missing summary and missing or unknown subcommands', async () => {
    const project = root();
    const first = await addIdea(project, 'First');
    const second = await addIdea(project, 'Second');
    for (const args of [
      ['stack', 'create', 'delivery', '--member', first, '--member', second, '--json'],
      ['stack', '--json'],
      ['stack', 'unknown', '--json'],
    ]) {
      const result = await runCLI(args, { cwd: project });
      expect(result.exitCode).toBe(1);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      expect(JSON.parse(result.stdout)).toMatchObject({ stack: null, status: [expect.objectContaining({ severity: 'error' })] });
      expect(result.stdout.trim().split('\n').filter((line) => line.startsWith('{'))).toHaveLength(1);
    }
  });

  it('creates and inspects a stack in a registered store with one-document JSON', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'change-stack-store-'));
    const storeRoot = path.join(base, 'store');
    const cwd = path.join(base, 'project');
    fs.mkdirSync(cwd, { recursive: true });
    const env = {
      XDG_CONFIG_HOME: path.join(base, 'config'),
      XDG_DATA_HOME: path.join(base, 'data'),
      XDG_STATE_HOME: path.join(base, 'state'),
      XDG_CACHE_HOME: path.join(base, 'cache'),
      SPECBASE_TELEMETRY: '0',
    };
    const setup = await runCLI(['store', 'setup', 'delivery-store', '--path', storeRoot, '--no-init-git', '--json'], { cwd, env });
    expect(setup.exitCode).toBe(0);
    for (const id of ['store-first', 'store-second']) {
      const dir = path.join(storeRoot, 'specbase', 'ideas', id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '.openspec.yaml'), `id: ${id}\nsummary: ${id}\ncreated: 2026-01-01\n`);
      fs.writeFileSync(path.join(dir, 'notes.md'), 'planned\n');
    }
    const created = await runCLI([
      'stack', 'create', 'store-delivery', '--summary', 'Store delivery',
      '--member', 'store-first', '--member', 'store-second', '--store', 'delivery-store', '--json',
    ], { cwd, env });
    expect(created.exitCode).toBe(0);
    expect(JSON.parse(created.stdout).root).toMatchObject({ source: 'store', store_id: 'delivery-store' });
    const shown = await runCLI(['stack', 'show', 'store-delivery', '--store', 'delivery-store', '--json'], { cwd, env });
    expect(shown.exitCode).toBe(0);
    expect(JSON.parse(shown.stdout).stack.members.map((member: { id: string }) => member.id)).toEqual(['store-first', 'store-second']);
  });

  it('keeps the plural JSON envelope when list encounters a malformed manifest', async () => {
    const project = root();
    const broken = path.join(project, 'specbase', 'stacks', 'broken');
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(path.join(broken, '.openspec.yaml'), 'id: [broken\n');

    const result = await runCLI(['stack', 'list', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      stacks: [],
      status: [expect.objectContaining({ severity: 'error', code: 'invalid_stack_manifest' })],
    });
    expect(JSON.parse(result.stdout)).not.toHaveProperty('stack');
  });

  it('decomposes an umbrella idea entirely within a registered store', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'change-stack-store-workflow-'));
    const storeRoot = path.join(base, 'store');
    const cwd = path.join(base, 'project');
    fs.mkdirSync(cwd, { recursive: true });
    const env = {
      XDG_CONFIG_HOME: path.join(base, 'config'),
      XDG_DATA_HOME: path.join(base, 'data'),
      XDG_STATE_HOME: path.join(base, 'state'),
      XDG_CACHE_HOME: path.join(base, 'cache'),
      SPECBASE_TELEMETRY: '0',
    };
    expect((await runCLI(['store', 'setup', 'workflow-store', '--path', storeRoot, '--no-init-git', '--json'], { cwd, env })).exitCode).toBe(0);

    const add = async (title: string): Promise<string> => {
      const result = await runCLI(['ideas', 'add', '--title', title, '--store', 'workflow-store', '--json'], { cwd, env });
      expect(result.exitCode).toBe(0);
      return JSON.parse(result.stdout).id;
    };
    const umbrella = await add('Kanban delivery');
    const first = await add('Interactive board');
    const second = await add('Activity awareness');
    const shown = await runCLI(['ideas', 'show', umbrella, '--store', 'workflow-store', '--json'], { cwd, env });
    expect(shown.exitCode).toBe(0);
    expect(JSON.parse(shown.stdout).id).toBe(umbrella);
    const listed = await runCLI(['ideas', 'list', '--store', 'workflow-store', '--json'], { cwd, env });
    expect(JSON.parse(listed.stdout).map((idea: { id: string }) => idea.id)).toEqual(expect.arrayContaining([umbrella, first, second]));

    const created = await runCLI([
      'stack', 'create', '--from-idea', umbrella, '--summary', 'Kanban delivery',
      '--member', first, '--member', second, '--store', 'workflow-store', '--json',
    ], { cwd, env });
    expect(created.exitCode).toBe(0);
    expect(JSON.parse(created.stdout).root).toMatchObject({ source: 'store', store_id: 'workflow-store' });
    expect(fs.existsSync(path.join(storeRoot, 'specbase', 'ideas', umbrella))).toBe(false);
    expect(fs.existsSync(path.join(storeRoot, 'specbase', 'stacks', umbrella))).toBe(true);
  });

  it('returns nonzero validation for a planned-only downstream chain', async () => {
    const project = root();
    const first = await addIdea(project, 'First planned slice');
    const second = await addIdea(project, 'Second planned slice');
    expect((await create(project, 'planned-delivery', 'Planned', [first, second])).exitCode).toBe(0);
    const result = await runCLI(['stack', 'validate', 'planned-delivery', '--json'], { cwd: project });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).stack).toMatchObject({ valid: false, projection: { blockedByPlannedMember: first } });
  });

  it('prints human create, list, and show output without requiring JSON consumers', async () => {
    const project = root();
    const first = await addIdea(project, 'First');
    const second = await addIdea(project, 'Second');
    const created = await runCLI(['stack', 'create', 'human-delivery', '--summary', 'Human delivery', '--member', first, '--member', second], { cwd: project });
    expect(created.exitCode).toBe(0);
    expect(created.stdout).toContain("Created stack 'human-delivery'");
    const listed = await runCLI(['stack', 'list'], { cwd: project });
    expect(listed.stdout).toContain('human-delivery');
    const shown = await runCLI(['stack', 'show', 'human-delivery'], { cwd: project });
    expect(shown.stdout).toContain('Stack: human-delivery');
    expect(shown.stdout).toContain(`[idea]`);
  });
});
