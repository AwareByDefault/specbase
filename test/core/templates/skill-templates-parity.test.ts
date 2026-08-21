import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getSpcbApplyCommandTemplate,
  getSpcbArchiveCommandTemplate,
  getSpcbBulkArchiveCommandTemplate,
  getSpcbContinueCommandTemplate,
  getSpcbExploreCommandTemplate,
  getSpcbFfCommandTemplate,
  getSpcbNewCommandTemplate,
  getSpcbOnboardCommandTemplate,
  getSpcbSyncCommandTemplate,
  getSpcbProposeCommandTemplate,
  getSpcbProposeSkillTemplate,
  getStackSkillTemplate,
  getSpcbStackCommandTemplate,
  getSpcbUpdateCommandTemplate,
  getSpcbVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getUpdateChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  generateSkillContent,
  getCommandContents,
  getSkillTemplates,
  resolveProjectSpecModel,
} from '../../../src/core/shared/skill-generation.js';
import { STORE_SELECTION_GUIDANCE } from '../../../src/core/templates/workflows/store-selection.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '853762e812aa2b5cdabd4a11efe0b7ae52abd583f263c1c1ef717354c538f89e',
  getNewChangeSkillTemplate: '0facf563f4a73edc9030673929ec797ecc8fb6d3d628102e871e89d1d070ce38',
  getContinueChangeSkillTemplate: '769e63ca0ae24818cb15a2e6c38d573a3ed8a1edc4e9d1fc1ae3bba23051d27f',
  getApplyChangeSkillTemplate: '08b1a5638b1b2d038fa198db432f983853bc92f59dc2d9e58c539fda1ace674a',
  getFfChangeSkillTemplate: 'eb7597d077e1ea2a9b5844cfb672c6fa2c0dea6894a109cc4ab9ae244510846d',
  getSyncSpecsSkillTemplate: '99d72ac874c6424b7d0cc26310bbb1bd1262c837cac22fa8e5d12a69bd4e7b9c',
  getOnboardSkillTemplate: 'c733dfb3f8afca34424a6e1f5409a6cc2434e4355a76ae793f0aed2535678d3c',
  getSpcbExploreCommandTemplate: '5f1052626d4d49672007ee747686650caad1770db75c5e398c9c00353df78244',
  getSpcbNewCommandTemplate: 'c0c99aadd60ccc1d3d12ffdb394f2d2d6dc76d1c7990714e6ed9ea3e01529832',
  getSpcbContinueCommandTemplate: '05249f4208442b4019f336e01cef2519332498b96d67b8d687f6c43f5b6ec3ab',
  getSpcbApplyCommandTemplate: 'faad56591f95a8614a3a73796906932d4e6dd84076fc86aea2691d8345123ac9',
  getSpcbFfCommandTemplate: 'e1712927536a2719bbda96d56e51b94cc485ddf5a295d3e3256aa71b480e60f3',
  getArchiveChangeSkillTemplate: '23c35e570f8e8e604be361403468fa1545970880d9fd133ad5ff24fad6cee230',
  getBulkArchiveChangeSkillTemplate: 'cdc58e7f915cf1233db98dbb60b690a6626201043968fe2fc1475f0b952c091e',
  getSpcbSyncCommandTemplate: 'fb599b9a2a1e20099411f30d1e421d8143b07dc118985ac5b87ff27db0baf573',
  getVerifyChangeSkillTemplate: '0c4ec11ad04aadc659ee1ab96575c52d727a1c93a9a98097d5efb55b453238ee',
  getSpcbArchiveCommandTemplate: '66f4d5d9f961da6c65f89c38dc8721f00d96ef6ab02b5f36af95453a596bdea1',
  getSpcbOnboardCommandTemplate: '66354271cbc43642d2a430fc5278f588821e9cbb730595cf419f9471a31ca9a7',
  getSpcbBulkArchiveCommandTemplate: '9826ed4e30e761b121bff8532bbff3e738e4eb479637bbdd51e55feeddc79697',
  getSpcbVerifyCommandTemplate: 'aef20a603e3c6f0c1271c4301701c8a8aa6b7b1859679401e4981824aacfbe4d',
  getSpcbProposeSkillTemplate: 'a4cc126fe52c66372aecaf0f6c674470c94243645dda56eea58c26b9dddd49e2',
  getSpcbProposeCommandTemplate: 'cd500074a15cba418b91f7859e4af5870fe77b418439d63852014b7bd6127f48',
  getFeedbackSkillTemplate: '027cd1eb22e80b16dd53264ad1ec790d6c8c50a076762ca573e658f9967020b0',
  getUpdateChangeSkillTemplate: '6fcaacfdbd72fe9c97df1db0750c55f007fd64694e329884b65178a7b0e1d4e2',
  getSpcbUpdateCommandTemplate: '80db26eca30c9b1a99acc6e3857df2b6c503b43c01da94006ac02cb0e1591dc6',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'specbase-explore': 'fbe21a2112c74c1013eb2117f235ced57f10da0d69e4297ddf435f363f65e55b',
  'specbase-new-change': '70d44f69fb60d65e3434c183887c6266a742860a064914f1cfb8ff77c8a831ae',
  'specbase-continue-change': 'ed1852139a09e27aee428a80f2b390f06fbcb826359dedc29d926143523d1d9c',
  'specbase-apply-change': '9f201483486652e4c752ecc5c42c9c3eda83db7ef112b04e2d1b0425e589111d',
  'specbase-ff-change': 'ba1810eff0cd27ed7e4b8ab8e47acfd7b5c312a4f57580569fb602f2abe23a01',
  'specbase-sync-specs': 'f8d834c8e296b80409b2b4d09551e008295f34f11ae16f73eccdf92f586ed486',
  'specbase-archive-change': '8440dd918c25e1d5ad72735cd574e305f1fb6c160134d3ea08540b1fbbca85c5',
  'specbase-bulk-archive-change': '950731570544bb710c071dbfb363e548884093e3011060df92d39e75dcada61b',
  'specbase-verify-change': '3387d67f5e47547632616100d372000bb63f7f445772fdcc32b93f3e2101f0ea',
  'specbase-onboard': 'aec7cb2d32ff7c615808ada24d59a76cd17db61f88d062f705a177c974da96bc',
  'specbase-propose': '0b0e2404ee6b28951440bcc601429501c02a0c8d1cd9eb684bbb21cc81c761c0',
  'specbase-update-change': '7ae431c3e94895042cb969f78c25566194ea5594b79c6b156fac9607ba958706',
};

