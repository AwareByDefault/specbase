import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ValidateCommand } from '../../src/commands/validate.js';

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

/** A governed spec.md whose requirement ID `r` is declared twice (duplicate). */
function duplicateReqSpecDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R1\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S1\n**ID:** \`s1\`\n- **WHEN** a\n- **THEN** b\n### Requirement: R2\n**ID:** \`r\`\nThe system MUST do Y.\n#### Scenario: S2\n**ID:** \`s2\`\n- **WHEN** a\n- **THEN** b\n`;
}

/** Enforcement covering requirement `r` with an active automated binding. */
function coveredEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

/** Enforcement with no bindings — leaves requirement `r` hanging. */
function hangingEnforcement(id: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings: []\n\`\`\`\n`;
}

/** Enforcement whose active binding covers `r` plus a nonexistent `gone` id. */
function staleEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r, gone]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

/** Enforcement whose binding is still planned (covered `r` stays hanging). */
function plannedEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r]\n    mechanism: test\n    strength: automated\n    status: planned\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
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

/** A valid change with a single ADDED-requirement delta under specs/<cap>/. */
async function writeChange(name: string, cap = 'auth'): Promise<void> {
  const changeDir = path.join(tempDir, 'specbase', 'changes', name);
  await fs.mkdir(changeDir, { recursive: true });
  await fs.writeFile(
    path.join(changeDir, 'proposal.md'),
    '# Change\n\n## Why\nBecause reasons that are sufficiently long for validation.\n\n## What Changes\n- **auth:** Add something\n'
  );
  const delta = [
    '## ADDED Requirements',
    '### Requirement: Validator SHALL support the change delta',
    'The validator SHALL accept deltas provided by the test harness.',
    '',
    '#### Scenario: Apply delta',
    '- **GIVEN** the test change delta',
    '- **WHEN** specbase validate runs',
    '- **THEN** the validator reports the change as valid',
  ].join('\n');
  const deltaDir = path.join(changeDir, 'specs', cap);
  await fs.mkdir(deltaDir, { recursive: true });
  await fs.writeFile(path.join(deltaDir, 'spec.md'), delta);
}

async function writeConfig(schema: string): Promise<void> {
  const specbase = path.join(tempDir, 'specbase');
  await fs.mkdir(specbase, { recursive: true });
  await fs.writeFile(path.join(specbase, 'config.yaml'), `schema: ${schema}\n`);
}

