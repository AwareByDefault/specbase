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
  getExploreSkillTemplate: '3883f4e7da792982e1e048a33c3ea284d35a67b657bf7b56662c52f14ea6c8c2',
  getNewChangeSkillTemplate: '14ad56e4776f048e0af85bc7ad55ab1d458e0e65cb87c3a69b1bdb3b3a37dcfe',
  getContinueChangeSkillTemplate: '47c2ec40d49de42beaf0239e0af204ece77ccdc273d6cd3037aef67d5ae5201b',
  getApplyChangeSkillTemplate: '70170b30e9f994969438e7938ee26014181d271ddd61b924e84170fae7010dd5',
  getFfChangeSkillTemplate: '492af7f7be2d83040842e41cba2de20a2a301a1cee5599b31afb376da8f09e17',
  getSyncSpecsSkillTemplate: '37ea4b62a46c34d8fcf5a2a38753900972f9ff916f7cdb8f03bd8dc27fa6b65a',
  getOnboardSkillTemplate: 'bb3464913cfeddc10f084f33695c853e29d9c855ffa6defd5e0c168b3172efd7',
  getSpcbExploreCommandTemplate: '3057d21e8c2296ad779bad2d3548a84a3a1efb47a32794be9e71854475e000a8',
  getSpcbNewCommandTemplate: '9064285f82900d9431f674ab005396428608d6183215bbd3e9a234a91159421e',
  getSpcbContinueCommandTemplate: 'bf634153991f1c7c520db7067bf3afb1ef8e58bb5c5e963431eb3414e0ffe786',
  getSpcbApplyCommandTemplate: 'ea436a3f4171147fb7d0ed5321cb6af6cea2dabb360b581ffe0fc518a6f14bd2',
  getSpcbFfCommandTemplate: '43b8ee61d9500101cc3e25d0eedad43959a8fc4c9332b377ad9d1d97a67127fe',
  getArchiveChangeSkillTemplate: '25c815fde5b63bd083e2e7fe229d32385014a28ac9e3090e7b6dc2a2fa275e84',
  getBulkArchiveChangeSkillTemplate: '8a26798ff117cd47927fc283917cd33edc54a69c756653f175e6f5d77271bb31',
  getSpcbSyncCommandTemplate: '15cb6a68ca8e53c85d54b19c42bda8dcdc104a96aeac058219a18c31ff4a3c70',
  getVerifyChangeSkillTemplate: '880f298983df19bcc28ca0cb874f1295feadbe93d2027f4c296dbdd043f2e3eb',
  getSpcbArchiveCommandTemplate: 'aa31d15392cdbe6da6b45835d7bf7a98c768ef1cd8be388dd415c56e9bb6d29a',
  getSpcbOnboardCommandTemplate: 'f1f33f8c8cd5d3b021a379f40dc4d6ce1ac7bb469b57e32889fab472f11d6a2a',
  getSpcbBulkArchiveCommandTemplate: 'fadb5f912aca5750c5c8725950c6d803e25f2fcc745a40c73e1d720603b63a47',
  getSpcbVerifyCommandTemplate: 'df8e201aa722bd15c8dbdec1bc5a155697892f0e30adcbf84e93549bd2b40cfd',
  getSpcbProposeSkillTemplate: '4064564e7eb62f33af6922621edb1bb6c61729baa69350b7fbc61f3d7204b8fc',
  getSpcbProposeCommandTemplate: 'de3ccae5c7a2cacc165e7c2767c91a0b28323c57511907d7a8f8b858cf1449aa',
  getFeedbackSkillTemplate: '027cd1eb22e80b16dd53264ad1ec790d6c8c50a076762ca573e658f9967020b0',
  getUpdateChangeSkillTemplate: '5a386fcc8dec3cc52555f8a32edd1589d493861b67f364fb2a341a9eca06fb8d',
  getSpcbUpdateCommandTemplate: 'ba35d157bff7e52109e49d15422d07808d8d0284e8bb9e15b4a6f70d51d6a146',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'specbase-explore': 'b711db1c38e1ccd171771ae714154dadd29529e390b4e40bc55e1138c289f7ac',
  'specbase-new-change': '7cf913854e549fec62376d70e40dd54d6da57b843f4ad5e994101f791cce2e53',
  'specbase-continue-change': 'd4f1144c5e07bfb78837b46a08c790c99226faf1bdc7ef16059112812ee0009f',
  'specbase-apply-change': '58d9460684dfdc9c6dc1b2e208482c108ec9bc2cfbb02e5dc74cf4cb0ae38255',
  'specbase-ff-change': 'eac9d0476af4979f229b506415d68f0144aeec06fce642a96e87fd1450cf1d7c',
  'specbase-sync-specs': '269484196ffcc8793812f779ecc9ad2e8f5ebd06b52d3a4e94857d00fb6bd6e9',
  'specbase-archive-change': '540726a80e38c1bb86894034e8b193299d602fdf1954d90eb23ecb0cf517e939',
  'specbase-bulk-archive-change': '1645b6c8c5fb58dd8d6d739ebc4edec03ef5953ccf88c7b7339b16509c70ed3e',
  'specbase-verify-change': 'eafca3958ef1be6c279dac4ec394ed3d21a9e476ef80dee7c3553ee3955267cf',
  'specbase-onboard': '38805ca9e375dac9484cebd925b8e110007b32aa312c47b232987ef351d7a8b6',
  'specbase-propose': '474570490e255d3e5a692a39ada774d76b8c0d341112e9937a6598637cdfd3b5',
  'specbase-update-change': 'c6371d044d13f23cac4c0de9a070a3c2a2b5cd711d60df05781b7eec9cef5449',
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
