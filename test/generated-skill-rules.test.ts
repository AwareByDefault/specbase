import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import {
  generateSkillContent,
  getSkillTemplates,
} from '../src/core/shared/skill-generation.js';
import {
  CLEAN_SPEC_RULES,
  CLEAN_SPECBASE_RULES,
} from '../src/core/templates/workflows/clean-rules.generated.js';
import { GOVERNED_TEST_SPEC_MODEL } from './helpers/governed-model.js';

/**
 * Binding `emitted-skill-carries-rules` (spec `agents.clean-manifesto`).
 *
 * `docs/` does not ship in the npm package, so an installed repo never sees the
 * manifestos. Skills must therefore CARRY the rules rather than point at them.
 * Generation happens into a temp directory that has no `docs/` at all, so a
 * regression that reads the manifestos at runtime fails here.
 */

const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'specbase-skill-rules-'));

afterAll(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

/** Write a generated skill into a docs-free directory and read it back. */
function emitSkill(dirName: string, content: string): string {
  const skillDir = path.join(tempRoot, dirName);
  mkdirSync(skillDir, { recursive: true });
  const skillPath = path.join(skillDir, 'SKILL.md');
  writeFileSync(skillPath, content, 'utf8');
  return readFileSync(skillPath, 'utf8');
}

const governedSkills = getSkillTemplates(undefined, GOVERNED_TEST_SPEC_MODEL);
const legacySkills = getSkillTemplates();

describe('generated skills carry the injected authoring rules', () => {
  it('generates into a directory with no docs/ present', () => {
    expect(existsSync(path.join(tempRoot, 'docs'))).toBe(false);
  });

  it('emits non-empty rules constants to inject', () => {
    expect(CLEAN_SPEC_RULES.trim().length).toBeGreaterThan(0);
    expect(CLEAN_SPECBASE_RULES.trim().length).toBeGreaterThan(0);
  });

  describe('every governed skill that teaches the spec model', () => {
    // The review-panel skill is a governed-only orchestration surface that
    // carries no spec-model primer, so it carries no authoring rules either.
    const withPrimer = governedSkills.filter(({ template }) =>
      template.instructions.includes('## Governed spec model')
    );

    it('includes at least the authoring workflows', () => {
      expect(withPrimer.length).toBeGreaterThan(0);
      expect(withPrimer.map((entry) => entry.workflowId)).toContain('propose');
    });

    for (const { template, dirName } of withPrimer) {
      it(`${dirName} contains the rules and references no docs/ path`, () => {
        const written = emitSkill(dirName, generateSkillContent(template, 'TEST'));

        expect(written).toContain(CLEAN_SPECBASE_RULES);
        expect(written).toContain(CLEAN_SPEC_RULES);
        // A path reference would dangle wherever the manifestos are absent.
        expect(written).not.toMatch(/docs\/clean-[a-z-]*\.md/);
        expect(written).not.toContain('docs/clean-');
      });
    }
  });

  describe('legacy generation is untouched', () => {
    for (const { template, dirName } of legacySkills) {
      it(`${dirName} carries no injected rules under the legacy model`, () => {
        expect(template.instructions).not.toContain(CLEAN_SPECBASE_RULES);
        expect(template.instructions).not.toContain(CLEAN_SPEC_RULES);
      });
    }
  });
});
