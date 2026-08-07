/**
 * `specbase ste-lint` command behavior (behavior.cli.ste-lint). Drives the
 * `SteLintCommand` in-process against a temp corpus: file args, a glob, stdin is
 * exercised at the e2e layer (stdin needs a child process), the clean `--json`
 * aggregate, `--max` gating (over/within/none), and error-vs-warning severity
 * classification.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SteLintCommand } from '../../src/commands/ste-lint.js';
import type { SteLintView } from '../../src/commands/ste-lint.js';

const CLEAN = '# Clean title\n\nThis document is clean. Each sentence stays short.';
const DIRTY =
  '# Seamless platform\n\nOur robust platform empowers users to unlock potential. ' +
  'It is important to note that we leverage a variety of tools.';

describe('ste-lint command', () => {
  let dir: string;
  let legacyExit: number;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'ste-lint-'));
    writeFileSync(path.join(dir, 'clean.md'), CLEAN);
    writeFileSync(path.join(dir, 'dirty.md'), DIRTY);
    legacyExit = process.exitCode;
    process.exitCode = 0;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    process.exitCode = legacyExit;
    vi.restoreAllMocks();
  });

  async function runJson(
    paths: string[],
    opts: { max?: number } = {}
  ): Promise<{ view: SteLintView; exitCode: number }> {
    let out = '';
    vi.spyOn(console, 'log').mockImplementation((c: string) => {
      out += `${c}\n`;
    });
    const command = new SteLintCommand();
    await command.execute(paths, { json: true, ...opts });
    const exitCode = process.exitCode;
    process.exitCode = 0;
    return { view: JSON.parse(out) as unknown as SteLintView, exitCode };
  }

  it('scores one or more file arguments and reports each by name', async () => {
    const { view } = await runJson([path.join(dir, 'clean.md'), path.join(dir, 'dirty.md')]);
    expect(view.documents.map((d) => d.name).sort()).toEqual(['clean.md', 'dirty.md']);
    expect(view.aggregate.documents).toBe(2);
    const clean = view.documents.find((d) => d.name === 'clean.md')!;
    const dirty = view.documents.find((d) => d.name === 'dirty.md')!;
    expect(clean.total_per100w).toBeLessThan(dirty.total_per100w);
  });

  it('expands a glob argument to every matched document', async () => {
    const { view } = await runJson([path.join(dir, '*.md')]);
    expect(view.documents.map((d) => d.name).sort()).toEqual(['clean.md', 'dirty.md']);
  });

  it('emits a single clean JSON aggregate and parses on stdout', async () => {
    const { view } = await runJson([path.join(dir, 'clean.md')]);
    expect(view.aggregate.documents).toBe(1);
    expect(typeof view.aggregate.total_per100w).toBe('number');
    expect(view.max).toBeNull();
    expect(view.gated).toBe(false);
  });

  it('exits non-zero when a document total_per100w exceeds --max', async () => {
    const { view, exitCode } = await runJson([path.join(dir, 'dirty.md')], { max: 1 });
    expect(view.gated).toBe(true);
    expect(view.offending).toContain('dirty.md');
    expect(exitCode).toBe(1);
  });

  it('exits zero when within the --max threshold', async () => {
    const { view, exitCode } = await runJson([path.join(dir, 'clean.md')], { max: 0 });
    expect(view.offending).toEqual([]);
    expect(view.gated).toBe(false);
    expect(exitCode).toBe(0);
  });

  it('exits zero without --max regardless of density (pure reporter)', async () => {
    const { exitCode } = await runJson([path.join(dir, 'dirty.md')]);
    expect(exitCode).toBe(0);
  });

  it('classifies banned words and marketing adjectives as errors, stylistics as warnings', async () => {
    const { view } = await runJson([path.join(dir, 'dirty.md')]);
    const doc = view.documents[0];
    expect(doc.violations['banned_word'].severity).toBe('error');
    expect(doc.violations['marketing_adjective'].severity).toBe('error');
    expect(doc.violations['passive_voice'].severity).toBe('warning');
    expect(doc.violations['contraction'].severity).toBe('warning');
    expect(doc.violations['long_sentence(>20w)'].severity).toBe('warning');
  });

  it('reports a shorter document with the same count as higher density', async () => {
    const short = '# Short\n\nThis piece uses leverage.';
    const long = '# Long\n\nThis piece uses leverage and has many extra words that pad it out.';
    writeFileSync(path.join(dir, 'short.md'), short);
    writeFileSync(path.join(dir, 'longt.md'), long);
    const { view } = await runJson([path.join(dir, 'short.md'), path.join(dir, 'longt.md')]);
    const shortDoc = view.documents.find((d) => d.name === 'short.md')!;
    const longDoc = view.documents.find((d) => d.name === 'longt.md')!;
    expect(shortDoc.total_per100w).toBeGreaterThan(longDoc.total_per100w);
  });
});