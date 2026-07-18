import { describe, it, expect } from 'vitest';

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getUpdateChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxVerifyCommandTemplate,
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

// The workflows this unit teaches governed awareness (tasks 6.1-6.4).
const SKILL_GETTERS = {
  explore: getExploreSkillTemplate,
  new: getNewChangeSkillTemplate,
  continue: getContinueChangeSkillTemplate,
  apply: getApplyChangeSkillTemplate,
  update: getUpdateChangeSkillTemplate,
  ff: getFfChangeSkillTemplate,
  sync: getSyncSpecsSkillTemplate,
  verify: getVerifyChangeSkillTemplate,
  propose: getOpsxProposeSkillTemplate,
} as const;

const COMMAND_GETTERS = {
  explore: getOpsxExploreCommandTemplate,
  new: getOpsxNewCommandTemplate,
  continue: getOpsxContinueCommandTemplate,
  apply: getOpsxApplyCommandTemplate,
  update: getOpsxUpdateCommandTemplate,
  ff: getOpsxFfCommandTemplate,
  sync: getOpsxSyncCommandTemplate,
  verify: getOpsxVerifyCommandTemplate,
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

  // Unit 6.5 (sync): governed sync reconciles complete pairs by stable scoped
  // identity and reports retired enforcement targets as cleanup candidates. None
  // of this appears in the legacy sync guidance.
  describe('governed sync guidance (specs-sync-skill)', () => {
    const SYNC_MARKERS = [
      'Reconciling governed pairs (governed)',
      'the whole pair - `spec.md` and `enforcement.md` - together in one step',
      'by their pair-local `**ID:**` slug',
      'Apply binding add/modify/remove/rename\n  by pair-local binding ID',
      'update the moved pair in place without changing its ID',
      'Never promote a spec-only or enforcement-only half',
      'report the binding\'s former `targets` as\n  **cleanup candidates**',
      'Never auto-delete a test, rule, fixture, or review target here',
      'leave that current pair\n  unchanged and report the actionable conflicts',
      'Use the governed sync CLI behavior',
    ];

    for (const marker of SYNC_MARKERS) {
      it(`teaches sync guidance "${marker.slice(0, 40)}..." under governed, absent under legacy`, () => {
        const skill = getSyncSpecsSkillTemplate(GOVERNED).instructions;
        const command = getOpsxSyncCommandTemplate(GOVERNED).content;
        expect(skill).toContain(marker);
        expect(command).toContain(marker);
        expect(getSyncSpecsSkillTemplate().instructions).not.toContain(marker);
        expect(getOpsxSyncCommandTemplate().content).not.toContain(marker);
      });
    }

    it('does not apply legacy header-identity merging to governed pairs', () => {
      for (const surface of [
        getSyncSpecsSkillTemplate(GOVERNED).instructions,
        getOpsxSyncCommandTemplate(GOVERNED).content,
      ]) {
        expect(surface).toContain('stable scoped identity, never by title');
        expect(surface).toContain('Discover every concrete delta from status');
      }
    });
  });

  // Unit 6.4 (verify): governed verify assesses enforcement coverage first,
  // executes each affected automated binding's declared command, labels semantic
  // correspondence as review (not deterministic automation), reports retired
  // targets, and reports evidence strength. None of this appears under legacy.
  describe('governed verify guidance (opsx-verify-skill)', () => {
    const VERIFY_MARKERS = [
      'Verifying coverage and evidence (governed)',
      'Assess enforcement COVERAGE first',
      'EXECUTE each affected automated binding',
      'declared \\`run: {command, args, cwd}\\`',
      'Associate each pass/fail with the binding',
      'does NOT by itself prove the check verifies the intended claim',
      'Perform structured REVIEW procedures',
      'Report \\`manual\\` evidence separately',
      'Assess SEMANTIC CORRESPONDENCE honestly',
      'distinguish "command passed" from "the check verifies the intended',
      'never upgrade it to automated strength',
      'Report RETIRED enforcement targets',
      'never delete a target here',
      'Report evidence STRENGTH per binding',
      'Block archive-readiness while any affected binding is',
    ]
      // Source strings use single backticks; markers escape them for readability.
      .map((m) => m.replace(/\\`/g, '`'));

    for (const marker of VERIFY_MARKERS) {
      it(`teaches verify guidance "${marker.slice(0, 40)}..." under governed, absent under legacy`, () => {
        const skill = getVerifyChangeSkillTemplate(GOVERNED).instructions;
        const command = getOpsxVerifyCommandTemplate(GOVERNED).content;
        expect(skill).toContain(marker);
        expect(command).toContain(marker);
        expect(getVerifyChangeSkillTemplate().instructions).not.toContain(marker);
        expect(getOpsxVerifyCommandTemplate().content).not.toContain(marker);
      });
    }

    it('raises CRITICAL with stable IDs for incomplete coverage and failed commands', () => {
      for (const surface of [
        getVerifyChangeSkillTemplate(GOVERNED).instructions,
        getOpsxVerifyCommandTemplate(GOVERNED).content,
      ]) {
        // Incomplete governed coverage -> CRITICAL naming stable spec/normative/binding IDs.
        expect(surface).toContain('raise a **CRITICAL** issue that');
        expect(surface).toContain('names the stable spec `id`');
        // Automated enforcement fails -> CRITICAL + not ready to archive.
        expect(surface).toContain('mark the change **not ready to');
      }
    });
  });
});
