import { describe, expect, it } from 'vitest';

import {
  getSpcbProposeCommandTemplate,
  getSpcbProposeSkillTemplate,
} from '../src/core/templates/skill-templates.js';
import {
  CLEAN_SPEC_RULES,
  CLEAN_SPECBASE_RULES,
} from '../src/core/templates/workflows/clean-rules.generated.js';
import { GOVERNED_TEST_SPEC_MODEL } from './helpers/governed-model.js';

/**
 * Binding `propose-surface-present` (spec `agents.clean-manifesto`).
 *
 * Asserts the generated propose guidance PRESENTS its chosen structure before
 * authoring and keeps writing quality ungated. Presence only - whether the offer
 * reads as genuine rather than a rubber stamp is the `propose-surface-quality`
 * review binding's job.
 */

const SURFACE_MARKER = '### Surface the chosen structure before authoring (governed)';

const SURFACE_MARKERS = [
  SURFACE_MARKER,
  // Placement is shown WITH the rule that produced it, not merely asserted.
  'Show each chosen locator with the rule that put it there',
  'Name the rule; do not just assert the path',
  // The offer is real and opt-OUT, not a gate the user must pass first.
  'Offer to discuss, and mean it',
  'The offer does NOT block',
  'never make the user opt in before you place',
  // Stopping is reserved for genuine ambiguity.
  'Stop and ASK only when placement is genuinely ambiguous',
  // Writing quality applies regardless of the structure conversation.
  '**Writing quality is never gated by that offer.**',
];

const governedSkill = () => getSpcbProposeSkillTemplate(GOVERNED_TEST_SPEC_MODEL).instructions;
const governedCommand = () => getSpcbProposeCommandTemplate(GOVERNED_TEST_SPEC_MODEL).content;
const legacySkill = () => getSpcbProposeSkillTemplate().instructions;
const legacyCommand = () => getSpcbProposeCommandTemplate().content;

describe('propose surfaces its chosen structure before authoring', () => {
  for (const marker of SURFACE_MARKERS) {
    it(`teaches "${marker.slice(0, 46)}..." in both projections, absent under legacy`, () => {
      expect(governedSkill()).toContain(marker);
      expect(governedCommand()).toContain(marker);
      expect(legacySkill()).not.toContain(marker);
      expect(legacyCommand()).not.toContain(marker);
    });
  }

  it('places the surface step before the authoring instructions it gates', () => {
    for (const surface of [governedSkill(), governedCommand()]) {
      const surfaceIndex = surface.indexOf(SURFACE_MARKER);
      const authoringIndex = surface.indexOf('### Classifying planes and creating pairs (governed)');
      expect(surfaceIndex).toBeGreaterThan(-1);
      expect(authoringIndex).toBeGreaterThan(surfaceIndex);
    }
  });

  it('carries the injected placement and writing rules the step refers to', () => {
    for (const surface of [governedSkill(), governedCommand()]) {
      expect(surface).toContain(CLEAN_SPECBASE_RULES);
      expect(surface).toContain(CLEAN_SPEC_RULES);
      // The writing rules must precede the surface step, so "the writing rules
      // above" in the step resolves to real text in the prompt.
      expect(surface.indexOf(CLEAN_SPEC_RULES)).toBeLessThan(surface.indexOf(SURFACE_MARKER));
    }
  });

  it('reports the project plane roster rather than a hardcoded two-plane list', () => {
    for (const surface of [governedSkill(), governedCommand()]) {
      expect(surface).toContain('`planes: [behavior, architecture]`');
      expect(surface).toContain('specs/behavior/<locator>/{spec.md,enforcement.yaml}');
      expect(surface).not.toContain('specs/undefined/');
    }
  });
});
