import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ArchiveCommand } from '../../src/core/archive.js';
import { parseGovernedSpec, parseEnforcement } from '../../src/core/governed/index.js';

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

/** A single active binding `bid` covering `cover`, targeting one file. */
function bindingEnforcement(id: string, bid: string, cover: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: ${bid}\n    covers: [${cover}]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

// --- Governed DELTA authoring helpers -------------------------------------
// A change authors OPERATION fragments (## ADDED/MODIFIED/REMOVED/RENAMED),
// NOT the full next state. Archive merges these onto the current pair by
// stable ID, preserving unaffected content.

/** DELTA spec.md: `## ADDED Requirements` with one new requirement `r`/`s`. */
function deltaAdded(id: string, title = 'R'): string {
  return `---\nid: ${id}\n---\n\n## ADDED Requirements\n\n### Requirement: ${title}\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

/** DELTA spec.md: `## ADDED Requirements` adding requirement `r3`/`s3`. */
function deltaAddR3(id: string): string {
  return `---\nid: ${id}\n---\n\n## ADDED Requirements\n\n### Requirement: R3\n**ID:** \`r3\`\nThe system MUST do Z.\n#### Scenario: S3\n**ID:** \`s3\`\n- **WHEN** e\n- **THEN** f\n`;
}

/** DELTA spec.md: `## MODIFIED Requirements` replacing `r` (new title/body). */
function deltaModified(id: string, title: string): string {
  return `---\nid: ${id}\n---\n\n## MODIFIED Requirements\n\n### Requirement: ${title}\n**ID:** \`r\`\nThe system MUST do X, revised.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

/** DELTA spec.md: `## REMOVED Requirements` dropping requirement `r2`. */
function deltaRemovedR2(id: string): string {
  return `---\nid: ${id}\n---\n\n## REMOVED Requirements\n\n### Requirement: R2\n**ID:** \`r2\`\n**Reason:** superseded\n`;
}

/** DELTA spec.md: `## RENAMED Requirements` retitling requirement `r`. */
function deltaRenamed(id: string, fromTitle: string, toTitle: string): string {
  return `---\nid: ${id}\n---\n\n## RENAMED Requirements\n\n- FROM: \`### Requirement: ${fromTitle}\`\n- TO: \`### Requirement: ${toTitle}\`\n`;
}

/** DELTA enforcement.md that explicitly retires binding `b2` via `remove:`. */
function removeB2Enforcement(id: string): string {
  return `# Enforcement (delta)\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings: []\nremove:\n  - b2\n\`\`\`\n`;
}

async function writeConfig(): Promise<void> {
  const specbase = path.join(tempDir, 'specbase');
  await fs.mkdir(specbase, { recursive: true });
  await fs.writeFile(path.join(specbase, 'config.yaml'), `schema: ${GOVERNED_SCHEMA}\n`);
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
      ? path.join(tempDir, 'specbase', 'changes', change)
      : path.join(tempDir, 'specbase');
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
  await fs.mkdir(path.join(tempDir, 'specbase', 'changes', change), { recursive: true });
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
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-archive-gov-'));
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
    // Delta MODIFIES the requirement (same stable ID `r`, new title/body).
    await writePair('delta', change, 'behavior/session-loop', {
      spec: deltaModified('behavior.session-loop', 'New title'),
      enforcement: coveredEnforcement('behavior.session-loop', 'src/loop.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive).not.toBeNull();
    expect(out.archive.governed.verification).toBe('verified');
    // Current spec updated with the new title (reconciled by stable ID `r`).
    const merged = await read('specbase/specs/behavior/session-loop/spec.md');
    expect(merged).toContain('New title');
    expect(merged).not.toContain('Old title');
    // The merged spec is a clean governed spec (no delta operation headers).
    expect(merged).not.toContain('## MODIFIED');
    // Change moved to archive.
    expect(await exists(`specbase/changes/${change}`)).toBe(false);
    expect(await exists(`specbase/changes/archive`)).toBe(true);
  });
});

describe('governed archive — reconciliation and reporting', () => {
  it('creates a new current pair from a delta with no current counterpart', async () => {
    const change = 'add-domain';
    await ensureChange(change);
    await writeTarget('src/domain.test.ts');
    await writePair('delta', change, 'architecture/domain', {
      spec: deltaAdded('architecture.domain'),
      enforcement: coveredEnforcement('architecture.domain', 'src/domain.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    expect(await exists('specbase/specs/architecture/domain/spec.md')).toBe(true);
    expect(await exists('specbase/specs/architecture/domain/enforcement.md')).toBe(true);
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
    expect(await exists('specbase/specs/behavior/new-loop/spec.md')).toBe(true);
    expect(await exists('specbase/specs/behavior/old-loop/spec.md')).toBe(false);
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
    // Delta REMOVES requirement r2 and explicitly retires its binding b2.
    await writePair('delta', change, 'behavior/multi', {
      spec: deltaRemovedR2('behavior.multi'),
      enforcement: removeB2Enforcement('behavior.multi'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    const [pair] = out.archive.governed.pairs;
    expect(pair.normativeOps.removed).toBe(1);
    expect(pair.bindingOps.removed).toBe(1);
    const retired = pair.retiredTargets.find((c: any) => c.path === 'src/r2.test.ts');
    expect(retired).toBeDefined();
    expect(retired.stillReferenced).toBe(false);
    // r (and its binding b) were untouched — only r2/b2 were removed.
    const merged = await read('specbase/specs/behavior/multi/spec.md');
    expect(merged).toContain('**ID:** `r`');
    expect(merged).not.toContain('**ID:** `r2`');
    // The project code is never deleted by archive.
    expect(await exists('src/r2.test.ts')).toBe(true);
  });
});

describe('governed archive — delta operations merge by stable ID (no silent loss)', () => {
  it('ADDED-only delta preserves existing requirements AND bindings (dogfood repro)', async () => {
    const change = 'add-kelvin';
    await ensureChange(change);
    await writeTarget('src/r.test.ts');
    await writeTarget('src/r2.test.ts');
    await writeTarget('src/r3.test.ts');
    // Current pair: two requirements (r, r2) and two bindings (b, b2).
    await writePair('current', change, 'behavior/temp', {
      spec: twoReqSpecDoc('behavior.temp'),
      enforcement: twoBindingEnforcement('behavior.temp', 'src/r.test.ts', 'src/r2.test.ts'),
    });
    // Delta ADDS one requirement (r3) and one binding (b3) — nothing else stated.
    await writePair('delta', change, 'behavior/temp', {
      spec: deltaAddR3('behavior.temp'),
      enforcement: bindingEnforcement('behavior.temp', 'b3', 'r3', 'src/r3.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    const [pair] = out.archive.governed.pairs;
    // Reported ops reflect the ACTUAL operation, not a full-replace diff.
    expect(pair.normativeOps).toMatchObject({ added: 1, modified: 0, removed: 0, renamed: 0 });
    expect(pair.bindingOps).toMatchObject({ added: 1, modified: 0, removed: 0 });

    // Merged spec: the original 2 requirements are preserved plus the new one.
    const mergedSpec = await read('specbase/specs/behavior/temp/spec.md');
    expect(mergedSpec).not.toContain('## ADDED'); // clean governed spec, not a delta
    const parsedSpec = parseGovernedSpec(mergedSpec);
    expect(parsedSpec.issues).toEqual([]);
    expect(parsedSpec.requirements.map((r) => r.id).sort()).toEqual(['r', 'r2', 'r3']);

    // Merged enforcement: the original 2 bindings are preserved plus the new one.
    const mergedEnf = parseEnforcement(await read('specbase/specs/behavior/temp/enforcement.md'));
    expect(mergedEnf.issues).toEqual([]);
    expect(mergedEnf.bindings.map((b) => b.id).sort()).toEqual(['b', 'b2', 'b3']);
  });

  it('MODIFIED delta replaces the requirement with that id, leaving others untouched', async () => {
    const change = 'modify-r';
    await ensureChange(change);
    await writeTarget('src/r.test.ts');
    await writeTarget('src/r2.test.ts');
    await writePair('current', change, 'behavior/multi', {
      spec: twoReqSpecDoc('behavior.multi'),
      enforcement: twoBindingEnforcement('behavior.multi', 'src/r.test.ts', 'src/r2.test.ts'),
    });
    await writePair('delta', change, 'behavior/multi', {
      spec: deltaModified('behavior.multi', 'R renamed and revised'),
      enforcement: twoBindingEnforcement('behavior.multi', 'src/r.test.ts', 'src/r2.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    const merged = await read('specbase/specs/behavior/multi/spec.md');
    const parsed = parseGovernedSpec(merged);
    expect(parsed.issues).toEqual([]);
    // r was replaced (new title/body), r2 preserved verbatim.
    expect(parsed.requirements.map((r) => r.id).sort()).toEqual(['r', 'r2']);
    expect(merged).toContain('R renamed and revised');
    expect(merged).toContain('The system MUST do X, revised.');
    expect(merged).toContain('The system MUST do Y.'); // r2 body untouched
  });

  it('REMOVED delta drops the requirement by id and reports it (not silent)', async () => {
    const change = 'remove-r2';
    await ensureChange(change);
    await writeTarget('src/r.test.ts');
    await writeTarget('src/r2.test.ts');
    await writePair('current', change, 'behavior/multi', {
      spec: twoReqSpecDoc('behavior.multi'),
      enforcement: twoBindingEnforcement('behavior.multi', 'src/r.test.ts', 'src/r2.test.ts'),
    });
    await writePair('delta', change, 'behavior/multi', {
      spec: deltaRemovedR2('behavior.multi'),
      enforcement: removeB2Enforcement('behavior.multi'),
    });

    const out = await runArchive(change);

    const [pair] = out.archive.governed.pairs;
    // The removal is surfaced explicitly in the reported operation counts.
    expect(pair.normativeOps.removed).toBe(1);
    const parsed = parseGovernedSpec(await read('specbase/specs/behavior/multi/spec.md'));
    expect(parsed.requirements.map((r) => r.id)).toEqual(['r']);
  });

  it('RENAMED delta keeps the stable id and changes only the title', async () => {
    const change = 'rename-r';
    await ensureChange(change);
    await writeTarget('src/loop.test.ts');
    await writePair('current', change, 'behavior/loop', {
      spec: specDoc('behavior.loop', 'Original title'),
      enforcement: coveredEnforcement('behavior.loop', 'src/loop.test.ts'),
    });
    await writePair('delta', change, 'behavior/loop', {
      spec: deltaRenamed('behavior.loop', 'Original title', 'Fresh title'),
      enforcement: coveredEnforcement('behavior.loop', 'src/loop.test.ts'),
    });

    const out = await runArchive(change);

    expect(out.archive.governed.verification).toBe('verified');
    const parsed = parseGovernedSpec(await read('specbase/specs/behavior/loop/spec.md'));
    expect(parsed.issues).toEqual([]);
    // Same stable id `r`, new title, scenario `s` preserved.
    expect(parsed.requirements).toHaveLength(1);
    expect(parsed.requirements[0].id).toBe('r');
    expect(parsed.requirements[0].title).toBe('Fresh title');
    expect(parsed.requirements[0].scenarios.map((s) => s.id)).toEqual(['s']);
  });

  it('blocks a MODIFIED delta whose id does not exist in the current spec', async () => {
    const change = 'modify-missing';
    await ensureChange(change);
    await writeTarget('src/r.test.ts');
    await writePair('current', change, 'behavior/only-r', {
      spec: specDoc('behavior.only-r'),
      enforcement: coveredEnforcement('behavior.only-r', 'src/r.test.ts'),
    });
    // MODIFIED targets `nope` (id not present) — must not silently no-op.
    await writePair('delta', change, 'behavior/only-r', {
      spec: `---\nid: behavior.only-r\n---\n\n## MODIFIED Requirements\n\n### Requirement: Ghost\n**ID:** \`nope\`\nThe system MUST do nothing.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`,
      enforcement: coveredEnforcement('behavior.only-r', 'src/r.test.ts'),
    });

    const out = await runArchive(change);
    expect(out.archive).toBeNull();
    expect(out.status[0].code).toBe('archive_governed_merge_conflict');
    expect(process.exitCode).toBe(1);
    expect(await exists(`specbase/changes/${change}`)).toBe(true);
    process.exitCode = 0;
  });
});

describe('governed archive — blocking conditions (no writes, change not moved)', () => {
  async function expectBlocked(change: string, code: string): Promise<void> {
    const out = await runArchive(change);
    expect(out.archive).toBeNull();
    expect(out.status[0].code).toBe(code);
    expect(process.exitCode).toBe(1);
    // The change was NOT moved to archive.
    expect(await exists(`specbase/changes/${change}`)).toBe(true);
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
      spec: deltaAdded('behavior.hang'),
      enforcement: hangingEnforcement('behavior.hang'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
    expect(await exists('specbase/specs/behavior/hang/spec.md')).toBe(false);
  });

  it('blocks a stale coverage reference', async () => {
    const change = 'stale';
    await ensureChange(change);
    await writeTarget('src/s.test.ts');
    await writePair('delta', change, 'behavior/stale', {
      spec: deltaAdded('behavior.stale'),
      enforcement: staleEnforcement('behavior.stale', 'src/s.test.ts'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
  });

  it('blocks a missing active target (broken enforcement)', async () => {
    const change = 'broken';
    await ensureChange(change);
    await writePair('delta', change, 'behavior/broken', {
      spec: deltaAdded('behavior.broken'),
      enforcement: coveredEnforcement('behavior.broken', 'src/missing.test.ts'),
    });
    await expectBlocked(change, 'archive_governed_not_ready');
  });

  it('blocks an unresolved planned binding', async () => {
    const change = 'planned';
    await ensureChange(change);
    await writeTarget('src/p.test.ts');
    await writePair('delta', change, 'behavior/planned', {
      spec: deltaAdded('behavior.planned'),
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
      spec: deltaAdded('behavior.dup'),
      enforcement: coveredEnforcement('behavior.dup', 'src/a.test.ts'),
    });
    await writePair('delta', change, 'behavior/b', {
      spec: deltaAdded('behavior.dup'),
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
      spec: deltaAdded('behavior.planned'),
      enforcement: plannedEnforcement('behavior.planned', 'src/p.test.ts'),
    });

    const out = await runArchive(change, { noValidate: true });

    expect(out.archive).not.toBeNull();
    expect(out.archive.governed.verification).toBe('unverified-bypass');
    expect(await exists(`specbase/changes/${change}`)).toBe(false);
    // The pair was still written coherently.
    expect(await exists('specbase/specs/behavior/planned/spec.md')).toBe(true);
  });
});

describe('governed archive — legacy path unchanged', () => {
  it('does not emit a governed report under the legacy spec model', async () => {
    // Switch the project to the legacy flat schema.
    await fs.writeFile(path.join(tempDir, 'specbase', 'config.yaml'), 'schema: spec-driven\n');
    const change = 'legacy';
    await ensureChange(change);

    const out = await runArchive(change);

    expect(out.archive).not.toBeNull();
    expect(out.archive.governed).toBeUndefined();
    expect(await exists(`specbase/changes/${change}`)).toBe(false);
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
      spec: deltaRemovedR2('behavior.multi'),
      enforcement: removeB2Enforcement('behavior.multi'),
    });

    await new ArchiveCommand().execute(change, { json: false, yes: true } as any);
    const out = logOutput.join('\n');

    expect(out).toContain('Updated behavior/multi');
    expect(out).toContain('retired-target candidate: src/r2.test.ts');
    expect(out).toContain(`Change '${change}' archived`);
    expect(await exists(`specbase/changes/${change}`)).toBe(false);
  });

  it('prints blockers and aborts (exit 1) in human mode without moving the change', async () => {
    const change = 'human-block';
    await ensureChange(change);
    await writePair('delta', change, 'behavior/hang', {
      spec: deltaAdded('behavior.hang'),
      enforcement: hangingEnforcement('behavior.hang'),
    });

    await new ArchiveCommand().execute(change, { json: false, yes: true } as any);
    const out = logOutput.join('\n');

    expect(out).toContain('not ready to archive');
    expect(process.exitCode).toBe(1);
    expect(await exists(`specbase/changes/${change}`)).toBe(true);
    expect(await exists('specbase/specs/behavior/hang/spec.md')).toBe(false);
    process.exitCode = 0;
  });
});
