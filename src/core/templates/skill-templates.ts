/**
 * Agent Skill Templates
 *
 * Compatibility facade that re-exports split workflow template modules.
 */

export type { SkillTemplate, CommandTemplate } from './types.js';

export { getExploreSkillTemplate, getSpcbExploreCommandTemplate } from './workflows/explore.js';
export { getNewChangeSkillTemplate, getSpcbNewCommandTemplate } from './workflows/new-change.js';
export { getContinueChangeSkillTemplate, getSpcbContinueCommandTemplate } from './workflows/continue-change.js';
export { getApplyChangeSkillTemplate, getSpcbApplyCommandTemplate } from './workflows/apply-change.js';
export { getUpdateChangeSkillTemplate, getSpcbUpdateCommandTemplate } from './workflows/update-change.js';
export { getFfChangeSkillTemplate, getSpcbFfCommandTemplate } from './workflows/ff-change.js';
export { getSyncSpecsSkillTemplate, getSpcbSyncCommandTemplate } from './workflows/sync-specs.js';
export { getArchiveChangeSkillTemplate, getSpcbArchiveCommandTemplate } from './workflows/archive-change.js';
export { getBulkArchiveChangeSkillTemplate, getSpcbBulkArchiveCommandTemplate } from './workflows/bulk-archive-change.js';
export { getVerifyChangeSkillTemplate, getSpcbVerifyCommandTemplate } from './workflows/verify-change.js';
export { getOnboardSkillTemplate, getSpcbOnboardCommandTemplate } from './workflows/onboard.js';
export { getSpcbProposeSkillTemplate, getSpcbProposeCommandTemplate } from './workflows/propose.js';
export { getStackSkillTemplate, getSpcbStackCommandTemplate } from './workflows/stack.js';
export { getReviewPanelSkillTemplate, getReviewPanelCommandTemplate } from './workflows/review-panel.js';
export { getSteWritingSkillTemplate } from './workflows/ste-writing.js';
export { getFeedbackSkillTemplate } from './workflows/feedback.js';
