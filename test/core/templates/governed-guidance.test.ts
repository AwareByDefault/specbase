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
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getOnboardSkillTemplate,
  getSpcbProposeSkillTemplate,
  getSpcbExploreCommandTemplate,
  getSpcbNewCommandTemplate,
  getSpcbContinueCommandTemplate,
  getSpcbApplyCommandTemplate,
  getSpcbUpdateCommandTemplate,
  getSpcbFfCommandTemplate,
  getSpcbSyncCommandTemplate,
  getSpcbVerifyCommandTemplate,
  getSpcbArchiveCommandTemplate,
  getSpcbBulkArchiveCommandTemplate,
  getSpcbOnboardCommandTemplate,
  getSpcbProposeCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { getSkillTemplates, getCommandContents } from '../../../src/core/shared/skill-generation.js';
import { LEGACY_SPEC_MODEL, type SpecModel } from '../../../src/core/artifact-graph/types.js';
import { GOVERNED_TEST_SPEC_MODEL } from '../../helpers/governed-model.js';

const GOVERNED: SpecModel = GOVERNED_TEST_SPEC_MODEL;

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
  archive: getArchiveChangeSkillTemplate,
  'bulk-archive': getBulkArchiveChangeSkillTemplate,
  onboard: getOnboardSkillTemplate,
  propose: getSpcbProposeSkillTemplate,
} as const;

