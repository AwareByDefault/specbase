import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  BEGIN_MARKER,
  END_MARKER,
  MANIFESTOS,
  OUTPUT_RELATIVE_PATH,
  REPO_ROOT,
  extractRules,
} from '../scripts/generate-clean-rules.mjs';

/**
 * Binding `rules-single-source` (spec `agents.clean-manifesto`).
 *
 * Proves the manifestos are the ONLY authored home of the injected authoring
 * rules: each exposes exactly one well-formed marked Rules section, the skill
 * generator reaches them through the generated module, and no source file under
 * `src/` keeps a second, hand-maintained copy of a rule.
 */

const GENERATOR_RELATIVE_PATH = path.join(
  'src',
  'core',
  'templates',
  'workflows',
  'governed-guidance.ts'
);

const SRC_ROOT = path.join(REPO_ROOT, 'src');

/** Repo-relative paths of every `.ts` file under `src/`. */
function collectSourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, found);
    } else if (entry.endsWith('.ts')) {
      found.push(path.relative(REPO_ROOT, full));
    }
  }
  return found;
}

/**
 * The rule sentences worth policing: multi-line bullets are joined back into one
 * line so a wrapped restatement is still detected, and short fragments are
 * dropped because they collide with ordinary prose.
 */
function ruleSentences(rules: string): string[] {
  return rules
    .split(/\n(?=- )/)
    .map((bullet) => bullet.trim())
    .filter((bullet) => bullet.startsWith('- '))
    .map((bullet) => bullet.replace(/\s+/g, ' ').slice(2))
    .filter((sentence) => sentence.length >= 40);
}

describe('clean manifesto rules have a single authored home', () => {
  describe('each manifesto exposes exactly one well-formed Rules section', () => {
    for (const manifesto of MANIFESTOS) {
      it(`${manifesto.sourceRelativePath} marks its rules exactly once`, () => {
        const markdown = readFileSync(
          path.join(REPO_ROOT, manifesto.sourceRelativePath),
          'utf8'
        );

        expect(markdown.split(BEGIN_MARKER).length - 1).toBe(1);
        expect(markdown.split(END_MARKER).length - 1).toBe(1);
        expect(markdown.indexOf(BEGIN_MARKER)).toBeLessThan(markdown.indexOf(END_MARKER));

        const rules = extractRules(markdown, manifesto.sourceRelativePath);
        expect(rules.length).toBeGreaterThan(0);
        expect(ruleSentences(rules).length).toBeGreaterThan(5);
      });
    }
  });

  it('the generator obtains the rules by importing the generated module', () => {
    const generator = readFileSync(path.join(REPO_ROOT, GENERATOR_RELATIVE_PATH), 'utf8');

    expect(generator).toContain("from './clean-rules.generated.js'");
    for (const manifesto of MANIFESTOS) {
      expect(generator).toContain(manifesto.exportName);
    }
  });

  it('no source file restates a rule as a literal outside the generated module', () => {
    const generatedPath = OUTPUT_RELATIVE_PATH;
    const sourceFiles = collectSourceFiles(SRC_ROOT).filter((file) => file !== generatedPath);

    const sentences = MANIFESTOS.flatMap((manifesto) =>
      ruleSentences(
        extractRules(
          readFileSync(path.join(REPO_ROOT, manifesto.sourceRelativePath), 'utf8'),
          manifesto.sourceRelativePath
        )
      )
    );

    const restatements: string[] = [];
    for (const file of sourceFiles) {
      const normalized = readFileSync(path.join(REPO_ROOT, file), 'utf8').replace(/\s+/g, ' ');
      for (const sentence of sentences) {
        if (normalized.includes(sentence)) {
          restatements.push(`${file}: ${sentence}`);
        }
      }
    }

    expect(restatements).toEqual([]);
  });
});
