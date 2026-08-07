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
  getExploreSkillTemplate: '8d293b889aa05947365ed9d34d1eddaf0d65e2aae8e5ec4c82c196c2a8702871',
  getNewChangeSkillTemplate: 'f08f6d74c5ba2c0ca23deaa573c08d6643cbc38dad3be95fdb68085fa6101db5',
  getContinueChangeSkillTemplate: '80782f6cc33357649027072c63b754b3e81437e421013deba8df242363fa7e0c',
  getApplyChangeSkillTemplate: '0f08a312baa982d872a4337a33479c5098ff776149e8e5a147eab4faa87504b6',
  getFfChangeSkillTemplate: '8f8249c978da2f9483f7db9d6bff4ef3d6372b322b2244791b7d36066c2bc124',
  getSyncSpecsSkillTemplate: 'cb74ce81e23750aa391a8b5f362b400037d911e1b292154261c21dbaeeb6efb1',
  getOnboardSkillTemplate: '50eb77e1ff3cecca80fc1dcc6816a84ccc4010a18db20eab741bf5710f289980',
  getSpcbExploreCommandTemplate: '6174792c0d217cd0f70c6686a24d70a4b91c5edac2c47678bd6c0309a6b29cac',
  getSpcbNewCommandTemplate: '3a88a65a883a52f80aa49f624c647fe226277f09d488e6c2f53c839c74bb8528',
  getSpcbContinueCommandTemplate: '66ddcb9827b1b5b2f3f135a7362cb23e9b88517979a2a18715026b581917a970',
  getSpcbApplyCommandTemplate: 'a82142472a7a8dabd2afd005cd14f5931f653a590f97bc12bc0120693fb3ee50',
  getSpcbFfCommandTemplate: '9c5079883becf6adaf4299be10e6d5642b6c9138946750ce446eddca51672433',
  getArchiveChangeSkillTemplate: '8fdb3a20ede18bc2a4f2495237559b5dbc1690c9e8f8d9656f4ec0a853358157',
  getBulkArchiveChangeSkillTemplate: '933715643f054525f417fead87ff3acca5a4f715cfb5c83ac1ca251d76f1d7c0',
  getSpcbSyncCommandTemplate: '9bff68e8ce75fdd8c01c9979183cedc03a2e71a860e1e79f61cfbdd588cdf338',
  getVerifyChangeSkillTemplate: 'ea54c70d12e6c25b7b791a2a4136c3af5b11c6b615db9c5086209ea189672012',
  getSpcbArchiveCommandTemplate: '4586cbf2ba674fffe439c834f11f0a6da5e2e5154da7559957b88176ee5afbbd',
  getSpcbOnboardCommandTemplate: 'ee541923eb9fc304321742a64dbd30478530d3d4d051f6ec8add3c91183dc05d',
  getSpcbBulkArchiveCommandTemplate: '484fc86e87c7cac1fad290a916b4f50fe9c5d9b30e5459a43b6159a0ae78d4a5',
  getSpcbVerifyCommandTemplate: '93a28dc9c3b106831e4409825b3c7c13709476372a7e0c3c1d905ec2a4980f88',
  getSpcbProposeSkillTemplate: 'a4ea318a19e90118175fd16877dc2522d293ef40f85a4d6dd2765b129aa0bafe',
  getSpcbProposeCommandTemplate: '274624ee294fc6c3b9a0571a039c0c58479f3f4afd8a3e9ab4ce407db1d0e444',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getUpdateChangeSkillTemplate: 'c31a72dc0eb3651d7411c23a8797a3af29421cd37b95d04d450e9a6354d26d47',
  getSpcbUpdateCommandTemplate: '74a4aac231dd73cc84f0445e4b46a69b3a1692584e34a173a3be67a34d5b1978',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'ba3566ebf62a57f93a4029bd16169eff38d57e2846104c2035ded9a9e059cb82',
  'openspec-new-change': '6b08754f6b80a3eb0f8b582b32f42296fa20254c39e289365b741d541b573e69',
  'openspec-continue-change': 'c68dd596417397ea33382bd6e99f3e017c56283b605e3cbd255270fbc5ce36bc',
  'openspec-apply-change': 'a108ca1a9b1172e1d41269884cae0862efa8029b0daddb48361d80532146ae75',
  'openspec-ff-change': '3b3e70017daf7e21895e92e333da42f3a3865c05141598d8fa368a2a5d391bc5',
  'openspec-sync-specs': '92f94f29029f0dc41a535773ba7533d37e27786113abf4ca07a21762cdf48245',
  'openspec-archive-change': '5be9e678bd08b9eb9b652650ed75cf769b76d58a9efbb642ded4ff2c04240a7e',
  'openspec-bulk-archive-change': 'c02fb72b00ee1b65a0ab49d8a2deeee1a987e4318e0a14f46e72acaebdcddaa3',
  'openspec-verify-change': 'b5dee1057478f8f31a5e3670efeb29a94f605def05ab721c569a9a3c63722413',
  'openspec-onboard': '62d4d520230f39d146e1b34a894854cee0bea006048a50162a6be671ce51c8e7',
  'openspec-propose': 'aca0d249772c74ec66154f04552a3144e97675e14db7c2e870966b1c47147650',
  'openspec-update-change': '43bf88b7918386240475ff12074a8450adf3c7c9a4c433367bc97e2946316c29',
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
