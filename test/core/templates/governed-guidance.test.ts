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
    const markers = [
      'Reconciling governed pairs (governed)',
      'compact bindings by their map keys',
      'Treat `spec.md` and `enforcement.yaml` as one coherent write',
      'Normalize every touched pair to `enforcement.yaml`',
      'never delete project code',
    ];
    for (const marker of markers) it(`projects sync: ${marker}`, () => {
      expect(getSyncSpecsSkillTemplate(GOVERNED).instructions).toContain(marker);
      expect(getSpcbSyncCommandTemplate(GOVERNED).content).toContain(marker);
    });
  });

  // Unit 6.4 (verify): governed verify assesses enforcement coverage first,
  // executes each affected automated binding's declared command, labels semantic
  // correspondence as review (not deterministic automation), reports retired
  // targets, and reports evidence strength. None of this appears under legacy.
  describe('governed verify guidance (spcb-verify-skill)', () => {
    const markers = [
      'Verifying linkage, execution, and correspondence (governed)',
      'Structural linkage',
      'Native-harness execution',
      'Semantic correspondence',
      'Never invent a command vector from the manifest',
      'Do not use manual `covered_by` lists',
      'Never describe a resolvable source as a passing execution',
    ];
    for (const marker of markers) it(`projects verify: ${marker}`, () => {
      expect(getVerifyChangeSkillTemplate(GOVERNED).instructions).toContain(marker);
      expect(getSpcbVerifyCommandTemplate(GOVERNED).content).toContain(marker);
    });
  });

  // Unit 6.5 (archive): governed archive requires pair readiness before archiving,
  // performs pair-aware synchronization through the schema-aware CLI, reports
  // retired-target cleanup candidates without auto-deleting code, and reports an
  // explicit validation bypass honestly. None of this appears under legacy.
  describe('governed archive guidance (spcb-archive-skill)', () => {
    const markers = [
      'Archiving a governed change (governed)',
      'resolved types and sources',
      'compact `enforcement.yaml` as one unit',
      'validation bypass is explicit and unverified',
    ];
    for (const marker of markers) it(`projects archive: ${marker}`, () => {
      expect(getArchiveChangeSkillTemplate(GOVERNED).instructions).toContain(marker);
      expect(getSpcbArchiveCommandTemplate(GOVERNED).content).toContain(marker);
    });
    it('applies readiness independently in bulk', () => {
      expect(getBulkArchiveChangeSkillTemplate(GOVERNED).instructions).toContain('independently to every change');
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
      'stale** bindings (covering a removed requirement)',
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
