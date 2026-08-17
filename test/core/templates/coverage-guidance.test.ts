import { describe, it, expect } from 'vitest';

import {
  getExploreSkillTemplate,
  getVerifyChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getSpcbProposeSkillTemplate,
  getSpcbExploreCommandTemplate,
  getSpcbVerifyCommandTemplate,
  getSpcbApplyCommandTemplate,
  getSpcbProposeCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import type { SpecModel } from '../../../src/core/artifact-graph/types.js';

const GOVERNED: SpecModel = {
  kind: 'governed',
  version: 1,
  planes: [
    { id: 'behavior', purpose: 'User/client-visible outcomes', enforcementFlavor: 'tests', crossCutting: false },
    { id: 'architecture', purpose: 'Package boundaries', enforcementFlavor: 'lint', crossCutting: false },
    { id: 'ops', purpose: 'What we use and how it runs', enforcementFlavor: 'lockfile audit', crossCutting: false },
    { id: 'code-quality', purpose: 'What good code looks like', enforcementFlavor: 'smell-lint', crossCutting: false },
  ],
  pairedEnforcement: true,
};

/**
 * add-spec-coverage-tool (spcb-explore-skill spec): the governed explore
 * guidance walks behavior -> architecture -> enforcement, classifies dual-plane
 * ideas, and opens with the `specbase coverage --json` health check; verify and
 * apply carry one-line coverage pointers. Legacy output never mentions any of
 * it (byte-identical, hash-locked elsewhere).
 */
describe('governed explore staged flow and coverage awareness', () => {
  const EXPLORE_MARKERS = [
    // Health check opens exploration and mentions rot in touched areas.
    'Health check first (governed)',
    'specbase coverage --json',
    'hanging\nclaims, stale bindings, **degraded** specs',
    'surface that state and suggest addressing it or explicitly\ndeferring it in the proposal',
    // The three named stages.
    'Staged exploration: behavior -> structure -> enforcement (governed)',
    '**Desired behavior.**',
    '**Supporting structure.**',
    '**Enforcement approach',
    // Plane classifier: touched planes -> a candidate locator in each.
    '**Plane classifier:**',
    'name a candidate locator in EACH touched',
    'plan a spec',
    'pair in that plane only and say why no other plane is needed',
    // Named structural triggers force the architectural spec (the port/adapter case).
    'Structural triggers',
    'a new port or adapter',
    'architecture/persistence-port',
    // Enforcement stage stays general; certainty is reserved for the proposal.
    'stay general; certainty is the proposal',
    'coverage decisions for the proposal',
    // The distilled enforcement philosophy is the shared lens.
    'Enforcement philosophy (governed)',
    'Coverage is a mirror, not a target.',
    'Prefer the highest-leverage check.',
    'Bind at the requirement level, not per scenario.',
    // The five-homes classification table is folded in, not lost.
    'Classifying durable insights (governed)',
    '| User/client-visible capability that must stay true | Behavioral spec pair',
  ];

  for (const marker of EXPLORE_MARKERS) {
    it(`teaches "${marker.slice(0, 40)}..." under governed, absent under legacy`, () => {
      const skill = getExploreSkillTemplate(GOVERNED).instructions;
      const command = getSpcbExploreCommandTemplate(GOVERNED).content;
      expect(skill).toContain(marker);
      expect(command).toContain(marker);
      expect(getExploreSkillTemplate().instructions).not.toContain(marker);
      expect(getSpcbExploreCommandTemplate().content).not.toContain(marker);
    });
  }

  it('bakes the four default plane trigger lists into the governed explore guidance', () => {
    const skill = getExploreSkillTemplate(GOVERNED).instructions;
    expect(skill).toContain('behavior plane');
    expect(skill).toContain('architecture plane');
    expect(skill).toContain('ops plane');
    expect(skill).toContain('code-quality plane');
    expect(skill).toContain('a new port or adapter');
    expect(skill).toContain('adopting, replacing, or removing a dependency');
    expect(skill).toContain('a code smell to prohibit');
  });

  it('emits a plane-agnostic procedure for user-added planes beyond the defaults', () => {
    const model: SpecModel = {
      ...GOVERNED,
      planes: [
        ...GOVERNED.planes,
        { id: 'security', purpose: 'Authn/authz', enforcementFlavor: 'static-analysis', crossCutting: false },
      ],
    };
    const skill = getExploreSkillTemplate(model).instructions;
    expect(skill).toContain('security plane');
    expect(skill).toContain('match claims to this plane by its declared purpose');
  });
});

describe('coverage pointers in governed verify and apply guidance', () => {
  const POINTER = 'specbase coverage';

  it('verify names specbase coverage and its --json form under governed, absent under legacy', () => {
    for (const surface of [
      getVerifyChangeSkillTemplate(GOVERNED).instructions,
      getSpcbVerifyCommandTemplate(GOVERNED).content,
    ]) {
      expect(surface).toContain(POINTER);
      expect(surface).toContain('specbase coverage --json');
      expect(surface).toContain('aggregated enforcement-coverage view backing this assessment');
    }
    expect(getVerifyChangeSkillTemplate().instructions).not.toContain(POINTER);
    expect(getSpcbVerifyCommandTemplate().content).not.toContain(POINTER);
  });

  it('apply names specbase coverage as the shared health signal under governed, absent under legacy', () => {
    for (const surface of [
      getApplyChangeSkillTemplate(GOVERNED).instructions,
      getSpcbApplyCommandTemplate(GOVERNED).content,
    ]) {
      expect(surface).toContain(POINTER);
      expect(surface).toContain('aggregated coverage health signal');
    }
    expect(getApplyChangeSkillTemplate().instructions).not.toContain(POINTER);
    expect(getSpcbApplyCommandTemplate().content).not.toContain(POINTER);
  });
});

describe('enforcement philosophy reaches authoring (concrete altitude)', () => {
  // The proposal is where certainty lands, so the authoring guidance must carry
  // both the shared philosophy and the concrete "author bindings by it" framing.
  const AUTHORING_MARKERS = [
    'Enforcement philosophy (governed)',
    'Prefer the highest-leverage check.',
    'Author bindings by the philosophy below',
    'highest-leverage real source',
    'assertions, procedures, harness details, and boundaries in the proposal',
  ];

  for (const marker of AUTHORING_MARKERS) {
    it(`propose authoring teaches "${marker.slice(0, 40)}..." under governed, absent under legacy`, () => {
      expect(getSpcbProposeSkillTemplate(GOVERNED).instructions).toContain(marker);
      expect(getSpcbProposeCommandTemplate(GOVERNED).content).toContain(marker);
      expect(getSpcbProposeSkillTemplate().instructions).not.toContain(marker);
      expect(getSpcbProposeCommandTemplate().content).not.toContain(marker);
    });
  }
});
