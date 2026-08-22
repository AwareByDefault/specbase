import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFile } from 'child_process';
import { promises as fs, realpathSync } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { runCLI } from '../helpers/run-cli.js';
import { cleanupTempPath } from '../helpers/temp-cleanup.js';

const execFileAsync = promisify(execFile);

/**
 * Slice 1.3 journey: prove the standalone repo lifecycle end to end across
 * two simulated machines (separate XDG homes). Machine A sets up a store and
 * works a change through archive; machine B clones, registers, and continues.
 *
 * Git config is fully isolated so user gitconfig (signing, hooks, identity)
 * cannot leak in; identity comes from explicit env vars.
 */

const STORE_ID = 'team-context';
const JOURNEY_TIMEOUT_MS = 60_000;

let base: string;
let storeRoot: string;
let cloneRoot: string;
let projectDir: string;
let emptyGitConfig: string;

let machineA: NodeJS.ProcessEnv;
let machineB: NodeJS.ProcessEnv;

let projectSnapshot: Map<string, string>;

function machineEnv(home: string, gitConfigGlobal: string): NodeJS.ProcessEnv {
  return {
    XDG_CONFIG_HOME: path.join(home, 'config'),
    XDG_DATA_HOME: path.join(home, 'data'),
    XDG_STATE_HOME: path.join(home, 'state'),
    XDG_CACHE_HOME: path.join(home, 'cache'),
    SPECBASE_TELEMETRY: '0',
    GIT_CONFIG_GLOBAL: gitConfigGlobal,
    GIT_CONFIG_SYSTEM: emptyGitConfig,
    GIT_AUTHOR_NAME: 'Journey Tester',
    GIT_AUTHOR_EMAIL: 'journey@example.com',
    GIT_COMMITTER_NAME: 'Journey Tester',
    GIT_COMMITTER_EMAIL: 'journey@example.com',
  };
}

// Same canonicalization the product uses (expands Windows 8.3 short names).
function canonical(target: string): string {
  return realpathSync.native(target);
}

async function git(cwd: string, env: NodeJS.ProcessEnv, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    env: { ...process.env, ...env },
  });
  return stdout;
}

async function snapshotDirectory(root: string): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>();

  async function walk(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        snapshot.set(`${relative}/`, '');
        await walk(absolute);
      } else {
        snapshot.set(relative, await fs.readFile(absolute, 'utf-8'));
      }
    }
  }

  await walk(root);
  return snapshot;
}

async function listRelativeEntries(root: string, skipDirs: Set<string>): Promise<string[]> {
  const found: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        found.push(`${relative}/`);
        await walk(absolute);
      } else {
        found.push(relative);
      }
    }
  }

  await walk(root);
  return found.sort();
}

async function writeLifecycleSnapshotFixture(root: string): Promise<void> {
  const active = path.join(root, 'specbase', 'changes', 'renamed-active');
  const archived = path.join(root, 'specbase', 'changes', 'archive', '2025-01-02-renamed-archive');
  const duplicateActive = path.join(root, 'specbase', 'changes', 'duplicate-active');
  const duplicateArchived = path.join(root, 'specbase', 'changes', 'archive', '2025-01-03-duplicate-archive');
  for (const [directory, id] of [
    [active, 'snapshot-active'],
    [archived, 'snapshot-archived'],
    [duplicateActive, 'snapshot-duplicate'],
    [duplicateArchived, 'snapshot-duplicate'],
  ] as const) {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, '.openspec.yaml'), `schema: spec-driven\nid: ${id}\n`, 'utf8');
    await fs.writeFile(path.join(directory, 'tasks.md'), '- [x] done\n- [ ] pending\n', 'utf8');
  }
  await fs.writeFile(path.join(archived, '.openspec.yaml'), [
    'schema: spec-driven',
    'id: snapshot-archived',
    'pullRequest:',
    '  number: 42',
    '  url: https://github.com/acme/widget/pull/42',
    '  repository: acme/widget',
    '  base: main',
    '  head: feature/snapshot-archived',
    `  headSha: ${'a'.repeat(40)}`,
    '  runId: 2026-08-21_17-00-00-abcd',
    '  state: ready',
    '',
  ].join('\n'), 'utf8');
  await fs.writeFile(path.join(archived, 'tasks.md'), '- [x] done\n- [x] complete\n', 'utf8');
}

