/**
 * `specbase ste-lint` end-to-end (behavior.cli.ste-lint, on stdout/exit-code
 * contract). Runs the built CLI: stdin is scored as a single `<stdin>` document
 * when no path is given; `--json` leaves exactly one JSON document on stdout
 * with no decoration; and `--max` gates the exit code (non-zero over, zero
 * within, zero without).
 */
import { afterAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { runCLI, cliProjectRoot } from '../helpers/run-cli.js';
import type { SteLintView } from '../../src/commands/ste-lint.js';

const corpus = path.join(cliProjectRoot, 'test', 'fixtures', 'ste-lint', 'corpus');
const tempRoots: string[] = [];

afterAll(async () => {
  await Promise.all(tempRoots.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('specbase ste-lint e2e', () => {
  it('scores piped stdin as a single document when no path is given', async () => {
    const input = 'Use robust words here. Utilize leverage to begin work.';
    const result = await runCLI(['ste-lint', '--json'], { input });
    expect(result.exitCode).toBe(0);
    const view = JSON.parse(result.stdout) as unknown as {
      documents: Array<{ name: string; violations: Record<string, { count: number }> }>;
    };
    expect(view.documents).toHaveLength(1);
    expect(view.documents[0].name).toBe('<stdin>');
    expect(view.documents[0].violations['banned_word'].count).toBeGreaterThan(0);
    expect(view.documents[0].violations['marketing_adjective'].count).toBeGreaterThan(0);
  });

  it('emits a single clean JSON aggregate on --json (no stderr decoration)', async () => {
    const result = await runCLI([
      'ste-lint',
      '--json',
      path.join(corpus, 'clean.md'),
      path.join(corpus, 'marketing-and-banned.md'),
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const view = JSON.parse(result.stdout) as unknown as SteLintView;
    expect(view.documents).toHaveLength(2);
    expect(view.aggregate.documents).toBe(2);
  });

  it('exits non-zero above --max and zero at or below it and with no --max', async () => {
    const dirty = path.join(corpus, 'marketing-and-banned.md');
    const over = await runCLI(['ste-lint', '--max', '1', dirty]);
    expect(over.exitCode).toBe(1);
    expect(over.stderr).toContain('exceeded');

    const within = await runCLI(['ste-lint', '--max', '1000', dirty]);
    expect(within.exitCode).toBe(0);

    const pure = await runCLI(['ste-lint', dirty]);
    expect(pure.exitCode).toBe(0);
  });

  it('reports error vs warning severity in the JSON violations', async () => {
    const result = await runCLI(['ste-lint', '--json', path.join(corpus, 'marketing-and-banned.md')]);
    expect(result.exitCode).toBe(0);
    const view = JSON.parse(result.stdout) as unknown as SteLintView;
    const collate = Object.fromEntries(
      Object.entries(view.documents[0].violations).map(([cat, v]) => [cat, v.severity])
    );
    expect(collate['banned_word']).toBe('error');
    expect(collate['marketing_adjective']).toBe('error');
    expect(collate['passive_voice']).toBe('warning');
    expect(collate['em_dash'] ?? collate['contraction']).toBeDefined();
  });
});