// Intentionally excludes getFeedbackSkillTemplate: this list only models templates
// deployed via generateSkillContent, while feedback is covered in function payload parity.
const GENERATED_SKILL_FACTORIES: Array<[string, () => SkillTemplate]> = [
  ['specbase-explore', getExploreSkillTemplate],
  ['specbase-new-change', getNewChangeSkillTemplate],
  ['specbase-continue-change', getContinueChangeSkillTemplate],
  ['specbase-apply-change', getApplyChangeSkillTemplate],
  ['specbase-ff-change', getFfChangeSkillTemplate],
  ['specbase-sync-specs', getSyncSpecsSkillTemplate],
  ['specbase-archive-change', getArchiveChangeSkillTemplate],
  ['specbase-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
  ['specbase-verify-change', getVerifyChangeSkillTemplate],
  ['specbase-onboard', getOnboardSkillTemplate],
  ['specbase-propose', getSpcbProposeSkillTemplate],
  ['specbase-update-change', getUpdateChangeSkillTemplate],
];

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('keeps checked-in affected workflow instruments synchronized with canonical governed templates', () => {
    const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const model = resolveProjectSpecModel(projectRoot);
    const workflows = [
      ['specbase-explore', 'spcb-explore.md', getExploreSkillTemplate, getSpcbExploreCommandTemplate],
      ['specbase-propose', 'spcb-propose.md', getSpcbProposeSkillTemplate, getSpcbProposeCommandTemplate],
      ['specbase-apply-change', 'spcb-apply.md', getApplyChangeSkillTemplate, getSpcbApplyCommandTemplate],
      ['specbase-archive-change', 'spcb-archive.md', getArchiveChangeSkillTemplate, getSpcbArchiveCommandTemplate],
      ['specbase-stack', 'spcb-stack.md', getStackSkillTemplate, getSpcbStackCommandTemplate],
    ] as const;
    for (const [skillDir, promptName, skillFactory, commandFactory] of workflows) {
      const skill = fs.readFileSync(path.join(projectRoot, '.pi', 'skills', skillDir, 'SKILL.md'), 'utf-8');
      const canonicalSkill = generateSkillContent(skillFactory(model), '1.6.0');
      expect(skill.replaceAll('/spcb-', '/spcb:')).toBe(canonicalSkill);
      const prompt = fs.readFileSync(path.join(projectRoot, '.pi', 'prompts', promptName), 'utf-8').replaceAll('/spcb-', '/spcb:');
      for (const line of commandFactory(model).content.split('\n').map((item) => item.trim()).filter(Boolean)) {
        expect(prompt).toContain(line);
      }
    }
  });

  it('keeps idea resumption durable in both explore projections', () => {
    for (const content of [getExploreSkillTemplate().instructions, getSpcbExploreCommandTemplate().content]) {
      expect(content).toContain('When the user brings an idea from the catalogue');
      expect(content).toContain('specbase ideas show');
      expect(content).toContain('every prior `## Session` section');
      expect(content).toContain('save-idea skill');
      expect(content).toContain('`--from-idea`');
    }
  });

  it('keeps stack skill and command semantics in parity', () => {
    const skill = getStackSkillTemplate().instructions;
    const command = getSpcbStackCommandTemplate().content;
    expect(command).toBe(skill);
    for (const phrase of ['vertical-slice test', 'explicit deferrals', 'newly true', 'horizontal phases', 'specbase stack create']) {
      expect(skill).toContain(phrase);
    }
  });

  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getSpcbExploreCommandTemplate,
      getSpcbNewCommandTemplate,
      getSpcbContinueCommandTemplate,
      getSpcbApplyCommandTemplate,
      getSpcbFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getSpcbSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getSpcbArchiveCommandTemplate,
      getSpcbOnboardCommandTemplate,
      getSpcbBulkArchiveCommandTemplate,
      getSpcbVerifyCommandTemplate,
      getSpcbProposeSkillTemplate,
      getSpcbProposeCommandTemplate,
      getFeedbackSkillTemplate,
      getUpdateChangeSkillTemplate,
      getSpcbUpdateCommandTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    const actualHashes = Object.fromEntries(
      GENERATED_SKILL_FACTORIES.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  // Iterating the production registries (not a local list) means a newly
  // added workflow is covered automatically; the full-constant containment
  // check fails if any template's interpolation drifts.
  it('teaches store selection in every deployed skill template', () => {
    for (const { template, dirName } of getSkillTemplates()) {
      const content = generateSkillContent(template, 'PARITY-BASELINE');
      expect(content, dirName).toContain(STORE_SELECTION_GUIDANCE);
    }
  });

  // Auto-approve the Specbase CLI: every generated skill carries
  // `allowed-tools: Bash(specbase:*)` so agents that honor it stop prompting
  // on each `specbase` call. Iterating the registry covers new skills too.
  it('pre-approves the specbase CLI via allowed-tools in every deployed skill', () => {
    for (const { template, dirName } of getSkillTemplates()) {
      const content = generateSkillContent(template, 'PARITY-BASELINE');
      expect(content, dirName).toContain('allowed-tools: Bash(specbase:*)');
    }
  });

  it('teaches store selection in every deployed spcb command template', () => {
    for (const entry of getCommandContents()) {
      expect(entry.body, entry.id).toContain(STORE_SELECTION_GUIDANCE);
    }

    // Feedback has no store-capable command and intentionally carries no
    // store teaching; it ships outside both registries.
    expect(getFeedbackSkillTemplate().instructions).not.toContain('**Store selection:**');
  });

  it('generates no workspace-planning residue in any workflow template (4.1)', () => {
    const allSkills: Array<[string, () => SkillTemplate]> = [
      ['specbase-apply-change', getApplyChangeSkillTemplate],
      ['specbase-sync-specs', getSyncSpecsSkillTemplate],
      ['specbase-archive-change', getArchiveChangeSkillTemplate],
      ['specbase-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['specbase-verify-change', getVerifyChangeSkillTemplate],
    ];

    for (const [dirName, createTemplate] of allSkills) {
      const content = generateSkillContent(createTemplate(), 'PARITY-BASELINE');
      expect(content, dirName).not.toContain('workspace-planning');
      expect(content, dirName).not.toContain('Workspace guard');
    }
  });
});
