import { describe, it, expect } from 'vitest';

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getUpdateChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxProposeCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { getSkillTemplates, getCommandContents } from '../../../src/core/shared/skill-generation.js';
import { LEGACY_SPEC_MODEL, type SpecModel } from '../../../src/core/artifact-graph/types.js';

const GOVERNED: SpecModel = {
  kind: 'governed',
  version: 1,
  planes: ['behavior', 'architecture'],
  pairedEnforcement: true,
};

// The seven workflows this unit teaches governed awareness (tasks 6.1-6.3).
const SKILL_GETTERS = {
  explore: getExploreSkillTemplate,
  new: getNewChangeSkillTemplate,
  continue: getContinueChangeSkillTemplate,
  apply: getApplyChangeSkillTemplate,
  update: getUpdateChangeSkillTemplate,
  ff: getFfChangeSkillTemplate,
  propose: getOpsxProposeSkillTemplate,
} as const;

const COMMAND_GETTERS = {
  explore: getOpsxExploreCommandTemplate,
  new: getOpsxNewCommandTemplate,
  continue: getOpsxContinueCommandTemplate,
  apply: getOpsxApplyCommandTemplate,
  update: getOpsxUpdateCommandTemplate,
  ff: getOpsxFfCommandTemplate,
  propose: getOpsxProposeCommandTemplate,
} as const;

const GOVERNED_MARKER = '## Governed spec model';

describe('governed workflow guidance gating (tasks 6.1-6.3)', () => {
  describe('legacy output is byte-unchanged', () => {
    for (const [id, getter] of Object.entries(SKILL_GETTERS)) {
      it(`skill '${id}' is identical with no arg and with the legacy model`, () => {
        const zeroArg = getter().instructions;
        const legacy = getter(LEGACY_SPEC_MODEL).instructions;
        expect(legacy).toBe(zeroArg);
        expect(zeroArg).not.toContain(GOVERNED_MARKER);
      });
    }

    for (const [id, getter] of Object.entries(COMMAND_GETTERS)) {
      it(`command '${id}' is identical with no arg and with the legacy model`, () => {
        const zeroArg = getter().content;
        const legacy = getter(LEGACY_SPEC_MODEL).content;
        expect(legacy).toBe(zeroArg);
        expect(zeroArg).not.toContain(GOVERNED_MARKER);
      });
    }
  });

  describe('governed model appends governed guidance', () => {
    for (const [id, getter] of Object.entries(SKILL_GETTERS)) {
      it(`skill '${id}' gains governed guidance under the governed model`, () => {
        const legacy = getter().instructions;
        const governed = getter(GOVERNED).instructions;
        expect(governed).toContain(GOVERNED_MARKER);
        expect(governed.startsWith(legacy)).toBe(true);
        // Governed guidance derives paths from the CLI rather than hardcoding.
        expect(governed).toContain('specModel');
        expect(governed).toContain('specs/behavior/');
        expect(governed).toContain('specs/architecture/');
      });
    }
  });

  describe('skill and command projections carry the same governed semantics (parity)', () => {
    for (const id of Object.keys(SKILL_GETTERS)) {
      it(`workflow '${id}' teaches the governed model in both projections`, () => {
        const skill = SKILL_GETTERS[id as keyof typeof SKILL_GETTERS](GOVERNED).instructions;
        const command = COMMAND_GETTERS[id as keyof typeof COMMAND_GETTERS](GOVERNED).content;
        expect(skill).toContain(GOVERNED_MARKER);
        expect(command).toContain(GOVERNED_MARKER);
      });
    }
  });

  describe('generation registries thread the spec model', () => {
    it('getSkillTemplates injects governed guidance only under the governed model', () => {
      const legacyExplore = getSkillTemplates(['explore']).find((e) => e.workflowId === 'explore')!;
      expect(legacyExplore.template.instructions).not.toContain(GOVERNED_MARKER);

      const governedExplore = getSkillTemplates(['explore'], GOVERNED).find(
        (e) => e.workflowId === 'explore'
      )!;
      expect(governedExplore.template.instructions).toContain(GOVERNED_MARKER);
    });

    it('getCommandContents injects governed guidance only under the governed model', () => {
      const legacyApply = getCommandContents(['apply']).find((c) => c.id === 'apply')!;
      expect(legacyApply.body).not.toContain(GOVERNED_MARKER);

      const governedApply = getCommandContents(['apply'], GOVERNED).find((c) => c.id === 'apply')!;
      expect(governedApply.body).toContain(GOVERNED_MARKER);
    });
  });

  // Unit 4: the modified openspec-conventions authoring rules are taught only
  // under the governed model, and legacy output never mentions them.
  describe('governed authoring conventions (openspec-conventions delta)', () => {
    // Project Structure: namespace directories and safe nested locators live in
    // the shared primer, so every governed workflow carries them.
    const STRUCTURE_MARKERS = [
      'arbitrary safe depth',
      'is a **namespace** and needs no pair',
      'plane-qualified locator as the target current pair',
    ];

    for (const marker of STRUCTURE_MARKERS) {
      it(`teaches structure convention "${marker}" under governed, absent under legacy`, () => {
        for (const getter of Object.values(SKILL_GETTERS)) {
          expect(getter(GOVERNED).instructions).toContain(marker);
          expect(getter().instructions).not.toContain(marker);
        }
      });
    }

    // Behavior-First boundary, "Tool behavior is itself observable": taught in the
    // explore classification, so a tool's own behavior lands in the behavioral plane
    // while the architectural requirement binds to it through enforcement.
    it('teaches that tool behavior is behavioral truth bound through enforcement (explore)', () => {
      const governed = getExploreSkillTemplate(GOVERNED).instructions;
      const command = getOpsxExploreCommandTemplate(GOVERNED).content;
      for (const surface of [governed, command]) {
        expect(surface).toContain('that behavior is **behavioral truth**');
        expect(surface).toContain("do NOT embed the tool's implementation");
      }
      expect(getExploreSkillTemplate().instructions).not.toContain(
        'that behavior is **behavioral truth**'
      );
    });
  });
});
