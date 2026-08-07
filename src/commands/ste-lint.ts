/**
 * `specbase ste-lint` — the Simplified Technical English (STE) linter, a TS
 * port of `reference/ste-lint.py` (this change's executable spec; see
 * `behavior.cli.ste-lint`). It scores prose from files, globs, or stdin,
 * reports a per-document violation breakdown plus a normalized `total_per100w`
 * density, and — on `--json` — writes exactly one machine-readable aggregate
 * document to stdout with all decoration suppressed.
 *
 * `--max <n>` turns the pure reporter into an automated gate, mirroring
 * `coverage --strict`: when any document's `total_per100w` exceeds `<n>` the
 * command names the offending documents and exits non-zero; without `--max` it
 * always exits zero and stays a reporter.
 *
 * The engine's `severities` classify banned words and marketing adjectives as
 * errors and stylistic categories as warnings; the document report carries each
 * category's count and severity so blockers and stylistic churn stay distinct.
 */
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { lint, type LintResult } from '../core/ste/lint.js';
import type { Severity } from '../core/ste/types.js';

export interface SteLintOptions {
  json?: boolean;
  max?: number;
}

/** One scored document's report: counts and severity per category. */
export interface DocumentReport {
  name: string;
  words: number;
  sentences: number;
  total: number;
  total_per100w: number;
  em_dash: number;
  longest_sentence_words: number;
  violations: Record<string, { count: number; severity: Severity }>;
  sample_marketing: string[];
  sample_banned: string[];
}

/** The aggregate view across every scored document, plus the gate result. */
export interface SteLintView {
  documents: DocumentReport[];
  aggregate: {
    documents: number;
    words: number;
    sentences: number;
    total: number;
    total_per100w: number;
  };
  max: number | null;
  gated: boolean;
  offending: string[];
}

function round(value: number, precision: number): number {
  const f = 10 ** precision;
  return Math.round(value * f) / f;
}

function toReport(name: string, result: LintResult): DocumentReport {
  const violations = Object.fromEntries(
    Object.entries(result.violations).map(([category, count]) => [
      category,
      { count, severity: result.severities[category] ?? 'warning' },
    ])
  );
  return {
    name,
    words: result.words,
    sentences: result.sentences,
    total: result.total,
    total_per100w: result.total_per100w,
    em_dash: result['em_dash(slop-marker)'],
    longest_sentence_words: result.longest_sentence_words,
    violations,
    sample_marketing: result.sample_marketing,
    sample_banned: result.sample_banned,
  };
}

function buildAggregate(docs: DocumentReport[], max: number | null): SteLintView {
  const words = docs.reduce((n, d) => n + d.words, 0);
  const sentences = docs.reduce((n, d) => n + d.sentences, 0);
  const total = docs.reduce((n, d) => n + d.total, 0);
  const density = docs.length === 0 ? 0 : round((total * 100) / words, 2);
  const offending =
    max === null ? [] : docs.filter((d) => d.total_per100w > max).map((d) => d.name);
  return {
    documents: docs,
    aggregate: {
      documents: docs.length,
      words,
      sentences,
      total,
      total_per100w: density,
    },
    max,
    gated: max !== null && offending.length > 0,
    offending,
  };
}

export class SteLintCommand {
  async execute(fileArgs: string[], options: SteLintOptions = {}): Promise<void> {
    const parsedMax = options.max === undefined ? null : options.max;
    const docs = await this.collectDocuments(fileArgs, options.json === true);
    if (docs === null) return;

    const reports = docs.map(([name, text]) => [name, lint(text)] as const);
    const view = buildAggregate(
      reports.map(([name, result]) => toReport(name, result)),
      parsedMax
    );

    if (options.json) {
      console.log(JSON.stringify(view, null, 2));
    } else {
      this.printHuman(view);
    }

    if (view.gated) {
      process.exitCode = 1;
    }
  }

  /**
   * Resolve the positional file/glob args, or fall back to stdin when no path
   * is given (the piped text is scored as a single `<stdin>` document).
   * Returns null (after setting the exit code) when paths matched nothing.
   */
  private async collectDocuments(
    fileArgs: string[],
    json: boolean
  ): Promise<Array<[string, string]> | null> {
    if (fileArgs.length === 0) {
      return [['<stdin>', readStdin()]];
    }

    const expanded: string[] = [];
    for (const arg of fileArgs) {
      if (/[*?[]/.test(arg)) {
        const matches = await fg([arg], { dot: false, onlyFiles: true });
        expanded.push(...matches.sort());
      } else {
        expanded.push(arg);
      }
    }

    if (expanded.length === 0) {
      const message = `No files matched the given path(s): ${fileArgs.join(', ')}`;
      if (json) {
        // Parent `behavior.cli` contract: a --json failure still leaves one
        // JSON document on stdout (the null-shape plus a status array).
        console.log(
          JSON.stringify(
            {
              documents: [],
              aggregate: { documents: 0, words: 0, sentences: 0, total: 0, total_per100w: 0 },
              max: null,
              gated: false,
              offending: [],
              status: [{ severity: 'error', code: 'no_files', message }],
            },
            null,
            2
          )
        );
      } else {
        console.error(message);
      }
      process.exitCode = 1;
      return null;
    }

    const docs: Array<[string, string]> = [];
    for (const file of expanded) {
      try {
        const text = await fs.readFile(file, 'utf-8');
        docs.push([path.basename(file), text]);
      } catch (error) {
        const message = `Cannot read ${file}: ${(error as Error).message}`;
        if (json) {
          console.log(
            JSON.stringify(
              {
                documents: [],
                aggregate: { documents: 0, words: 0, sentences: 0, total: 0, total_per100w: 0 },
                max: null,
                gated: false,
                offending: [],
                status: [{ severity: 'error', code: 'read_failed', message }],
              },
              null,
              2
            )
          );
        } else {
          console.error(message);
        }
        process.exitCode = 1;
        return null;
      }
    }
    return docs;
  }

  private printHuman(view: SteLintView): void {
    for (const doc of view.documents) {
      console.log(`STE lint: ${doc.name}`);
      console.log(
        `  words=${doc.words} sentences=${doc.sentences} total=${doc.total} ` +
          `per100w=${doc.total_per100w} em_dash=${doc.em_dash}`
      );
      const errors = Object.entries(doc.violations).filter(
        ([, v]) => v.severity === 'error' && v.count > 0
      );
      const warnings = Object.entries(doc.violations).filter(
        ([, v]) => v.severity === 'warning' && v.count > 0
      );
      if (errors.length > 0) {
        console.error(`  errors: ${describeViolations(errors)}`);
      }
      if (warnings.length > 0) {
        console.error(`  warnings: ${describeViolations(warnings)}`);
      }
      console.log();
    }
    const a = view.aggregate;
    console.log(
      `Aggregate: ${a.documents} document(s), ${a.words} words, ${a.sentences} sentences, ` +
        `total=${a.total}, per100w=${a.total_per100w}`
    );
    if (view.gated) {
      console.error(`Max ${view.max} exceeded by: ${view.offending.join(', ')}`);
    }
  }
}

function describeViolations(
  entries: Array<[string, { count: number; severity: Severity }]>
): string {
  return entries.map(([category, v]) => `${category}=${v.count}`).join(', ');
}

/** Synchronously read all of stdin (the command's no-path input mode). */
function readStdin(): string {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}
