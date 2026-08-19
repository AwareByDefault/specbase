/**
 * explore-enforce skill (change split-enforcement-workflow, spec `agents.workflow`).
 *
 * The operational artifact of the `agents.workflow` pair's `explore-enforce-skill`
 * requirement: a SKILL.md that takes a proposed feature's spec deltas as GIVEN
 * input and decides, per requirement, how the claim is KNOWN to hold — choosing
 * the highest-leverage honest check or flagging the requirement unverifiable.
 *
 * It is the SECOND phase of the two-phase proposal workflow, sequenced after the
 * feature pass (`spcb:explore` + `spcb:propose`). It never re-explores feature
 * scope or rationale; its only output is the verification strategy, which lives
 * in the change's `design.md` `Enforcement design` section (reused, not a new
 * artifact).
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';
import type { SpecModel } from '../../artifact-graph/types.js';
import { withGovernedGuidance, buildGovernedPrimer } from './governed-guidance.js';

/**
 * Governed guidance for both projections of the enforce phase. The primer
 * carries the projected enforcement-type roster and the binding grammar
 * ("exactly `type`, requirement-level `covers`, and one `source`"), which the
 * `governed-guidance-projection` tests require on every model-aware surface;
 * the bespoke note keeps the pass focused on verifiability.
 */
const EXPLORE_ENFORCE_GOVERNED = (specModel: SpecModel) =>
  specModel.kind === 'governed'
    ? `${buildGovernedPrimer(specModel)}\n\n## Enforcement focus\n\nThis skill is laser-focused on verifiability. The feature pass already fixed WHAT must remain true; this pass fixes HOW each requirement is known to hold. Do not drift into feature decisions. Reuse \`design.md\`'s \`Enforcement design\` section; do not create a new verification artifact.`
    : '';

const EXPLORE_ENFORCE_BODY = `Explore enforcement for a feature that is already proposed.

This is the **second phase** of the two-phase proposal workflow. The FEATURE phase
(\`/spcb:explore\`, \`/spcb:propose\`) decided WHAT must remain true. This phase
decides HOW we would know each requirement still holds.

**Input (given - do not re-explore):** the feature's spec deltas under
\`specs/<plane>/<locator>/spec.md\` and the \`design.md\` on the SAME change. They
are the contract. Do not re-explore the feature's scope or rationale.

**Job - verification only.** For every requirement:

- Name how the claim could be **observed or failed**.
- Pick the **highest-leverage** check among the resolved enforcement types:
  \`test\`, \`lint\`, \`static-analysis\`, \`command\`, \`review\`, \`manual\`.
  One fitness function beats many example tests; an honest \`review\`/\`manual\`
  conclusion beats a hollow automated test. 'degraded' is a legitimate, visible
  state - never write a hollow test to paper over it.
- If no automated check can meaningfully exercise the claim, say so plainly and
  choose an honest review/manual conclusion.
- **Flag any requirement too vague to observe** (no check could ever fail it).
  Those are the candidates the enforcement phase may rewrite toward
  verifiability.

Write the strategy into the change's \`design.md\` **\`Enforcement design\`**
section (reuse it - do not create a new artifact). Focus ONLY on verifiability.

**Guardrail:** never expand the feature's scope. You are deciding how to prove
what is already specified, not inventing new behavior.`;

/**
 * The explore-enforce SKILL projection. Registered under the governed model so
 * it is emitted as an invocable skill (see skill-generation.ts).
 */
export function getExploreEnforceSkillTemplate(specModel?: SpecModel): SkillTemplate {
  return {
    name: 'specbase-explore-enforce',
    description:
      'Explore enforcement for a proposed feature: decide, per requirement, how the claim is known to hold, choosing the highest-leverage honest check. Run AFTER the feature pass, on the same change.',
    instructions: withGovernedGuidance(
      `${EXPLORE_ENFORCE_BODY}\n\n${STORE_SELECTION_GUIDANCE}`,
      specModel,
      EXPLORE_ENFORCE_GOVERNED,
    ),
    license: 'MIT',
    compatibility: 'Requires specbase CLI.',
    metadata: { author: 'specbase', version: '1.0' },
  };
}

export function getExploreEnforceCommandTemplate(specModel?: SpecModel): CommandTemplate {
  return {
    name: 'SPCB: Explore Enforcement',
    description:
      'Explore enforcement for a proposed feature - decide how each requirement is known to hold',
    category: 'Workflow',
    tags: ['workflow', 'enforcement', 'experimental'],
    content: withGovernedGuidance(EXPLORE_ENFORCE_BODY, specModel, EXPLORE_ENFORCE_GOVERNED),
  };
}
