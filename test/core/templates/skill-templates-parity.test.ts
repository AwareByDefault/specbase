import { createHash } from 'node:crypto';
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
} from '../../../src/core/shared/skill-generation.js';
import { STORE_SELECTION_GUIDANCE } from '../../../src/core/templates/workflows/store-selection.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '8082e7078ca4a65e4f5c607dc76b26df0e2dc2c553e3b398c2c0892a272e7c4c',
  getNewChangeSkillTemplate: '39663a6d2037e6697020393a66f6327506e3e3bc573b7a3556dcb7f9457dc51d',
  getContinueChangeSkillTemplate: '1bb28875d6e5946ea2ec5f12e90f55d9784c2fa1f6e4c4e2d0eda53d861d4c75',
  getApplyChangeSkillTemplate: 'd6534966c118dcbfc253c088d56acaa733815eef8c1271fc2faf3ceae9709ec8',
  getFfChangeSkillTemplate: '75added6663cabeb13dde090ac294704c4689b83d6cb5c1efd74becfd33550d3',
  getSyncSpecsSkillTemplate: '75abb20572256e2b8a647e77befae99f109ab5c4dc954a9c3c184829b5fcaa40',
  getOnboardSkillTemplate: '54e51229b97d2c5e619c8e3b3b3dab3572a005ab3295d138d324cfa4d91dc7cc',
  getSpcbExploreCommandTemplate: '1f3ecc119a590452c3e508ea45abfd76222091a586472139a21c416de8d82008',
  getSpcbNewCommandTemplate: '81c0792daaee94d137d02b5608c1a055351eee03315a6f1e5f2bf87f7020120f',
  getSpcbContinueCommandTemplate: 'fa047d87d8d7750b01c017a2b80b808ef97ed9c5737c4f529c5c677a850ddfd4',
  getSpcbApplyCommandTemplate: 'd20f5fb4d2c7fc5dec14e2201f0cc6fc36266c15a21b17f10c93a62dda4a709f',
  getSpcbFfCommandTemplate: 'fb307f2857f60821c94afb8260164db89955b389fc903103217f9ff1ecfaf45c',
  getArchiveChangeSkillTemplate: 'c511a1c943bcfc5f9f3833b8c0ff284b22d34864a08f5f553cec471ee485d38f',
  getBulkArchiveChangeSkillTemplate: '0f635913757ae3d1609e111f4a8f699443ca47cbaaf8a1b21eb652f7b96a1d13',
  getSpcbSyncCommandTemplate: '23abc4861fd3a0908e877bb464d0978468cb13f085ad09d53a6db2ddb5d8fb15',
  getVerifyChangeSkillTemplate: 'd718c79aad649223a73fdb11036c93fb3842ac5a780f4934d50bfa03c9692683',
  getSpcbArchiveCommandTemplate: '4d70b969c52b1f8e92acbd11b94c35f843cfc90fe99ba902f4ac3b5ff9d9f973',
  getSpcbOnboardCommandTemplate: 'ad979e5263493735c9ba660bb2dbc4fb629b62ab439d528c9c06d4a9738de843',
  getSpcbBulkArchiveCommandTemplate: '0c987956bab820ad329bc424d9c42f90016b2998bb08bebf454309470c4f7242',
  getSpcbVerifyCommandTemplate: 'd00d510e0da5c3bebdc8916be7fdbe89168791d30d5d94c28ade87581fd1c279',
  getSpcbProposeSkillTemplate: '2e2f9919335c001a59642499f89c8b2c4bbbb55fb3d9ae6b4778a98ac3b3918b',
  getSpcbProposeCommandTemplate: '95d26d50dc85eda6b8d965cc571dec0f121d5e7f0d13a3c7dd9608a7c980d5b7',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getUpdateChangeSkillTemplate: 'a593ba2dd8889effaabf1e754a3bd65360f6d1156af650e1cfc4326a8f7ee7ee',
  getSpcbUpdateCommandTemplate: 'b3ed67de67fd2f0c072c2eb98a35e88644f1755e552a435804a05c2b01a1a833',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '8a27e4e28cf35b8210a0703ea2121da8aa3d76540774414434d7039fff938128',
  'openspec-new-change': 'd5b8909bea70a33b7a312b38ce204a91f40b6bb2bff12c4c06b3e11641b6a689',
  'openspec-continue-change': '39b4467a4873cde7c97d52c80d53ac647b220bf7c9d96f4e6505f3188e1a1642',
  'openspec-apply-change': 'f66ccb0f12ba4839f1817ba49254717bc3ec90288f20f81392439dd18fc4df77',
  'openspec-ff-change': '9e9b0c641ddfb397f25e3290e662d817738569ae0e9b3f6d58ad14b2afa7abcd',
  'openspec-sync-specs': 'f6a1581eb11a30061795c42582db6fa4f5e1f213b4b7cad9f3cbfbe3e9fb2d97',
  'openspec-archive-change': '1821aee5a06afd895d59d1e1d16495e484b6087ecf59ec93460d7d5e7851e772',
  'openspec-bulk-archive-change': '7b09b04a440809dd7dbf0b1d7b695cbb8c41184d8d104eb32e82d7cdfb476d18',
  'openspec-verify-change': '9a8735eaaa34c278d2193eb32fa736f4b111d1c47e675971c8df40f81d20c8c3',
  'openspec-onboard': '0ca945a67fd42f19adc7bcee09ed127d24ca67db37fe3669ae0cf2d5e784fa11',
  'openspec-propose': 'd7d791f143e99617528ab36adbc7564ea7dab620c952b017c29a1390fdce4f17',
  'openspec-update-change': '7095f5c80c5058b49cc95cd355ae6a031b944c2fe1642fbc54e4d71e5c718846',
};

// Intentionally excludes getFeedbackSkillTemplate: this list only models templates
// deployed via generateSkillContent, while feedback is covered in function payload parity.
const GENERATED_SKILL_FACTORIES: Array<[string, () => SkillTemplate]> = [
  ['openspec-explore', getExploreSkillTemplate],
  ['openspec-new-change', getNewChangeSkillTemplate],
  ['openspec-continue-change', getContinueChangeSkillTemplate],
  ['openspec-apply-change', getApplyChangeSkillTemplate],
  ['openspec-ff-change', getFfChangeSkillTemplate],
  ['openspec-sync-specs', getSyncSpecsSkillTemplate],
  ['openspec-archive-change', getArchiveChangeSkillTemplate],
  ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
  ['openspec-verify-change', getVerifyChangeSkillTemplate],
  ['openspec-onboard', getOnboardSkillTemplate],
  ['openspec-propose', getSpcbProposeSkillTemplate],
  ['openspec-update-change', getUpdateChangeSkillTemplate],
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

  // Auto-approve the OpenSpec CLI: every generated skill carries
  // `allowed-tools: Bash(openspec:*)` so agents that honor it stop prompting
  // on each `openspec` call. Iterating the registry covers new skills too.
  it('pre-approves the openspec CLI via allowed-tools in every deployed skill', () => {
    for (const { template, dirName } of getSkillTemplates()) {
      const content = generateSkillContent(template, 'PARITY-BASELINE');
      expect(content, dirName).toContain('allowed-tools: Bash(openspec:*)');
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
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-verify-change', getVerifyChangeSkillTemplate],
    ];

    for (const [dirName, createTemplate] of allSkills) {
      const content = generateSkillContent(createTemplate(), 'PARITY-BASELINE');
      expect(content, dirName).not.toContain('workspace-planning');
      expect(content, dirName).not.toContain('Workspace guard');
    }
  });
});
