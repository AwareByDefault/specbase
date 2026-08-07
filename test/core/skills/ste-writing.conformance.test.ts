/**
 * STE writing skill conformance (agents.ste-writing, binding
 * `ste-writing-skill-conformance`). Specbase owns the STE writing SKILL.md in
 * code (its template under `src/core/templates/workflows/ste-writing.ts, so the
 * agents-plane enforcement is an automated test: the skill is registered as
 * invocable under the governed model, its generated frontmatter names the STE
 * mandate and a trigger, and its body directs short active sentences and
 * forbids marketing adjectives and banned complex words.
 */
import { describe, expect, it } from 'vitest';
import { getSteWritingSkillTemplate } from '../../../src/core/templates/workflows/ste-writing.js';
import {
  generateSkillContent,
  getSkillTemplates,
} from '../../../src/core/shared/skill-generation.js';
import { GOVERNED_TEST_SPEC_MODEL } from '../../helpers/governed-model.js';

describe('STE writing skill conforms to agents.ste-writing', () => {
  it('is registered and emitted as invocable under the governed model', () => {
    const entries = getSkillTemplates(undefined, GOVERNED_TEST_SPEC_MODEL);
    const entry = entries.find((e) => e.workflowId === 'ste-writing');
    expect(entry).toBeDefined();
    expect(entry!.dirName).toBe('specbase-ste-writing');
    expect(entry!.template.name).toBe('specbase-ste-writing');
  });

  it('is absent from the legacy (flat) skill set', () => {
    const ids = getSkillTemplates().map((e) => e.workflowId);
    expect(ids).not.toContain('ste-writing');
  });

  it('frontmatter declares the STE mandate and a trigger', () => {
    const content = generateSkillContent(getSteWritingSkillTemplate(), 'CONFORMANCE');
    const frontmatter = content.split('---')[1];
    expect(content).toMatch(/^---\n/);
    expect(frontmatter).toContain('name: specbase-ste-writing');
    expect(frontmatter).toContain('Simplified Technical English');
    expect(frontmatter).toContain('no marketing adjectives');
    expect(frontmatter).toContain('no banned complex words');
    // The trigger: applying the skill whenever prose is written or revised.
    expect(frontmatter).toMatch(/whenever (writing|revising)/i);
  });

  it('body directs short active sentences and forbids marketing/banned words', () => {
    const body = getSteWritingSkillTemplate().instructions;
    expect(body).toMatch(/short active sentences/i);
    expect(body).toMatch(/no marketing adjectives/i);
    expect(body).toMatch(/no banned complex words/i);
    expect(body).toContain('specbase ste-lint');
  });
});