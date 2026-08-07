import { describe, it, expect } from 'vitest';
import {
  getReviewPanelSkillTemplate,
  getReviewPanelCommandTemplate,
  getVerifyChangeSkillTemplate,
  getSpcbVerifyCommandTemplate,
  getExploreSkillTemplate,
  getSpcbExploreCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  getSkillTemplates,
  getCommandContents,
} from '../../../src/core/shared/skill-generation.js';
import { LEGACY_SPEC_MODEL, type SpecModel } from '../../../src/core/artifact-graph/types.js';

const GOVERNED: SpecModel = {
  kind: 'governed',
  version: 1,
  planes: ['behavior', 'architecture'],
  pairedEnforcement: true,
};

describe('review-panel template — content', () => {
  const skill = getReviewPanelSkillTemplate().instructions;
  const command = getReviewPanelCommandTemplate().content;

  it('is byte-identical across skill and command projections (parity)', () => {
    expect(skill).toBe(command);
  });

  it('encodes the full orchestration pipeline', () => {
    for (const marker of [
      'Router: touched subtrees',
      'Deterministic gate FIRST',
      'blind',
      'residue',
      'Refute-verify',
      'completeness critic',
      'most-specific',
    ]) {
      expect(skill).toContain(marker);
    }
  });

  it('ships the four default lens methods scoped to the model structure', () => {
    expect(skill).toContain('`architectural` — scope `architecture/**`');
    expect(skill).toContain('`behavioural` — scope `behavior/**`');
    expect(skill).toContain("`enforcement` — scope: every affected pair's bindings");
    expect(skill).toContain('`code-quality` — scope: whole tree');
    // Enforcement lens judges evidence adequacy and does not recurse into itself.
    expect(skill).toContain('do not review your own verdicts');
  });

  it('states it is read-only, review-strength, and non-gating', () => {
    expect(skill).toContain('READ-ONLY and NON-GATING');
    expect(skill).toContain('`review`-strength');
    expect(skill).toContain('do not gate archive, verification readiness, or `--strict`');
  });

  it('sources policy from the specs at review time and grows by proposal', () => {
    expect(skill).toContain('sliced fresh from the governed specs');
    expect(skill).toContain('never copy charter/rule text into a lens method');
    expect(skill).toContain('Growth by proposal, never automatic');
  });
});

describe('review-panel registration — governed only', () => {
  it('is absent from the skill/command registries under legacy and with no model', () => {
    for (const model of [undefined, LEGACY_SPEC_MODEL]) {
      const skills = getSkillTemplates(undefined, model).map((e) => e.workflowId);
      const commands = getCommandContents(undefined, model).map((c) => c.id);
      expect(skills).not.toContain('review-panel');
      expect(commands).not.toContain('review-panel');
    }
    // Legacy registry length is unchanged (still the 12 lifecycle workflows).
    expect(getSkillTemplates()).toHaveLength(12);
  });

  it('appears in both registries under the governed model (parity)', () => {
    const skills = getSkillTemplates(undefined, GOVERNED);
    const commands = getCommandContents(undefined, GOVERNED);
    expect(skills.map((e) => e.workflowId)).toContain('review-panel');
    expect(commands.map((c) => c.id)).toContain('review-panel');
    expect(skills).toHaveLength(13);
  });
});

describe('verify guidance — review panel (governed vs legacy)', () => {
  const VERIFY_MARKERS = [
    'Run the review panel for review bindings (governed)',
    'Route each affected review binding to its lens',
    'Review only the residue above the gate',
    'bindings named in that review binding\'s `covered_by`',
    'Flag un-lensed review claims',
    'NEVER block archive or `specbase coverage --strict`',
  ];

  for (const marker of VERIFY_MARKERS) {
    it(`teaches "${marker.slice(0, 34)}..." under governed, absent under legacy, in both projections`, () => {
      const skill = getVerifyChangeSkillTemplate(GOVERNED).instructions;
      const command = getSpcbVerifyCommandTemplate(GOVERNED).content;
      expect(skill).toContain(marker);
      expect(command).toContain(marker);
      expect(getVerifyChangeSkillTemplate().instructions).not.toContain(marker);
      expect(getSpcbVerifyCommandTemplate().content).not.toContain(marker);
    });
  }
});

describe('explore guidance — lens growth (governed vs legacy)', () => {
  const EXPLORE_MARKERS = [
    'Non-deterministic claims: point at a lens or propose one (governed)',
    'Point the claim at an existing lens',
    'Or propose a new/scoped lens - never auto-create one',
    'Name the deterministic residue',
    'Growth is by proposal',
  ];

  for (const marker of EXPLORE_MARKERS) {
    it(`teaches "${marker.slice(0, 34)}..." under governed, absent under legacy, in both projections`, () => {
      const skill = getExploreSkillTemplate(GOVERNED).instructions;
      const command = getSpcbExploreCommandTemplate(GOVERNED).content;
      expect(skill).toContain(marker);
      expect(command).toContain(marker);
      expect(getExploreSkillTemplate().instructions).not.toContain(marker);
      expect(getSpcbExploreCommandTemplate().content).not.toContain(marker);
    });
  }
});
