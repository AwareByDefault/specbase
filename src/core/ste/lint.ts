/**
 * Simplified Technical English (ASD-STE100) rule engine.
 *
 * This is the TypeScript port of `reference/ste-lint.py`, which is the
 * executable specification of the rule set. The reference's JSON output over a
 * shared corpus is pinned as the golden fixture (`test/fixtures/ste-lint/`),
 * and `lint()` must reproduce the reference's word/sentence segmentation,
 * code-span stripping, category counts, `total`, and `total_per100w` metric
 * exactly on that corpus.
 *
 * Severity is a Specbase addition to the reference (which only reports counts):
 * `banned_word` and `marketing_adjective` are errors by default; every
 * stylistic category is a warning unless a threshold promotes it.
 */
import type { Severity, ViolationCategory } from './types.js';

// --- Static rule lexicons (verbatim from reference/ste-lint.py). Keep in
// sync with the reference; the golden corpus pins the port to them. --------

const MARKETING: string[] = [
  'seamless', 'seamlessly', 'robust', 'powerful', 'cutting-edge', 'effortless', 'effortlessly',
  'world-class', 'next-generation', 'revolutionary', 'blazing', 'lightning-fast', 'elegant', 'delightful',
  'turnkey', 'best-in-class', 'state-of-the-art', 'game-changing', 'first-class', 'battle-tested',
  'enterprise-grade', 'supercharge', 'unlock', 'unleash', 'empower', 'empowers',
];

const BANNED: string[] = [
  'begin', 'begins', 'commence', 'commences', 'initiate', 'initiates', 'originate',
  'utilize', 'utilizes', 'utilizing', 'leverage', 'leverages', 'leveraging', 'facilitate', 'facilitates',
  'ensure', 'ensures', 'ensuring', 'prior to', 'subsequent to', 'obtain', 'obtains', 'acquire', 'acquires',
  'demonstrate', 'demonstrates', 'additionally', 'furthermore', 'moreover', 'comprehensive', 'comprehensively',
  'utilization', 'aforementioned', 'henceforth', 'therein', 'whilst', 'amongst', 'numerous', 'myriad', 'plethora',
  'in order to', 'a variety of', 'in the event that', 'due to the fact that', 'it is important to note',
];

const PHRASAL: string[] = [
  'spin up', 'spin down', 'reach out', 'dive into', 'dives into', 'diving into', 'kick off', 'kicks off',
  'roll out', 'rolls out', 'tear down', 'ramp up', 'circle back', 'drill down', 'spun up', 'reaching out',
];

const MODAL_HEDGE: string[] = [
  'it is important to note', 'it is worth noting', 'please note that',
  'as mentioned', 'as noted above', 'it should be noted',
];

const BE = '(?:am|is|are|was|were|be|been|being)';
// NOTE: this matches the reference exactly, including the PP_IRREG alternation
// that the passive_voice and ing_main_verb rules share.
const PP_IRREG =
  '(?:done|made|sent|read|built|kept|held|set|put|run|written|shown|given|taken|found|got|gotten|seen|known|thrown|drawn)';

/** The categories that are errors by default (banned words, marketing). */
export const ERROR_CATEGORIES: ReadonlySet<ViolationCategory> = new Set([
  'banned_word',
  'marketing_adjective',
]);

/** A category's default severity: informational categories gate only when a threshold promotes them. */
export function severityOf(category: string): Severity {
  return ERROR_CATEGORIES.has(category as ViolationCategory) ? 'error' : 'warning';
}

/** The full ordered category list the engine scores, in report order. */
export const VIOLATION_CATEGORIES: ViolationCategory[] = [
  'long_sentence(>20w)',
  'semicolon',
  'contraction',
  'passive_voice',
  'ing_main_verb',
  'nominalization',
  'phrasal_verb',
  'banned_word',
  'marketing_adjective',
  'modal_hedge',
  'long_paragraph(>6s)',
];

