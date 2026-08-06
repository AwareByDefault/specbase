import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ShowCommand } from '../../src/commands/show.js';

const GOVERNED_SCHEMA = 'spec-driven-governed';
const LEGACY_SCHEMA = 'spec-driven';

let tempDir: string;
let originalCwd: string;
let originalLog: typeof console.log;
let originalError: typeof console.error;
let logOutput: string[];
let errOutput: string[];

/** A valid governed spec.md declaring `id` plus one requirement/scenario. */
function specDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

/** An enforcement.md covering requirement `r` with an active automated binding. */
function coveredEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

async function writePair(
  locator: string,
  opts: { spec?: string; enforcement?: string; target?: string }
): Promise<void> {
  const dir = path.join(tempDir, 'openspec', 'specs', ...locator.split('/'));
  await fs.mkdir(dir, { recursive: true });
  if (opts.spec !== undefined) await fs.writeFile(path.join(dir, 'spec.md'), opts.spec);
  if (opts.enforcement !== undefined)
    await fs.writeFile(path.join(dir, 'enforcement.md'), opts.enforcement);
  if (opts.target !== undefined) {
    const targetPath = path.join(tempDir, opts.target);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, '// target\n');
  }
}

async function writeConfig(schema: string): Promise<void> {
  const openspec = path.join(tempDir, 'openspec');
  await fs.mkdir(openspec, { recursive: true });
  await fs.writeFile(path.join(openspec, 'config.yaml'), `schema: ${schema}\n`);
}

