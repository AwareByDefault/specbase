/**
 * Golden-corpus parity for the STE rule engine (binding `ste-lint-golden-corpus`).
 *
 * `reference/ste-lint.py` is the executable specification of the STE rule set.
 * Its JSON output over the shared corpus under `test/fixtures/ste-lint/corpus/`
 * is committed as `test/fixtures/ste-lint/golden.json`; this test drives the TS
 * port (`lint`) over the same corpus and asserts it reproduces the reference's
 * metric fields and category counts byte-for-byte. Because the reference strips
 * fenced and inline code before scoring, the parity on `code-spans.md` is what
 * enforces the `code-spans-excluded` claim: every marker word there sits inside
 * a code span, so it contributes zero violations.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../../src/core/ste/lint.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const fixtureRoot = path.join(repoRoot, 'test', 'fixtures', 'ste-lint');

const golden = JSON.parse(
  readFileSync(path.join(fixtureRoot, 'golden.json'), 'utf-8')
) as Record<string, Record<string, unknown>>;

const METRIC_FIELDS = [
  'words',
  'sentences',
  'total',
  'total_per100w',
  'em_dash(slop-marker)',
  'longest_sentence_words',
] as const;

for (const name of Object.keys(golden)) {
  test(`matches the reference linter for ${name}`, () => {
    const text = readFileSync(path.join(fixtureRoot, 'corpus', name), 'utf-8');
    const want = golden[name];
    const got = lint(text);

    for (const field of METRIC_FIELDS) {
      expect(got[field], `${name}: ${field}`).toBe(want[field]);
    }
    expect(got.violations).toEqual(want.violations);
    expect(got.sample_marketing).toEqual(want.sample_marketing);
    expect(got.sample_banned).toEqual(want.sample_banned);
  });
}

test('code spans contribute no violations and no density (code-spans-excluded)', () => {
  // Every forbidden word in code-spans.md sits inside a fenced/inline code span:
  // the raw text contains them, but the scored document must be clean, proving
  // code content contributes no violations and no words to the metric.
  const text = readFileSync(
    path.join(fixtureRoot, 'corpus', 'code-spans.md'),
    'utf-8'
  );
  expect(text).toMatch(/utilize/);
  expect(text).toMatch(/cutting-edge/);

  const result = lint(text);
  expect(result.violations['banned_word']).toBe(0);
  expect(result.violations['marketing_adjective']).toBe(0);
  expect(result.total).toBe(0);
  expect(result.total_per100w).toBe(0);
});