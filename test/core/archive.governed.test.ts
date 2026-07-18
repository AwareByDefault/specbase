import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ArchiveCommand } from '../../src/core/archive.js';

const GOVERNED_SCHEMA = 'spec-driven-governed';

let tempDir: string;
let originalCwd: string;
let originalLog: typeof console.log;
let logOutput: string[];

/** A governed spec.md declaring `id` plus one requirement/scenario (title T). */
function specDoc(id: string, title = 'R'): string {
  return `---\nid: ${id}\n---\n### Requirement: ${title}\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

/** Governed spec.md with two requirements r and r2. */
function twoReqSpecDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n### Requirement: R2\n**ID:** \`r2\`\nThe system MUST do Y.\n#### Scenario: S2\n**ID:** \`s2\`\n- **WHEN** c\n- **THEN** d\n`;
}

/** Active automated binding `b` covering `r`, targeting one file. */
function coveredEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

/** Two active bindings: b covering r (target t1) and b2 covering r2 (target t2). */
function twoBindingEnforcement(id: string, t1: string, t2: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${t1}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${t1}]\n      cwd: .\n  - id: b2\n    covers: [r2]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${t2}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${t2}]\n      cwd: .\n\`\`\`\n`;
}

/** Enforcement with no bindings — leaves requirement `r` hanging. */
function hangingEnforcement(id: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings: []\n\`\`\`\n`;
}

/** Active binding covering `r` plus a nonexistent `gone` id (stale). */
function staleEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r, gone]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

/** Planned binding covering `r` — allowed while authoring, blocks archive. */
function plannedEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r]\n    mechanism: test\n    strength: automated\n    status: planned\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

async function writeConfig(): Promise<void> {
  const openspec = path.join(tempDir, 'openspec');
  await fs.mkdir(openspec, { recursive: true });
  await fs.writeFile(path.join(openspec, 'config.yaml'), `schema: ${GOVERNED_SCHEMA}\n`);
}

/** Write a governed pair under the change delta root or the current root. */
async function writePair(
  scope: 'delta' | 'current',
  change: string,
  locator: string,
  opts: { spec?: string; enforcement?: string }
): Promise<void> {
  const base =
    scope === 'delta'
      ? path.join(tempDir, 'openspec', 'changes', change)
      : path.join(tempDir, 'openspec');
  const dir = path.join(base, 'specs', ...locator.split('/'));
  await fs.mkdir(dir, { recursive: true });
  if (opts.spec !== undefined) await fs.writeFile(path.join(dir, 'spec.md'), opts.spec);
  if (opts.enforcement !== undefined)
    await fs.writeFile(path.join(dir, 'enforcement.md'), opts.enforcement);
}

/** Create a target file (the enforcement binding's declared path) in-project. */
async function writeTarget(rel: string): Promise<void> {
  const p = path.join(tempDir, rel);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, '// target\n');
}

async function ensureChange(change: string): Promise<void> {
  await fs.mkdir(path.join(tempDir, 'openspec', 'changes', change), { recursive: true });
}

async function runArchive(
  change: string,
  options: Record<string, unknown> = {}
): Promise<any> {
  await new ArchiveCommand().execute(change, { json: true, yes: true, ...options } as any);
  return JSON.parse(logOutput.join('\n'));
}

function read(rel: string): Promise<string> {
  return fs.readFile(path.join(tempDir, rel), 'utf-8');
}

async function exists(rel: string): Promise<boolean> {
  try {
    await fs.access(path.join(tempDir, rel));
    return true;
  } catch {
    return false;
  }
}

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-archive-gov-'));
  originalCwd = process.cwd();
  process.chdir(tempDir);
  originalLog = console.log;
  logOutput = [];
  console.log = (...args: unknown[]) => logOutput.push(args.join(' '));
  await writeConfig();
});