const COMMAND_GETTERS = {
  explore: getSpcbExploreCommandTemplate,
  new: getSpcbNewCommandTemplate,
  continue: getSpcbContinueCommandTemplate,
  apply: getSpcbApplyCommandTemplate,
  update: getSpcbUpdateCommandTemplate,
  ff: getSpcbFfCommandTemplate,
  sync: getSpcbSyncCommandTemplate,
  verify: getSpcbVerifyCommandTemplate,
  archive: getSpcbArchiveCommandTemplate,
  'bulk-archive': getSpcbBulkArchiveCommandTemplate,
  onboard: getSpcbOnboardCommandTemplate,
  propose: getSpcbProposeCommandTemplate,
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

  // Unit 4: the modified specbase-conventions authoring rules are taught only
  // under the governed model, and legacy output never mentions them.
  describe('governed authoring conventions (specbase-conventions delta)', () => {
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
      const command = getSpcbExploreCommandTemplate(GOVERNED).content;
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
        const command = getSpcbSyncCommandTemplate(GOVERNED).content;
        expect(skill).toContain(marker);
        expect(command).toContain(marker);
        expect(getSyncSpecsSkillTemplate().instructions).not.toContain(marker);
        expect(getSpcbSyncCommandTemplate().content).not.toContain(marker);
      });
    }

    it('does not apply legacy header-identity merging to governed pairs', () => {
      for (const surface of [
        getSyncSpecsSkillTemplate(GOVERNED).instructions,
        getSpcbSyncCommandTemplate(GOVERNED).content,
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
  describe('governed verify guidance (spcb-verify-skill)', () => {
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
        const command = getSpcbVerifyCommandTemplate(GOVERNED).content;
        expect(skill).toContain(marker);
        expect(command).toContain(marker);
        expect(getVerifyChangeSkillTemplate().instructions).not.toContain(marker);
        expect(getSpcbVerifyCommandTemplate().content).not.toContain(marker);
      });
    }

    it('raises CRITICAL with stable IDs for incomplete coverage and failed commands', () => {
      for (const surface of [
        getVerifyChangeSkillTemplate(GOVERNED).instructions,
        getSpcbVerifyCommandTemplate(GOVERNED).content,
      ]) {
        // Incomplete governed coverage -> CRITICAL naming stable spec/normative/binding IDs.
        expect(surface).toContain('raise a **CRITICAL** issue that');
        expect(surface).toContain('names the stable spec `id`');
        // Automated enforcement fails -> CRITICAL + not ready to archive.
        expect(surface).toContain('mark the change **not ready to');
      }
    });
  });

  // Unit 6.5 (archive): governed archive requires pair readiness before archiving,
  // performs pair-aware synchronization through the schema-aware CLI, reports
  // retired-target cleanup candidates without auto-deleting code, and reports an
  // explicit validation bypass honestly. None of this appears under legacy.
  describe('governed archive guidance (spcb-archive-skill)', () => {
    const ARCHIVE_MARKERS = [
      'Archiving a governed change (governed)',
      'Require governed readiness BEFORE archiving',
      'no **hanging**\n  mandatory SHALL/MUST claims',
      'every active\n  binding\'s declared \\`targets\\` exist',
      'NO \\`planned\\`, unenforced, unresolved,\n  **broken**, or failing-mandatory bindings remain',
      'Reuse the \\`/spcb:verify\\`\n  results as the readiness evidence',
      'Interactive confirmation is NOT\n  enforcement evidence',
      'Treat governed deltas as an inseparable pair on sync',
      'invoke **pair-aware\n  governed synchronization**',
      'Never promote a\n  spec-only or enforcement-only half',
      'report a blocking validation error rather than offering partial\n  synchronization',
      'Archive through the schema-aware CLI path',
      'report the dated archive location',
      'Report retired-target CLEANUP candidates; never auto-delete project code',
      'never auto-delete project code from this workflow',
      'Report an explicit BYPASS honestly',
      'the archive was NOT fully verified rather than claiming\n  governed readiness',
    ]
      // Source strings use single backticks; markers escape them for readability.
      .map((m) => m.replace(/\\`/g, '`'));

    for (const marker of ARCHIVE_MARKERS) {
      it(`teaches archive guidance "${marker.slice(0, 40)}..." under governed, absent under legacy`, () => {
        // Both single-change and bulk archive carry the shared readiness gate.
        const surfaces = [
          getArchiveChangeSkillTemplate(GOVERNED).instructions,
          getSpcbArchiveCommandTemplate(GOVERNED).content,
          getBulkArchiveChangeSkillTemplate(GOVERNED).instructions,
          getSpcbBulkArchiveCommandTemplate(GOVERNED).content,
        ];
        for (const surface of surfaces) expect(surface).toContain(marker);

        expect(getArchiveChangeSkillTemplate().instructions).not.toContain(marker);
        expect(getSpcbArchiveCommandTemplate().content).not.toContain(marker);
        expect(getBulkArchiveChangeSkillTemplate().instructions).not.toContain(marker);
        expect(getSpcbBulkArchiveCommandTemplate().content).not.toContain(marker);
      });
    }

    it('bulk archive applies the readiness gate per change and reports each outcome', () => {
      const bulkOnly = [
        'Applying the governed gate across a batch (governed)',
        'Apply the governed readiness gate PER change',
        'whether it was **archived**',
        '**blocked**',
        '**bypassed**',
        'Never\n  fold a blocked or bypassed change into the archived count',
      ];
      for (const surface of [
        getBulkArchiveChangeSkillTemplate(GOVERNED).instructions,
        getSpcbBulkArchiveCommandTemplate(GOVERNED).content,
      ]) {
        for (const marker of bulkOnly) expect(surface).toContain(marker);
      }
      // The batch-specific section is unique to bulk archive, not single archive.
      expect(getArchiveChangeSkillTemplate(GOVERNED).instructions).not.toContain(
        'Applying the governed gate across a batch (governed)'
      );
      // And it never leaks into legacy bulk output.
      expect(getBulkArchiveChangeSkillTemplate().instructions).not.toContain(
        'Applying the governed gate across a batch (governed)'
      );
    });
  });

  // Unit 6.6 (onboard): governed onboarding teaches the declared truth planes,
  // stable scoped identity, paired enforcement, drift, and archived rationale.
  describe('governed onboard guidance (spcb-onboard-skill)', () => {
    const onboardMarkers = [
      'Teaching the governed model while onboarding (governed)',
      'Truth planes',
      // The lesson enumerates the RESOLVED roster (GOVERNED declares behavior +
      // architecture), naming each plane's storage subtree - it no longer
      // asserts a fixed pair of planes.
      'under `specs/behavior/...`',
      'under `specs/architecture/...`',
      'durable identity while titles and locators are mutable',
      'assign a project-unique stable spec',
      'stale** bindings (covering a removed ID)',
      'hanging** claims (a mandatory',
      'governed verification',
      'archived **proposal and design preserve WHY**',
      'historical rationale lives in the dated archive, not in current truth',
    ];
    for (const marker of onboardMarkers) {
      it(`teaches onboard guidance "${marker.slice(0, 40)}..." under governed, absent under legacy`, () => {
        expect(getOnboardSkillTemplate(GOVERNED).instructions).toContain(marker);
        expect(getSpcbOnboardCommandTemplate(GOVERNED).content).toContain(marker);
        expect(getOnboardSkillTemplate().instructions).not.toContain(marker);
        expect(getSpcbOnboardCommandTemplate().content).not.toContain(marker);
      });
    }
  });
});