async function writeDirectActionFixture(root: string): Promise<void> {
  const idea = path.join(root, 'specbase', 'ideas', 'catalog-idea-directory');
  const active = path.join(root, 'specbase', 'changes', 'catalog-active-directory');
  const archived = path.join(root, 'specbase', 'changes', 'archive', '2025-01-02-catalog-archived-directory');
  await fs.mkdir(idea, { recursive: true });
  await fs.mkdir(active, { recursive: true });
  await fs.mkdir(archived, { recursive: true });
  await fs.writeFile(path.join(idea, '.openspec.yaml'), 'id: catalog-idea\nsummary: Catalog fixture\ncreated: 2025-01-01\n', 'utf8');
  await fs.writeFile(path.join(idea, 'notes.md'), 'A fixture.\n', 'utf8');
  await fs.writeFile(path.join(active, '.openspec.yaml'), 'schema: spec-driven\nid: catalog-active\n', 'utf8');
  await fs.writeFile(path.join(active, 'tasks.md'), '- [x] done\n- [ ] pending\n', 'utf8');
  await fs.writeFile(path.join(archived, '.openspec.yaml'), 'schema: spec-driven\nid: catalog-archived\n', 'utf8');
  await fs.writeFile(path.join(archived, 'tasks.md'), '- [x] done\n', 'utf8');
}

async function writeKanbanSnapshotFixture(root: string): Promise<void> {
  await fs.mkdir(path.join(root, 'specbase', 'ideas', 'idea'), { recursive: true });
  await fs.mkdir(path.join(root, 'specbase', 'changes', 'active'), { recursive: true });
  await fs.mkdir(path.join(root, 'specbase', 'changes', 'archive', '2025-02-03-archived'), { recursive: true });
  await fs.mkdir(path.join(root, 'specbase', 'specs', 'behavior', 'sample'), { recursive: true });
  await fs.writeFile(path.join(root, 'specbase', 'ideas', 'idea', '.openspec.yaml'), 'id: idea-id\nsummary: A board idea\ncreated: 2025-01-01\n', 'utf8');
  await fs.writeFile(path.join(root, 'specbase', 'changes', 'active', '.openspec.yaml'), [
    'schema: spec-driven',
    'id: board-active',
    'pullRequest:',
    '  number: 42',
    '  url: https://github.com/acme/widget/pull/42',
    '  repository: acme/widget',
    '  base: main',
    '  head: feature/board-active',
    `  headSha: ${'a'.repeat(40)}`,
    '  runId: 2026-08-21_17-00-00-abcd',
    '  state: ready',
    '',
  ].join('\n'), 'utf8');
  await fs.writeFile(path.join(root, 'specbase', 'changes', 'active', 'tasks.md'), '- [x] done\n- [x] next\n', 'utf8');
  await fs.writeFile(path.join(root, 'specbase', 'changes', 'archive', '2025-02-03-archived', '.openspec.yaml'), 'schema: spec-driven\nid: board-archived\n', 'utf8');
  await fs.writeFile(path.join(root, 'specbase', 'changes', 'archive', '2025-02-03-archived', 'tasks.md'), '- [x] done\n', 'utf8');
  await fs.writeFile(path.join(root, 'specbase', 'specs', 'behavior', 'sample', 'spec.md'), '---\nid: behavior.sample\n---\n### Requirement: Sample\n**ID:** sample\nText.\n', 'utf8');
}

async function writeCompletedChangeArtifacts(
  changeDir: string,
  capability: string
): Promise<void> {
  await fs.writeFile(
    path.join(changeDir, 'proposal.md'),
    [
      '# Proposal',
      '',
      '## Why',
      '',
      'Prove the standalone store lifecycle end to end.',
      '',
      '## What Changes',
      '',
      `- Add the ${capability} capability.`,
      '',
      '## Capabilities',
      '',
      '### New Capabilities',
      '',
      `- \`${capability}\`: lifecycle proof capability.`,
      '',
      '### Modified Capabilities',
      '',
      '(none)',
      '',
      '## Impact',
      '',
      '- Test-only.',
      '',
    ].join('\n'),
    'utf-8'
  );

  await fs.mkdir(path.join(changeDir, 'specs', capability), { recursive: true });
  await fs.writeFile(
    path.join(changeDir, 'specs', capability, 'spec.md'),
    [
      `# ${capability} Spec Delta`,
      '',
      '## ADDED Requirements',
      '',
      `### Requirement: ${capability} SHALL work`,
      '',
      `The system SHALL support ${capability}.`,
      '',
      '#### Scenario: It works',
      '',
      '- **WHEN** the lifecycle runs',
      '- **THEN** the capability exists',
      '',
    ].join('\n'),
    'utf-8'
  );

  await fs.writeFile(
    path.join(changeDir, 'design.md'),
    '# Design\n\nMinimal journey design.\n',
    'utf-8'
  );

  await fs.writeFile(
    path.join(changeDir, 'tasks.md'),
    '# Tasks\n\n## 1. Work\n\n- [x] 1.1 Do the work\n',
    'utf-8'
  );
}

