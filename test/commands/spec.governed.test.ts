import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Command } from 'commander';
import { SpecCommand, registerSpecCommand } from '../../src/commands/spec.js';

/** Run a `spec` noun-command through a fresh commander program (integration). */
async function runSpec(args: string[]): Promise<void> {
  const program = new Command();
  program.exitOverride();
  registerSpecCommand(program);
  await program.parseAsync(['node', 'specbase', 'spec', ...args]);
}

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

/** An enforcement.md with no bindings — leaves requirement `r` hanging. */
function hangingEnforcement(id: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings: []\n\`\`\`\n`;
}

async function writePair(
  locator: string,
  opts: { spec?: string; enforcement?: string; target?: string }
): Promise<void> {
  const dir = path.join(tempDir, 'specbase', 'specs', ...locator.split('/'));
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
  const specbase = path.join(tempDir, 'specbase');
  await fs.mkdir(specbase, { recursive: true });
  await fs.writeFile(path.join(specbase, 'config.yaml'), `schema: ${schema}\n`);
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `specbase-spec-gov-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

describe('governed spec show', () => {
  it('resolves by plane-qualified locator with raw-first text and paired summary', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await new SpecCommand().show('architecture/platforms/desktop', { noInteractive: true } as any);

    const text = logOutput.join('\n');
    expect(text).toContain('id: architecture.platforms.desktop');
    expect(text).toContain('### Requirement: R');
    expect(text).toContain('locator:     architecture/platforms/desktop');
    expect(text).toContain('plane:       architecture');
    expect(text).toContain('Enforcement: 1 binding(s)');
    expect(text).toContain('Coverage: complete');
    expect(process.exitCode ?? 0).not.toBe(1);
  });

  it('resolves a moved spec by stable ID and emits the governed JSON view', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/platforms/desktop-native', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await new SpecCommand().show('architecture.platforms.desktop', { json: true, noInteractive: true } as any);

    const view = JSON.parse(logOutput.join('\n'));
    expect(view.type).toBe('spec');
    expect(view.specId).toBe('architecture.platforms.desktop');
    expect(view.plane).toBe('architecture');
    expect(view.locator).toBe('architecture/platforms/desktop-native');
    expect(view.pairStatus).toBe('complete');
    expect(view.requirements).toEqual([
      { id: 'r', title: 'R', scenarios: [{ id: 's', title: 'S' }] },
    ]);
    expect(view.bindings[0]).toMatchObject({ id: 'b', covers: ['r'], state: 'active', complete: true });
    expect(view.coverage).toMatchObject({ state: 'complete', covered: 1 });
  });

  it('reports candidates for an ambiguous unqualified basename', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/desktop', { spec: specDoc('behavior.desktop') });
    await writePair('architecture/desktop', { spec: specDoc('architecture.desktop') });

    await new SpecCommand().show('desktop', { noInteractive: true } as any);

    const err = errOutput.join('\n');
    expect(err).toContain("Ambiguous spec 'desktop'");
    expect(err).toContain('architecture/desktop');
    expect(err).toContain('behavior/desktop');
    expect(err).toContain('plane-qualified locator or the stable spec ID');
    expect(process.exitCode).toBe(1);
  });
});

describe('governed spec list', () => {
  it('recursively lists pairs with locator, stable id, and coverage (text)', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await runSpec(['list']);

    expect(logOutput).toContain('Specs:');
    const line = logOutput.find((l) => l.includes('architecture/platforms/desktop'));
    expect(line).toBeDefined();
    expect(line).toContain('id architecture.platforms.desktop');
    expect(line).toContain('requirements 1');
    expect(line).toContain('coverage complete');
  });

  it('emits the governed JSON list shape (locator/specId/plane/coverage)', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: hangingEnforcement('behavior.session-loop'),
    });

    await runSpec(['list', '--json']);

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(Array.isArray(parsed.specs)).toBe(true);
    const [record] = parsed.specs;
    expect(record.locator).toBe('behavior/session-loop');
    expect(record.specId).toBe('behavior.session-loop');
    expect(record.plane).toBe('behavior');
    expect(record.coverage).toMatchObject({ state: 'hanging', hanging: 1 });
  });
});

describe('governed spec validate', () => {
  it('validates a clean pair by locator and reports valid', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await runSpec(['validate', 'architecture/platforms/desktop']);

    expect(logOutput.join('\n')).toContain("Governed spec 'architecture/platforms/desktop' is valid");
    expect(process.exitCode ?? 0).not.toBe(1);
  });

  it('fails a hanging requirement with a coverage diagnostic (JSON)', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: hangingEnforcement('behavior.session-loop'),
    });

    await runSpec(['validate', 'behavior.session-loop', '--json']);

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(parsed.valid).toBe(false);
    const [spec] = parsed.specs;
    expect(spec.locator).toBe('behavior/session-loop');
    expect(spec.valid).toBe(false);
    expect(spec.diagnostics.some((d: any) => d.code === 'coverage/hanging-requirement')).toBe(true);
    expect(process.exitCode).toBe(1);
  });

  it('reports an unknown governed target', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runSpec(['validate', 'behavior/does-not-exist']);

    expect(errOutput.join('\n')).toContain("Spec 'behavior/does-not-exist' not found");
    expect(process.exitCode).toBe(1);
  });
});

describe('governed spec — legacy surfaces unchanged', () => {
  it('shows a legacy flat spec raw with no governed summary', async () => {
    await writeConfig(LEGACY_SCHEMA);
    const legacyDoc =
      '## Purpose\nAuth.\n\n## Requirements\n\n### Requirement: Login\nUsers MUST log in.\n\n#### Scenario: ok\n- **WHEN** x\n- **THEN** y\n';
    await writePair('auth', { spec: legacyDoc });

    await new SpecCommand().show('auth', { noInteractive: true } as any);

    const text = logOutput.join('\n');
    expect(text).toContain('## Purpose');
    expect(text).not.toContain('Governed spec');
    expect(text).not.toContain('Coverage:');
  });

  it('lists legacy specs with the bare id/requirementCount shape (no governed fields)', async () => {
    await writeConfig(LEGACY_SCHEMA);
    const legacyDoc =
      '## Purpose\nAuth.\n\n## Requirements\n\n### Requirement: Login\nUsers MUST log in.\n';
    await writePair('auth', { spec: legacyDoc });

    await runSpec(['list', '--json']);

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toMatchObject({ id: 'auth', requirementCount: 1 });
    expect(parsed[0].locator).toBeUndefined();
    expect(parsed[0].coverage).toBeUndefined();
  });
});