afterEach(async () => {
  console.log = originalLog;
  process.chdir(originalCwd);
  process.exitCode = 0;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('governed archive — coherent pair application', () => {
  it('applies a coherent spec+enforcement delta pair by stable ID and archives', async () => {
    const change = 'add-session';
    await ensureChange(change);
    await writeTarget('src/loop.test.ts');
    // Current pair exists (behavioral) at the same locator.
    await writePair('current', change, 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop', 'Old title'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
    });
    // Delta re-titles the requirement (same stable ID) and keeps the pair coherent.
    await writePair('delta', change, 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop', 'New title'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive).not.toBeNull();
    expect(out.archive.governed.verification).toBe('verified');
    // Current spec updated with the new title (reconciled by stable ID `r`).
    expect(await read('openspec/specs/behavior/session-loop/spec.md')).toContain('New title');
    // Change moved to archive.
    expect(await exists(`openspec/changes/${change}`)).toBe(false);
    expect(await exists(`openspec/changes/archive`)).toBe(true);
  });
});

describe('governed archive — reconciliation and reporting', () => {
  it('creates a new current pair from a delta with no current counterpart', async () => {
    const change = 'add-domain';
    await ensureChange(change);
    await writeTarget('src/domain.test.ts');
    await writePair('delta', change, 'architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: coveredEnforcement('architecture.domain', 'src/domain.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    expect(await exists('openspec/specs/architecture/domain/spec.md')).toBe(true);
    expect(await exists('openspec/specs/architecture/domain/enforcement.md')).toBe(true);
    const [pair] = out.archive.governed.pairs;
    expect(pair.specId).toBe('architecture.domain');
    expect(pair.normativeOps.added).toBe(1);
  });

  it('reconciles a MOVED spec by stable ID, writing the new locator and removing the old', async () => {
    const change = 'move-session';
    await ensureChange(change);
    await writeTarget('src/loop.test.ts');
    await writePair('current', change, 'behavior/old-loop', {
      spec: specDoc('behavior.session'),
      enforcement: coveredEnforcement('behavior.session', 'src/loop.test.ts'),
    });
    // Same stable spec ID, new locator (a move; title/locator are mutable).
    await writePair('delta', change, 'behavior/new-loop', {
      spec: specDoc('behavior.session'),
      enforcement: coveredEnforcement('behavior.session', 'src/loop.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    const [pair] = out.archive.governed.pairs;
    expect(pair.moved).toBe(true);
    expect(pair.previousLocator).toBe('behavior/old-loop');
    expect(await exists('openspec/specs/behavior/new-loop/spec.md')).toBe(true);
    expect(await exists('openspec/specs/behavior/old-loop/spec.md')).toBe(false);
  });

  it('reports retired-target cleanup candidates without deleting project code', async () => {
    const change = 'drop-req';
    await ensureChange(change);
    await writeTarget('src/r.test.ts');
    await writeTarget('src/r2.test.ts');
    // Current pair: two requirements, two bindings (b→r/r.test, b2→r2/r2.test).
    await writePair('current', change, 'behavior/multi', {
      spec: twoReqSpecDoc('behavior.multi'),
      enforcement: twoBindingEnforcement('behavior.multi', 'src/r.test.ts', 'src/r2.test.ts'),
    });
    // Delta removes r2 and its binding b2, retiring src/r2.test.ts.
    await writePair('delta', change, 'behavior/multi', {
      spec: specDoc('behavior.multi'),
      enforcement: coveredEnforcement('behavior.multi', 'src/r.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    const [pair] = out.archive.governed.pairs;
    expect(pair.normativeOps.removed).toBe(1);
    expect(pair.bindingOps.removed).toBe(1);
    const retired = pair.retiredTargets.find((c: any) => c.path === 'src/r2.test.ts');
    expect(retired).toBeDefined();
    expect(retired.stillReferenced).toBe(false);
    // The project code is never deleted by archive.
    expect(await exists('src/r2.test.ts')).toBe(true);
  });
});

describe('governed archive — blocking conditions (no writes, change not moved)', () => {
  async function expectBlocked(change: string, code: string): Promise<void> {
    const out = await runArchive(change);
    expect(out.archive).toBeNull();
    expect(out.status[0].code).toBe(code);
    expect(process.exitCode).toBe(1);
    // The change was NOT moved to archive.
    expect(await exists(`openspec/changes/${change}`)).toBe(true);
    process.exitCode = 0;
  }

  it('refuses an incomplete delta pair (only one member present)', async () => {
    const change = 'incomplete';
    await ensureChange(change);
    await writePair('delta', change, 'behavior/half', { spec: specDoc('behavior.half') });
    await expectBlocked(change, 'archive_governed_incomplete_pair');
  });

  it('blocks a hanging mandatory claim', async () => {
    const change = 'hanging';
    await ensureChange(change);
    await writePair('delta', change, 'behavior/hang', {
      spec: specDoc('behavior.hang'),
      enforcement: hangingEnforcement('behavior.hang'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
    expect(await exists('openspec/specs/behavior/hang/spec.md')).toBe(false);
  });

  it('blocks a stale coverage reference', async () => {
    const change = 'stale';
    await ensureChange(change);
    await writeTarget('src/s.test.ts');
    await writePair('delta', change, 'behavior/stale', {
      spec: specDoc('behavior.stale'),
      enforcement: staleEnforcement('behavior.stale', 'src/s.test.ts'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
  });

  it('blocks a missing active target (broken enforcement)', async () => {
    const change = 'broken';
    await ensureChange(change);
    await writePair('delta', change, 'behavior/broken', {
      spec: specDoc('behavior.broken'),
      enforcement: coveredEnforcement('behavior.broken', 'src/missing.test.ts'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
  });

  it('blocks an unresolved planned binding', async () => {
    const change = 'planned';
    await ensureChange(change);
    await writeTarget('src/p.test.ts');
    await writePair('delta', change, 'behavior/planned', {
      spec: specDoc('behavior.planned'),
      enforcement: plannedEnforcement('behavior.planned', 'src/p.test.ts'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
  });

  it('blocks a duplicate spec ID introduced across delta pairs', async () => {
    const change = 'dup';
    await ensureChange(change);
    await writeTarget('src/a.test.ts');
    await writeTarget('src/b.test.ts');
    await writePair('delta', change, 'behavior/a', {
      spec: specDoc('behavior.dup'),
      enforcement: coveredEnforcement('behavior.dup', 'src/a.test.ts'),
    });
    await writePair('delta', change, 'behavior/b', {
      spec: specDoc('behavior.dup'),
      enforcement: coveredEnforcement('behavior.dup', 'src/b.test.ts'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
  });
});

describe('governed archive — explicit bypass', () => {
  it('archives despite unready enforcement and reports unverified-bypass', async () => {
    const change = 'bypass';
    await ensureChange(change);
    await writeTarget('src/p.test.ts');
    // Planned binding would normally block; --no-validate --yes bypasses.
    await writePair('delta', change, 'behavior/planned', {
      spec: specDoc('behavior.planned'),
      enforcement: plannedEnforcement('behavior.planned', 'src/p.test.ts'),
    });

    const out = await runArchive(change, { noValidate: true });

    expect(out.archive).not.toBeNull();
    expect(out.archive.governed.verification).toBe('unverified-bypass');
    expect(await exists(`openspec/changes/${change}`)).toBe(false);
    // The pair was still written coherently.
    expect(await exists('openspec/specs/behavior/planned/spec.md')).toBe(true);
  });
});

describe('governed archive — legacy path unchanged', () => {
  it('does not emit a governed report under the legacy spec model', async () => {
    // Switch the project to the legacy flat schema.
    await fs.writeFile(path.join(tempDir, 'openspec', 'config.yaml'), 'schema: spec-driven\n');
    const change = 'legacy';
    await ensureChange(change);

    const out = await runArchive(change);

    expect(out.archive).not.toBeNull();
    expect(out.archive.governed).toBeUndefined();
    expect(await exists(`openspec/changes/${change}`)).toBe(false);
  });
});

describe('governed archive — human (non-JSON) output', () => {
  it('prints the pair summary and retired-target candidate in human mode', async () => {
    const change = 'human-ok';
    await ensureChange(change);
    await writeTarget('src/r.test.ts');
    await writeTarget('src/r2.test.ts');
    await writePair('current', change, 'behavior/multi', {
      spec: twoReqSpecDoc('behavior.multi'),
      enforcement: twoBindingEnforcement('behavior.multi', 'src/r.test.ts', 'src/r2.test.ts'),
    });
    await writePair('delta', change, 'behavior/multi', {
      spec: specDoc('behavior.multi'),
      enforcement: coveredEnforcement('behavior.multi', 'src/r.test.ts'),
    });

    await new ArchiveCommand().execute(change, { json: false, yes: true } as any);
    const out = logOutput.join('\n');

    expect(out).toContain('Updated behavior/multi');
    expect(out).toContain('retired-target candidate: src/r2.test.ts');
    expect(out).toContain(`Change '${change}' archived`);
    expect(await exists(`openspec/changes/${change}`)).toBe(false);
  });

  it('prints blockers and aborts (exit 1) in human mode without moving the change', async () => {
    const change = 'human-block';
    await ensureChange(change);
    await writePair('delta', change, 'behavior/hang', {
      spec: specDoc('behavior.hang'),
      enforcement: hangingEnforcement('behavior.hang'),
    });

    await new ArchiveCommand().execute(change, { json: false, yes: true } as any);
    const out = logOutput.join('\n');

    expect(out).toContain('not ready to archive');
    expect(process.exitCode).toBe(1);
    expect(await exists(`openspec/changes/${change}`)).toBe(true);
    expect(await exists('openspec/specs/behavior/hang/spec.md')).toBe(false);
    process.exitCode = 0;
  });
});