async function run(item: string, options: Record<string, unknown> = {}): Promise<void> {
  await new ShowCommand().execute(item, { noInteractive: true, ...options });
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `openspec-show-gov-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(tempDir, { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tempDir);
  originalLog = console.log;
  originalError = console.error;
  logOutput = [];
  errOutput = [];
  console.log = (...args: unknown[]) => logOutput.push(args.join(' '));
  console.error = (...args: unknown[]) => errOutput.push(args.join(' '));
});

afterEach(async () => {
  console.log = originalLog;
  console.error = originalError;
  process.chdir(originalCwd);
  process.exitCode = 0;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('governed show — resolution', () => {
  it('resolves a governed spec by plane-qualified locator (raw-first text)', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await run('architecture/platforms/desktop');

    const text = logOutput.join('\n');
    // Raw-first: the spec.md frontmatter/body is printed verbatim.
    expect(text).toContain('id: architecture.platforms.desktop');
    expect(text).toContain('### Requirement: R');
    // Paired summary follows with locator, plane, pair paths, and coverage.
    expect(text).toContain('locator:     architecture/platforms/desktop');
    expect(text).toContain('plane:       architecture');
    expect(text).toContain('Enforcement: 1 binding(s)');
    expect(text).toContain('Coverage: complete');
    expect(process.exitCode ?? 0).not.toBe(1);
  });

  it('resolves a moved spec by stable ID even though its locator changed', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    // The spec now lives at a NEW locator but keeps its stable ID.
    await writePair('architecture/platforms/desktop-native', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await run('architecture.platforms.desktop', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(parsed.specId).toBe('architecture.platforms.desktop');
    // Resolved at its CURRENT locator, not the stale one.
    expect(parsed.locator).toBe('architecture/platforms/desktop-native');
  });
});

describe('governed show — JSON shape', () => {
  it('emits stable spec ID, plane, locator, native pair paths, requirement/scenario IDs, bindings, and coverage states', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await run('architecture/platforms/desktop', { json: true });

    const view = JSON.parse(logOutput.join('\n'));
    expect(view.type).toBe('spec');
    expect(view.specId).toBe('architecture.platforms.desktop');
    expect(view.plane).toBe('architecture');
    expect(view.locator).toBe('architecture/platforms/desktop');
    expect(view.pairStatus).toBe('complete');
    expect(view.specPath).toContain(
      path.join('specs', 'architecture', 'platforms', 'desktop', 'spec.md')
    );
    expect(view.enforcementPath).toContain('enforcement.md');
    // Requirement and scenario IDs.
    expect(view.requirements).toEqual([
      { id: 'r', title: 'R', scenarios: [{ id: 's', title: 'S' }] },
    ]);
    // Bindings with their declared fields and computed drift state.
    expect(view.bindings).toHaveLength(1);
    expect(view.bindings[0]).toMatchObject({
      id: 'b',
      covers: ['r'],
      mechanism: 'test',
      strength: 'automated',
      status: 'active',
      targets: ['src/desktop.test.ts'],
      state: 'active',
      complete: true,
    });
    // Coverage states summary.
    expect(view.coverage).toMatchObject({
      state: 'complete',
      covered: 1,
      hanging: 0,
      stale: 0,
      broken: 0,
      planned: 0,
    });
  });
});

describe('governed show — incomplete pair and ambiguity', () => {
  it('reports the existing source and the missing pair member (spec-only)', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      // no enforcement.md — the spec half only
    });

    await run('architecture/domain');

    const text = logOutput.join('\n');
    expect(text).toContain('pair:        spec-only');
    expect(text).toContain('Missing enforcement.md for this pair.');
    // JSON marks the missing member explicitly.
    logOutput.length = 0;
    await run('architecture/domain', { json: true });
    const view = JSON.parse(logOutput.join('\n'));
    expect(view.incompletePair).toBe(true);
    expect(view.missingPairMember).toBe('enforcement');
  });

  it('reports candidates for an ambiguous unqualified basename', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/desktop', { spec: specDoc('behavior.desktop') });
    await writePair('architecture/desktop', { spec: specDoc('architecture.desktop') });

    await run('desktop');

    const err = errOutput.join('\n');
    expect(err).toContain("Ambiguous spec 'desktop'");
    expect(err).toContain('architecture/desktop');
    expect(err).toContain('behavior/desktop');
    expect(err).toContain('plane-qualified locator or the stable spec ID');
    expect(process.exitCode).toBe(1);
  });

  it('resolves a unique unqualified basename', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await run('session-loop', { json: true });

    const view = JSON.parse(logOutput.join('\n'));
    expect(view.locator).toBe('behavior/session-loop');
  });
});

describe('governed show — legacy is unchanged', () => {
  it('shows a legacy flat spec raw with no governed summary or coverage token', async () => {
    await writeConfig(LEGACY_SCHEMA);
    const legacyDoc =
      '## Purpose\nAuth.\n\n## Requirements\n\n### Requirement: Login\nUsers MUST log in.\n\n#### Scenario: ok\n- **WHEN** x\n- **THEN** y\n';
    await writePair('auth', { spec: legacyDoc });

    await run('auth');

    const text = logOutput.join('\n');
    // Raw legacy spec content is printed verbatim (unchanged behavior).
    expect(text).toContain('## Purpose');
    expect(text).toContain('### Requirement: Login');
    // No governed-only summary/coverage tokens leak into the legacy path.
    expect(text).not.toContain('Governed spec');
    expect(text).not.toContain('Coverage:');
    expect(text).not.toContain('Enforcement:');
  });

  it('shows a legacy spec as JSON with the legacy shape (id/requirements, no governed fields)', async () => {
    await writeConfig(LEGACY_SCHEMA);
    const legacyDoc =
      '## Purpose\nAuth.\n\n## Requirements\n\n### Requirement: Login\nUsers MUST log in.\n\n#### Scenario: ok\n- **WHEN** x\n- **THEN** y\n';
    await writePair('auth', { spec: legacyDoc });

    await run('auth', { json: true });

    const view = JSON.parse(logOutput.join('\n'));
    expect(view.id).toBe('auth');
    expect(Array.isArray(view.requirements)).toBe(true);
    expect(view.locator).toBeUndefined();
    expect(view.plane).toBeUndefined();
    expect(view.coverage).toBeUndefined();
  });
});