async function runValidate(item: string | undefined, options: Record<string, unknown> = {}): Promise<void> {
  await new ValidateCommand().execute(item, { noInteractive: true, ...options } as any);
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `specbase-validate-gov-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

describe('governed validate — whole repository (no target)', () => {
  it('validates every discovered pair and passes a clean repo', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: coveredEnforcement('architecture.domain', 'src/domain.test.ts'),
      target: 'src/domain.test.ts',
    });
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runValidate(undefined);

    const out = logOutput.join('\n');
    expect(out).toContain('✓ architecture/domain');
    expect(out).toContain('✓ behavior/session-loop');
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('emits the governed --json report shape with root and actionable diagnostics', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: hangingEnforcement('behavior.session-loop'),
    });

    await runValidate(undefined, { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(parsed.valid).toBe(false);
    expect(parsed.root).toBeDefined();
    expect(Array.isArray(parsed.specs)).toBe(true);
    const [spec] = parsed.specs;
    expect(spec.locator).toBe('behavior/session-loop');
    expect(spec.specId).toBe('behavior.session-loop');
    expect(spec.plane).toBe('behavior');
    const hanging = spec.diagnostics.find((d: any) => d.code === 'coverage/hanging-requirement');
    expect(hanging).toMatchObject({ severity: 'error', normativeId: 'r', specId: 'behavior.session-loop' });
    expect(process.exitCode).toBe(1);
  });
});

describe('governed validate — diagnostic classes', () => {
  it('reports an incomplete (spec-only) pair', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', { spec: specDoc('behavior.session-loop') });

    await runValidate(undefined, { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    const [spec] = parsed.specs;
    expect(spec.diagnostics.some((d: any) => d.code === 'pair/incomplete')).toBe(true);
    expect(parsed.valid).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it('reports a project-wide duplicate spec ID on every conflicting pair with all locations', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/loop-a', {
      spec: specDoc('behavior.dup'),
      enforcement: coveredEnforcement('behavior.dup', 'src/a.test.ts'),
      target: 'src/a.test.ts',
    });
    await writePair('behavior/loop-b', {
      spec: specDoc('behavior.dup'),
      enforcement: coveredEnforcement('behavior.dup', 'src/b.test.ts'),
      target: 'src/b.test.ts',
    });

    await runValidate(undefined, { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(parsed.valid).toBe(false);
    for (const spec of parsed.specs) {
      const dup = spec.diagnostics.find((d: any) => d.code === 'identity/duplicate-spec-id');
      expect(dup).toBeDefined();
      expect(dup.message).toContain('loop-a');
      expect(dup.message).toContain('loop-b');
    }
    expect(process.exitCode).toBe(1);
  });

  it('reports a pair-local duplicate requirement ID', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: duplicateReqSpecDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runValidate('behavior/session-loop', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    const [spec] = parsed.specs;
    const dup = spec.diagnostics.find((d: any) => d.code === 'identity/duplicate-requirement-id');
    expect(dup).toMatchObject({ severity: 'error', normativeId: 'r' });
    expect(process.exitCode).toBe(1);
  });

  it('reports a stale binding covering a removed id', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: staleEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runValidate('behavior/session-loop', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    const [spec] = parsed.specs;
    const stale = spec.diagnostics.find((d: any) => d.code === 'binding/stale');
    expect(stale).toMatchObject({ severity: 'error', bindingId: 'b', normativeId: 'gone' });
    expect(process.exitCode).toBe(1);
  });

  it('reports a broken target for an active binding', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      // target file intentionally not created on disk
      enforcement: coveredEnforcement('behavior.session-loop', 'src/missing.test.ts'),
    });

    await runValidate('behavior/session-loop', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    const [spec] = parsed.specs;
    expect(spec.diagnostics.some((d: any) => d.code === 'binding/broken-target')).toBe(true);
    expect(spec.diagnostics.some((d: any) => d.code === 'target/missing')).toBe(true);
    expect(process.exitCode).toBe(1);
  });

  it('reports an escaping target', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', '../outside.test.ts'),
    });

    await runValidate('behavior/session-loop', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    const [spec] = parsed.specs;
    expect(spec.diagnostics.some((d: any) => d.code === 'target/escapes-root')).toBe(true);
    expect(process.exitCode).toBe(1);
  });

  it('reports a planned binding and blocks readiness (hanging claim)', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: plannedEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runValidate('behavior/session-loop', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    const [spec] = parsed.specs;
    expect(spec.diagnostics.some((d: any) => d.code === 'binding/planned')).toBe(true);
    expect(spec.diagnostics.some((d: any) => d.code === 'coverage/hanging-requirement')).toBe(true);
    expect(spec.valid).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it('always includes the (defensive) unsafeLocators array in whole-repo JSON', async () => {
    // Discovery skips hidden dirs and cannot form dot/empty/traversal segments,
    // so real fixtures never yield an unsafe locator; the report still exposes
    // the array so the surfacing contract is stable and any future entry marks
    // the repository invalid.
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runValidate(undefined, { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(Array.isArray(parsed.unsafeLocators)).toBe(true);
    expect(parsed.unsafeLocators).toHaveLength(0);
    expect(parsed.valid).toBe(true);
  });
});

describe('governed validate — targeting', () => {
  it('validates only the targeted pair by locator', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: coveredEnforcement('architecture.domain', 'src/domain.test.ts'),
      target: 'src/domain.test.ts',
    });
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: hangingEnforcement('behavior.session-loop'),
    });

    await runValidate('architecture/domain', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(parsed.specs).toHaveLength(1);
    expect(parsed.specs[0].locator).toBe('architecture/domain');
    expect(parsed.valid).toBe(true);
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('resolves a moved pair by stable spec ID', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/loop-renamed', {
      spec: specDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runValidate('behavior.session-loop', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(parsed.specs).toHaveLength(1);
    expect(parsed.specs[0].locator).toBe('behavior/loop-renamed');
    expect(parsed.valid).toBe(true);
  });

  it('reports an unknown governed target', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
      target: 'src/loop.test.ts',
    });

    await runValidate('behavior/does-not-exist');

    expect(errOutput.join('\n')).toContain("Spec 'behavior/does-not-exist' not found");
    expect(process.exitCode).toBe(1);
  });
});

describe('governed validate — change targets route to the change validator (#2)', () => {
  it('validates a positional change target as a change, not "spec not found"', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writeChange('add-auth');

    await runValidate('add-auth');

    expect(errOutput.join('\n')).not.toContain("not found");
    expect(logOutput.join('\n')).toContain("Change 'add-auth' is valid");
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('routes an explicit --type change to the change validator', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writeChange('add-auth');

    await runValidate('add-auth', { type: 'change' });

    expect(errOutput.join('\n')).not.toContain("not found");
    expect(logOutput.join('\n')).toContain("Change 'add-auth' is valid");
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('reports change delta issues instead of a missing-governed-spec error', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    // A change directory with no deltas is a change-validation failure, not a
    // "spec not found" dead-end.
    const emptyChange = path.join(tempDir, 'specbase', 'changes', 'empty-change');
    await fs.mkdir(emptyChange, { recursive: true });
    await fs.writeFile(
      path.join(emptyChange, 'proposal.md'),
      '# Change\n\n## Why\nReasons long enough for validation to accept.\n\n## What Changes\n- **x:** y\n'
    );

    await runValidate('empty-change');

    expect(errOutput.join('\n')).not.toContain("not found");
    expect(errOutput.join('\n')).toContain("Change 'empty-change' has issues");
    expect(process.exitCode).toBe(1);
  });

  it('still validates a governed spec target as a governed pair', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: coveredEnforcement('architecture.domain', 'src/domain.test.ts'),
      target: 'src/domain.test.ts',
    });

    await runValidate('architecture/domain', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(parsed.specs).toHaveLength(1);
    expect(parsed.specs[0].locator).toBe('architecture/domain');
    expect(parsed.valid).toBe(true);
  });
});

describe('governed validate — legacy unchanged', () => {
  it('validates a legacy flat project with the legacy validator (--specs)', async () => {
    await writeConfig(LEGACY_SCHEMA);
    const legacyDoc =
      '## Purpose\nAuth capability for the validation harness exercised by tests.\n\n## Requirements\n\n### Requirement: Users SHALL log in\nUsers SHALL authenticate before access.\n\n#### Scenario: Successful login\n- **WHEN** valid credentials are supplied\n- **THEN** access is granted\n';
    const dir = path.join(tempDir, 'specbase', 'specs', 'auth');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'spec.md'), legacyDoc);

    await runValidate(undefined, { specs: true, json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    // Legacy JSON shape: items/summary/version, not the governed specs/unsafeLocators shape.
    expect(Array.isArray(parsed.items)).toBe(true);
    expect(parsed.summary).toBeDefined();
    expect(parsed.version).toBe('1.0');
    expect(parsed.unsafeLocators).toBeUndefined();
    expect(parsed.items[0]).toMatchObject({ id: 'auth', type: 'spec', valid: true });
    expect(process.exitCode ?? 0).toBe(0);
  });
});