/** Strip fenced and inline code spans so code never counts as prose. */
export function stripCode(text: string): string {
  let t = text.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`[^`]*`/g, ' ');
  return t;
}

/** Split prose into sentences, mirroring `sentences()` in the reference. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    let s = line.trim();
    if (!s) continue;
    s = s.replace(/^\s*#{1,6}\s*/, '');
    s = s.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '');
    if (!s) continue;
    const parts = s.split(/(?<=[.!?:])\s+(?=[A-Z0-9"'\-])/);
    for (const part of parts) {
      const p = part.trim();
      if (p) out.push(p);
    }
  }
  return out;
}

/** Word count for one sentence, matching the reference's `wc`. */
export function wordCount(s: string): number {
  return s.match(/[A-Za-z0-9][A-Za-z0-9'\-/]*/g)?.length ?? 0;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive word-boundary phrase counting, mirroring `count_ci`. */
function countCi(text: string, phrases: string[]): { count: number; hits: string[] } {
  const low = text.toLowerCase();
  let count = 0;
  const hits: string[] = [];
  for (const ph of phrases) {
    const re = new RegExp(`(?<![a-z])${escapeRegExp(ph)}(?![a-z])`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(low)) !== null) {
      count += 1;
      hits.push(ph);
    }
  }
  return { count, hits };
}

/** Round to `precision` decimal places like Python's `round(x, 2)`. */
function round(value: number, precision: number): number {
  const f = 10 ** precision;
  return Math.round(value * f) / f;
}

/** First `n` distinct hits, preserving first-seen order ([:6]). */
function uniqueHead(hits: string[], n: number): string[] {
  return [...new Set(hits)].slice(0, n);
}

function countEmDashes(raw: string): number {
  return raw.split('—').length - 1 + (raw.split('–').length - 1);
}

function longestSentenceWords(
  longs: Array<readonly [number, string]>,
  sents: string[]
): number {
  if (longs.length === 0) {
    return sents.reduce((max, s) => Math.max(max, wordCount(s)), 0);
  }
  return longs[0][0];
}

export type LintResult = {
  words: number;
  sentences: number;
  violations: Record<string, number>;
  total: number;
  total_per100w: number;
  'em_dash(slop-marker)': number;
  longest_sentence_words: number;
  sample_marketing: string[];
  sample_banned: string[];
  /** Per-category severity (error | warning). */
  severities: Record<string, Severity>;
};

/**
 * Score a text against the STE rule set. Returns the reference's metric fields
 * plus a `severities` record. Code spans are stripped before scoring, so code
 * content never contributes violations or words.
 */
export function lint(text: string): LintResult {
  const raw = text;
  const stripped = stripCode(text);
  const sents = sentences(stripped);
  const words = sents.reduce((sum, s) => sum + wordCount(s), 0) || 1;

  const longs = sents
    .map((s) => [wordCount(s), s] as const)
    .filter(([n]) => n > 20);

  const v: Record<string, number> = {};

  v['long_sentence(>20w)'] = longs.length;
  v['semicolon'] = stripped.match(/;/g)?.length ?? 0;
  v['contraction'] = stripped.match(/\b\w+['’](?:t|re|ve|ll|d|s|m)\b/gi)?.length ?? 0;
  v['passive_voice'] =
    stripped.match(new RegExp(`\\b${BE}\\s+(?:\\w+ed|${PP_IRREG})\\b`, 'gi'))?.length ?? 0;
  v['ing_main_verb'] =
    stripped.match(new RegExp(`\\b${BE}\\s+\\w+ing\\b`, 'gi'))?.length ?? 0;
  v['nominalization'] =
    (stripped.match(
      /\b(?:perform(?:s|ed)?|conduct(?:s|ed)?|provide(?:s|d)?|carry out|carries out|make use of|makes use of)\b/gi
    )?.length ?? 0) +
    (stripped.match(/\b\w{4,}(?:tion|ment|ance|ence)\s+of\b/gi)?.length ?? 0);
  v['phrasal_verb'] = countCi(stripped, PHRASAL).count;

  const banned = countCi(stripped, BANNED);
  v['banned_word'] = banned.count;

  const marketing = countCi(stripped, MARKETING);
  v['marketing_adjective'] = marketing.count;

  v['modal_hedge'] = countCi(stripped, MODAL_HEDGE).count;

  const paras = raw.split(/\n\s*\n/).filter((p) => p.trim());
  v['long_paragraph(>6s)'] = paras.reduce(
    (n, p) => (sentences(stripCode(p)).length > 6 ? n + 1 : n),
    0
  );

  const total = Object.values(v).reduce((a, b) => a + b, 0);

  return {
    words,
    sentences: sents.length,
    violations: v,
    total,
    total_per100w: round((total * 100) / words, 2),
    'em_dash(slop-marker)': countEmDashes(raw),
    longest_sentence_words: longestSentenceWords(longs, sents),
    sample_marketing: uniqueHead(marketing.hits, 6),
    sample_banned: uniqueHead(banned.hits, 6),
    severities: Object.fromEntries(
      VIOLATION_CATEGORIES.map((c) => [c, severityOf(c)])
    ),
  };
}