beforeAll(async () => {
  base = await fs.mkdtemp(path.join(tmpdir(), 'specbase-store-lifecycle-'));
  storeRoot = path.join(base, 'machine-a', 'team-context');
  cloneRoot = path.join(base, 'machine-b', 'team-context');
  projectDir = path.join(base, 'machine-a', 'app-repo');
  emptyGitConfig = path.join(base, 'empty-gitconfig');

  await fs.writeFile(emptyGitConfig, '', 'utf-8');
  machineA = machineEnv(path.join(base, 'machine-a', 'home'), emptyGitConfig);
  machineB = machineEnv(path.join(base, 'machine-b', 'home'), emptyGitConfig);

  await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
  await fs.writeFile(path.join(projectDir, 'README.md'), '# app\n', 'utf-8');
  await fs.writeFile(path.join(projectDir, 'src', 'main.ts'), 'export {};\n', 'utf-8');
  projectSnapshot = await snapshotDirectory(projectDir);
}, 120_000);

afterAll(async () => {
  cleanupTempPath(base);
});

describe('standalone store lifecycle journey', () => {
  it('installed package resolves lifecycle snapshots and matches status JSON', async () => {
    const fixtureRoot = path.join(base, 'lifecycle-api-store');
    const consumerRoot = path.join(base, 'lifecycle-api-consumer');
    const packedRoot = path.join(base, 'packed');
    await writeLifecycleSnapshotFixture(fixtureRoot);
    await fs.mkdir(consumerRoot, { recursive: true });
    await fs.mkdir(packedRoot, { recursive: true });

    await execFileAsync('pnpm', ['run', 'build'], { cwd: path.resolve('.') });
    await execFileAsync('pnpm', ['pack', '--pack-destination', packedRoot], { cwd: path.resolve('.') });
    const tarball = path.join(packedRoot, (await fs.readdir(packedRoot)).find((entry) => entry.endsWith('.tgz'))!);
    await execFileAsync('npm', ['install', '--ignore-scripts', '--no-package-lock', tarball], { cwd: consumerRoot });

    async function packageResult(id: string) {
      const script = [
        "import { getLifecycleSnapshot, LIFECYCLE_SNAPSHOT_VERSION } from '@awarebydefault/specbase';",
        "const result = getLifecycleSnapshot({ root: process.argv[1], id: process.argv[2] });",
        'console.log(JSON.stringify({ version: LIFECYCLE_SNAPSHOT_VERSION, result }));',
      ].join(' ');
      const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '--eval', script, fixtureRoot, id], { cwd: consumerRoot });
      return JSON.parse(stdout) as { version: number; result: { snapshot: unknown; diagnostics: unknown[] } };
    }

    const active = await packageResult('snapshot-active');
    const archived = await packageResult('snapshot-archived');
    const missing = await packageResult('snapshot-missing');
    const ambiguous = await packageResult('snapshot-duplicate');

    expect(active.version).toBe(2);
    expect(JSON.parse(JSON.stringify(active.result))).toEqual(active.result);
    expect(active.result.snapshot).toMatchObject({ id: 'snapshot-active', position: 'active', lifecycle: 'implementing' });
    expect(archived.result.snapshot).toMatchObject({
      id: 'snapshot-archived',
      position: 'archived',
      lifecycle: 'archived',
      pullRequest: { number: 42, state: 'ready', url: 'https://github.com/acme/widget/pull/42' },
    });
    expect(missing.result).toMatchObject({ snapshot: null, diagnostics: [{ code: 'lifecycle_snapshot_unresolved', id: 'snapshot-missing' }] });
    expect(ambiguous.result).toMatchObject({ snapshot: null, diagnostics: [{ code: 'lifecycle_snapshot_ambiguous', id: 'snapshot-duplicate' }] });

    const status = await runCLI(['status', '--change', 'snapshot-active', '--json'], { cwd: fixtureRoot });
    expect(status.exitCode).toBe(0);
    const statusJson = JSON.parse(status.stdout);
    expect(statusJson.lifecycleSnapshot).toEqual(active.result);

    const archivedStatus = await runCLI(['status', '--change', 'snapshot-archived', '--json'], { cwd: fixtureRoot });
    expect(archivedStatus.exitCode).toBe(0);
    const archivedStatusJson = JSON.parse(archivedStatus.stdout);
    expect(archivedStatusJson.lifecycleSnapshot).toEqual(archived.result);
  }, JOURNEY_TIMEOUT_MS);

  it('installed package exposes deterministic read-only direct actions and rejects tampered intent', async () => {
    const fixtureRoot = path.join(base, 'direct-action-api-store');
    const consumerRoot = path.join(base, 'direct-action-api-consumer');
    const packedRoot = path.join(base, 'direct-action-packed');
    await writeDirectActionFixture(fixtureRoot);
    const before = await snapshotDirectory(fixtureRoot);
    await fs.mkdir(consumerRoot, { recursive: true });
    await fs.mkdir(packedRoot, { recursive: true });

    await execFileAsync('pnpm', ['run', 'build'], { cwd: path.resolve('.') });
    await execFileAsync('pnpm', ['pack', '--pack-destination', packedRoot], { cwd: path.resolve('.') });
    const tarball = path.join(packedRoot, (await fs.readdir(packedRoot)).find((entry) => entry.endsWith('.tgz'))!);
    await execFileAsync('npm', ['install', '--ignore-scripts', '--no-package-lock', tarball], { cwd: consumerRoot });

    const script = [
      "import { readFileSync, writeFileSync } from 'node:fs';",
      "import { join } from 'node:path';",
      "import { DIRECT_ACTION_CATALOG_VERSION, getDirectActions, validateDirectActionIntent } from '@awarebydefault/specbase';",
      'const root = process.argv[1];',
      "const catalog = await getDirectActions({ root, workItemId: 'catalog-idea' });",
      "const active = await getDirectActions({ root, workItemId: 'catalog-active' });",
      "const archived = await getDirectActions({ root, workItemId: 'catalog-archived' });",
      "const accepted = await validateDirectActionIntent({ version: DIRECT_ACTION_CATALOG_VERSION, storeId: null, workItemId: 'catalog-idea', actionId: 'explore', dispatchKind: 'skill' }, { root });",
      "const rejected = await validateDirectActionIntent({ version: DIRECT_ACTION_CATALOG_VERSION, storeId: null, workItemId: 'catalog-idea', actionId: 'explore', dispatchKind: 'skill', workflow: 'untrusted' }, { root });",
      "const applyIntent = { version: DIRECT_ACTION_CATALOG_VERSION, storeId: null, workItemId: 'catalog-active', actionId: 'apply', dispatchKind: 'skill' };",
      "const acceptedApply = await validateDirectActionIntent(applyIntent, { root });",
      "const tasks = join(root, 'specbase', 'changes', 'catalog-active-directory', 'tasks.md');",
      'const originalTasks = readFileSync(tasks, \"utf8\");',
      "writeFileSync(tasks, originalTasks.replace('- [ ] pending', '- [x] pending'));",
      'const staleApply = await validateDirectActionIntent(applyIntent, { root });',
      'writeFileSync(tasks, originalTasks);',
      "const unsupported = await validateDirectActionIntent({ ...applyIntent, version: 99 }, { root });",
      'console.log(JSON.stringify({ actionCatalogVersion: DIRECT_ACTION_CATALOG_VERSION, catalog, active, archived, accepted, rejected, acceptedApply, staleApply, unsupported }));',
    ].join(' ');
    const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '--eval', script, fixtureRoot], { cwd: consumerRoot });
    const result = JSON.parse(stdout) as {
      actionCatalogVersion: number;
      catalog: { actions: Array<{ actionId: string; availability: string; blocker: unknown; dispatch: unknown }> };
      active: { actions: Array<{ actionId: string; availability: string; blocker: { code: string } | null }> };
      archived: { target: { position: string }; actions: Array<{ availability: string; blocker: { code: string } | null }> };
      accepted: { accepted: boolean };
      rejected: { accepted: boolean; descriptor: unknown; diagnostics: Array<{ code: string; target: { workItemId: string }; actionId?: string }> };
      acceptedApply: { accepted: boolean };
      staleApply: { accepted: boolean; diagnostics: Array<{ code: string }> };
      unsupported: { accepted: boolean; diagnostics: Array<{ code: string }> };
    };

    expect(result.actionCatalogVersion).toBe(2);
    expect(result.catalog.actions.map((action) => action.actionId)).toEqual([
      'explore', 'propose-feature', 'explore-enforcement', 'propose-enforcement', 'apply', 'ready-to-review', 'review', 'pr-feedback', 'archive',
    ]);
    expect(result.catalog.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ actionId: 'ready-to-review', dispatch: { kind: 'capability', capabilityId: 'specbase.ready-to-review' } }),
    ]));
    expect(result.catalog.actions.slice(0, 2)).toEqual(expect.arrayContaining([
      expect.objectContaining({ actionId: 'explore', availability: 'available', blocker: null }),
      expect.objectContaining({ actionId: 'propose-feature', availability: 'available', blocker: null }),
    ]));
    expect(result.active.actions.find((action) => action.actionId === 'apply')).toMatchObject({ availability: 'available', blocker: null });
    expect(result.active.actions.find((action) => action.actionId === 'explore-enforcement')).toMatchObject({ availability: 'blocked', blocker: { code: 'direct_action_governed_required' } });
    expect(result.archived.target.position).toBe('archived');
    expect(result.archived.actions.every((action) => action.availability === 'blocked' && action.blocker?.code === 'direct_action_terminal')).toBe(true);
    expect(result.accepted.accepted).toBe(true);
    expect(result.acceptedApply.accepted).toBe(true);
    expect(result.staleApply).toMatchObject({ accepted: false, diagnostics: [{ code: 'direct_action_apply_complete' }] });
    expect(result.unsupported).toMatchObject({ accepted: false, diagnostics: [{ code: 'direct_action_unsupported_version' }] });
    expect(result.rejected).toMatchObject({
      accepted: false,
      descriptor: null,
      diagnostics: [{ code: 'direct_action_intent_executable_field', target: { workItemId: 'catalog-idea' }, actionId: 'explore' }],
    });
    expect(await snapshotDirectory(fixtureRoot)).toEqual(before);
  }, JOURNEY_TIMEOUT_MS);

  it('installed package derives and validates the same public kanban snapshot as view JSON', async () => {
    const fixtureRoot = path.join(base, 'kanban-api-store');
    const consumerRoot = path.join(base, 'kanban-api-consumer');
    const packedRoot = path.join(base, 'kanban-packed');
    await writeKanbanSnapshotFixture(fixtureRoot);
    await fs.mkdir(consumerRoot, { recursive: true });
    await fs.mkdir(packedRoot, { recursive: true });

    await execFileAsync('pnpm', ['run', 'build'], { cwd: path.resolve('.') });
    await execFileAsync('pnpm', ['pack', '--pack-destination', packedRoot], { cwd: path.resolve('.') });
    const tarball = path.join(packedRoot, (await fs.readdir(packedRoot)).find((entry) => entry.endsWith('.tgz'))!);
    await execFileAsync('npm', ['install', '--ignore-scripts', '--no-package-lock', tarball], { cwd: consumerRoot });

    const script = [
      "import { KANBAN_BOARD_VERSION, deriveKanbanBoard, validateKanbanBoardSnapshot } from '@awarebydefault/specbase';",
      'const board = await deriveKanbanBoard(process.argv[1]);',
      'const validation = validateKanbanBoardSnapshot(board, KANBAN_BOARD_VERSION);',
      'console.log(JSON.stringify({ version: KANBAN_BOARD_VERSION, board, validation }));',
    ].join(' ');
    const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '--eval', script, fixtureRoot], { cwd: consumerRoot });
    const packageResult = JSON.parse(stdout) as { version: number; board: unknown; validation: { valid: boolean; snapshot: unknown } };
    expect(packageResult.validation).toMatchObject({ valid: true, snapshot: packageResult.board });
    expect(JSON.parse(JSON.stringify(packageResult.board))).toEqual(packageResult.board);

    const cli = await runCLI(['view', '--json'], { cwd: fixtureRoot });
    expect(cli.exitCode).toBe(0);
    expect(JSON.parse(cli.stdout)).toEqual(packageResult.board);
    expect(packageResult.version).toBe(4);
    expect(packageResult.board).toMatchObject({
      lanes: {
        reviewing: [expect.objectContaining({
          id: 'board-active',
          pullRequest: { number: 42, state: 'ready', url: 'https://github.com/acme/widget/pull/42' },
        })],
      },
    });
    await expect(fs.access(path.join(consumerRoot, 'node_modules', '@awarebydefault', 'specbase', 'dist', 'tui'))).rejects.toThrow();
  }, JOURNEY_TIMEOUT_MS);

  it('machine A: setup produces a committed, clonable repo', async () => {
    const result = await runCLI(
      ['store', 'setup', STORE_ID, '--path', storeRoot, '--json'],
      { env: machineA }
    );

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.git).toEqual({
      is_repository: true,
      initialized: true,
      committed: true,
    });
    expect(payload.created_files).toEqual(
      expect.arrayContaining([
        'specbase/config.yaml',
        'specbase/specs/.gitkeep',
        'specbase/changes/archive/.gitkeep',
        '.specbase-store/store.yaml',
      ])
    );

    const log = await git(storeRoot, machineA, ['log', '--format=%s']);
    expect(log.trim().split('\n')).toHaveLength(1);
    expect(log).toContain(`Initialize Specbase store ${STORE_ID}`);

    const committedFiles = await git(storeRoot, machineA, [
      'show',
      '--name-only',
      '--format=',
      'HEAD',
    ]);
    expect(committedFiles).toContain('.specbase-store/store.yaml');
    expect(committedFiles).toContain('specbase/specs/.gitkeep');
    expect(committedFiles).toContain('specbase/changes/archive/.gitkeep');

    const status = await git(storeRoot, machineA, ['status', '--porcelain']);
    expect(status.trim()).toBe('');
  });

  it('machine A: doctor and list see a healthy store with git facts', async () => {
    const list = await runCLI(['store', 'list', '--json'], { env: machineA });
    expect(list.exitCode).toBe(0);
    expect(JSON.parse(list.stdout).stores).toHaveLength(1);

    const doctor = await runCLI(['store', 'doctor', STORE_ID, '--json'], {
      env: machineA,
    });
    expect(doctor.exitCode).toBe(0);
    const store = JSON.parse(doctor.stdout).stores[0];
    expect(store.specbase_root.healthy).toBe(true);
    expect(store.git).toEqual({
      is_repository: true,
      has_commits: true,
      has_uncommitted_changes: false,
      has_remote: false,
      origin_url: null,
    });
    expect(store.status).toEqual([]);

    // Human output surfaces the same Git facts.
    const humanDoctor = await runCLI(['store', 'doctor', STORE_ID], { env: machineA });
    expect(humanDoctor.exitCode).toBe(0);
    expect(humanDoctor.stdout).toContain(
      'Git: repository detected (commits: yes, uncommitted changes: no, remote: none)'
    );
  });

  it('machine A: works a change through archive from the project repo', async () => {
    const changeId = 'add-billing';

    const created = await runCLI(
      ['new', 'change', changeId, '--store', STORE_ID, '--json'],
      { env: machineA, cwd: projectDir }
    );
    expect(created.exitCode).toBe(0);
    const createdPayload = JSON.parse(created.stdout);
    expect(createdPayload.root).toEqual({
      path: canonical(storeRoot),
      source: 'store',
      store_id: STORE_ID,
    });
    expect(path.isAbsolute(createdPayload.change.path)).toBe(true);

    const status = await runCLI(
      ['status', '--change', changeId, '--store', STORE_ID],
      { env: machineA, cwd: projectDir }
    );
    expect(status.exitCode).toBe(0);
    expect(status.stderr).toContain(`Using Specbase root: ${STORE_ID}`);
    expect(status.stdout).not.toContain('Planning home');

    const instructions = await runCLI(
      ['instructions', 'proposal', '--change', changeId, '--store', STORE_ID],
      { env: machineA, cwd: projectDir }
    );
    expect(instructions.exitCode).toBe(0);
    expect(instructions.stdout).toContain(
      path.join(canonical(storeRoot), 'specbase', 'changes', changeId, 'proposal.md')
    );

    // The test acts as the agent and writes the artifacts.
    const changeDir = path.join(storeRoot, 'specbase', 'changes', changeId);
    await writeCompletedChangeArtifacts(changeDir, 'billing');

    const validated = await runCLI(
      ['validate', changeId, '--store', STORE_ID],
      { env: machineA, cwd: projectDir }
    );
    expect(validated.exitCode).toBe(0);
    expect(validated.stdout).toContain('is valid');

    const listed = await runCLI(
      ['list', '--store', STORE_ID, '--json'],
      { env: machineA, cwd: projectDir }
    );
    expect(listed.exitCode).toBe(0);
    expect(JSON.parse(listed.stdout).changes.map((c: { name: string }) => c.name)).toContain(
      changeId
    );

    const shown = await runCLI(
      ['show', changeId, '--store', STORE_ID],
      { env: machineA, cwd: projectDir }
    );
    expect(shown.exitCode).toBe(0);
    expect(shown.stdout).toContain('# Proposal');

    const archived = await runCLI(
      ['archive', changeId, '--store', STORE_ID, '--yes', '--json'],
      { env: machineA, cwd: projectDir }
    );
    expect(archived.exitCode).toBe(0);
    const archivePayload = JSON.parse(archived.stdout);
    expect(archivePayload.archive.change).toBe(changeId);
    expect(archivePayload.root.store_id).toBe(STORE_ID);

    const specPath = path.join(storeRoot, 'specbase', 'specs', 'billing', 'spec.md');
    await expect(fs.readFile(specPath, 'utf-8')).resolves.toContain('billing SHALL work');

    const archiveEntries = await fs.readdir(
      path.join(storeRoot, 'specbase', 'changes', 'archive')
    );
    expect(archiveEntries.some((entry) => entry.endsWith(`-${changeId}`))).toBe(true);
  }, JOURNEY_TIMEOUT_MS);

  it('machine A: the project repo is byte-identical after the lifecycle', async () => {
    const after = await snapshotDirectory(projectDir);
    expect(after).toEqual(projectSnapshot);
  });

  it('machine B: a clone registers without ceremony and reads promoted specs', async () => {
    // The test acts as the user: commit machine A's work before sharing.
    await git(storeRoot, machineA, ['add', '-A']);
    await git(storeRoot, machineA, ['commit', '-m', 'Work the add-billing change']);
    await fs.mkdir(path.dirname(cloneRoot), { recursive: true });
    await git(path.dirname(cloneRoot), machineB, ['clone', storeRoot, cloneRoot]);

    const commitsBeforeRegister = (
      await git(cloneRoot, machineB, ['rev-list', '--count', 'HEAD'])
    ).trim();

    const registered = await runCLI(
      ['store', 'register', cloneRoot, '--json'],
      { env: machineB }
    );
    expect(registered.exitCode).toBe(0);
    const payload = JSON.parse(registered.stdout);
    expect(payload.store.id).toBe(STORE_ID);
    expect(payload.created_files).toEqual([]);

    // Register never commits.
    const commitsAfterRegister = (
      await git(cloneRoot, machineB, ['rev-list', '--count', 'HEAD'])
    ).trim();
    expect(commitsAfterRegister).toBe(commitsBeforeRegister);

    const doctor = await runCLI(['store', 'doctor', STORE_ID, '--json'], {
      env: machineB,
    });
    expect(doctor.exitCode).toBe(0);
    expect(JSON.parse(doctor.stdout).stores[0].specbase_root.healthy).toBe(true);

    const specs = await runCLI(
      ['list', '--specs', '--store', STORE_ID, '--json'],
      { env: machineB, cwd: base }
    );
    expect(specs.exitCode).toBe(0);
    const specsPayload = JSON.parse(specs.stdout);
    expect(specsPayload.specs.map((spec: { id: string }) => spec.id)).toContain('billing');
    expect(specsPayload.root.store_id).toBe(STORE_ID);

    const shownSpec = await runCLI(
      ['show', 'billing', '--store', STORE_ID],
      { env: machineB, cwd: base }
    );
    expect(shownSpec.exitCode).toBe(0);
    expect(shownSpec.stdout).toContain('billing SHALL work');
  }, JOURNEY_TIMEOUT_MS);

  it('machine B: completes its own change through archive in the clone', async () => {
    const changeId = 'add-invoicing';

    const created = await runCLI(
      ['new', 'change', changeId, '--store', STORE_ID],
      { env: machineB, cwd: base }
    );
    expect(created.exitCode).toBe(0);
    expect(created.stderr).toContain(`Using Specbase root: ${STORE_ID}`);
    expect(created.stdout).toContain(`--store ${STORE_ID}`);

    const instructions = await runCLI(
      ['instructions', 'proposal', '--change', changeId, '--store', STORE_ID],
      { env: machineB, cwd: base }
    );
    expect(instructions.exitCode).toBe(0);
    expect(instructions.stdout).toContain(
      path.join(canonical(cloneRoot), 'specbase', 'changes', changeId, 'proposal.md')
    );

    const changeDir = path.join(cloneRoot, 'specbase', 'changes', changeId);
    await writeCompletedChangeArtifacts(changeDir, 'invoicing');

    const status = await runCLI(
      ['status', '--change', changeId, '--store', STORE_ID],
      { env: machineB, cwd: base }
    );
    expect(status.exitCode).toBe(0);
    expect(status.stdout).toContain('All artifacts complete!');

    const validated = await runCLI(
      ['validate', changeId, '--store', STORE_ID],
      { env: machineB, cwd: base }
    );
    expect(validated.exitCode).toBe(0);
    expect(validated.stdout).toContain('is valid');

    const archived = await runCLI(
      ['archive', changeId, '--store', STORE_ID, '--yes', '--json'],
      { env: machineB, cwd: base }
    );
    expect(archived.exitCode).toBe(0);
    expect(JSON.parse(archived.stdout).archive.change).toBe(changeId);

    const specPath = path.join(cloneRoot, 'specbase', 'specs', 'invoicing', 'spec.md');
    await expect(fs.readFile(specPath, 'utf-8')).resolves.toContain('invoicing SHALL work');

    // Post-resolution failures keep the banner, and the hint keeps the store:
    // with everything archived, instructions apply fails after the root
    // resolved successfully.
    const failedApply = await runCLI(
      ['instructions', 'apply', '--store', STORE_ID],
      { env: machineB, cwd: base }
    );
    expect(failedApply.exitCode).not.toBe(0);
    expect(failedApply.stderr).toContain(`Using Specbase root: ${STORE_ID}`);
    expect(failedApply.stderr).toContain(`specbase new change <name> --store ${STORE_ID}`);
  }, JOURNEY_TIMEOUT_MS);

  it('end state is just normal Specbase files in both checkouts', async () => {
    for (const root of [storeRoot, cloneRoot]) {
      const entries = await listRelativeEntries(root, new Set(['.git']));

      for (const entry of entries) {
        expect(entry).toMatch(/^(\.specbase-store(\/|\/store\.yaml)?|specbase(\/.*)?)$/);
        expect(entry).not.toMatch(/initiative|workspace/i);
      }

      expect(entries).toContain('.specbase-store/store.yaml');
      expect(entries).toContain('specbase/config.yaml');
    }

    // Global state holds only registry/config metadata, no planning files.
    for (const env of [machineA, machineB]) {
      const dataEntries = await listRelativeEntries(
        path.join(env.XDG_DATA_HOME as string, 'specbase'),
        new Set()
      );
      expect(dataEntries).toEqual(['stores/', 'stores/registry.yaml']);
    }
  });

  it('setup fails before creating anything when Git identity is missing', async () => {
    const strictConfig = path.join(base, 'strict-gitconfig');
    await fs.writeFile(strictConfig, '[user]\n\tuseConfigOnly = true\n', 'utf-8');

    const noIdentity: NodeJS.ProcessEnv = {
      ...machineEnv(path.join(base, 'machine-c', 'home'), strictConfig),
      GIT_AUTHOR_NAME: '',
      GIT_AUTHOR_EMAIL: '',
      GIT_COMMITTER_NAME: '',
      GIT_COMMITTER_EMAIL: '',
    };
    const target = path.join(base, 'machine-c', 'no-identity-store');

    const result = await runCLI(
      ['store', 'setup', 'no-identity', '--path', target, '--json'],
      { env: noIdentity }
    );
    expect(result.exitCode).toBe(1);
    const payload = JSON.parse(result.stdout);
    expect(payload.status[0].code).toBe('store_git_identity_missing');
    expect(payload.status[0].fix).toContain('git config --global user.name');

    await expect(fs.access(target)).rejects.toThrow();

    // --no-init-git needs no identity and creates no repo.
    const optOut = await runCLI(
      ['store', 'setup', 'no-identity', '--path', target, '--no-init-git', '--json'],
      { env: noIdentity }
    );
    expect(optOut.exitCode).toBe(0);
    const optOutPayload = JSON.parse(optOut.stdout);
    expect(optOutPayload.git).toEqual({
      is_repository: false,
      initialized: false,
      committed: false,
    });
    await expect(fs.access(path.join(target, '.git'))).rejects.toThrow();
  });
});
