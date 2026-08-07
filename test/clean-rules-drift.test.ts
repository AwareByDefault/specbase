import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  BEGIN_MARKER,
  END_MARKER,
  MANIFESTOS,
  OUTPUT_RELATIVE_PATH,
  REPO_ROOT,
  extractRules,
  readCommittedModule,
  renderCleanRulesModule,
} from '../scripts/generate-clean-rules.mjs';

/**
 * Binding `rules-drift-check` (spec `agents.clean-manifesto`).
 *
 * The build lifts the manifestos' marked Rules sections into a committed module.
 * Editing a manifesto without regenerating would leave generated skills teaching
 * yesterday's rules, so this re-runs the extraction and asserts byte-equality
 * with what is committed.
 */
describe('generated clean-rules module tracks the manifestos', () => {
  it('is byte-identical to a fresh extraction from the current manifestos', () => {
    const committed = readCommittedModule();

    expect(
      committed,
      `${OUTPUT_RELATIVE_PATH} is missing. Run \`node scripts/generate-clean-rules.mjs\`.`
    ).toBeTypeOf('string');

    expect(
      renderCleanRulesModule(),
      `${OUTPUT_RELATIVE_PATH} is stale. Run \`node scripts/generate-clean-rules.mjs\` and commit the result.`
    ).toBe(committed);
  });

  it('carries each manifesto Rules section verbatim', () => {
    const committed = readCommittedModule() as string;

    for (const manifesto of MANIFESTOS) {
      const rules = extractRules(
        readFileSync(path.join(REPO_ROOT, manifesto.sourceRelativePath), 'utf8'),
        manifesto.sourceRelativePath
      );
      // The module escapes backticks and `${` for the template literal; compare
      // the unescaped text so the assertion tracks the rules, not the encoding.
      const unescaped = committed
        .replace(/\\`/g, '`')
        .replace(/\\\$\{/g, '${')
        .replace(/\\\\/g, '\\');

      expect(unescaped).toContain(rules);
      expect(committed).toContain(`export const ${manifesto.exportName} =`);
    }
  });

  it('rejects a manifesto whose markers are missing, doubled, or inverted', () => {
    const body = `${BEGIN_MARKER}\n- A rule.\n${END_MARKER}`;

    expect(() => extractRules('no markers here', 'fixture')).toThrow(/exactly one/);
    expect(() => extractRules(`${body}\n${body}`, 'fixture')).toThrow(/exactly one/);
    expect(() => extractRules(`${END_MARKER}\n- A rule.\n${BEGIN_MARKER}`, 'fixture')).toThrow(
      /before/
    );
    expect(() => extractRules(`${BEGIN_MARKER}\n\n${END_MARKER}`, 'fixture')).toThrow(/empty/);
  });

  it('detects an edited Rules section that was not regenerated', () => {
    // Simulate the stale case: the same render against a manifesto whose rules
    // changed must no longer equal the committed module.
    const committed = readCommittedModule() as string;
    const edited = committed.replace(
      `export const ${MANIFESTOS[0].exportName} = \``,
      `export const ${MANIFESTOS[0].exportName} = \`- A newly authored rule.\n`
    );

    expect(edited).not.toBe(committed);
    expect(renderCleanRulesModule()).not.toBe(edited);
  });
});
