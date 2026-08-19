/**
 * propose-enforce skill (change split-enforcement-workflow, spec `agents.workflow`).
 *
 * The operational artifact of the `agents.workflow` pair's `verifiability-feedback`
 * requirement: a SKILL.md that COMPLETES a proposed change whose enforcement the
 * feature pass deliberately left blank.
 *
 * It is the SECOND phase of the two-phase proposal workflow, run after
 * `/spcb:explore-enforce` has decided verifiability. On the SAME change it writes
 * enforcement.yaml, fills the proposal's `Enforcement intent` and the design's
 * `Enforcement design`, updates tasks.md with the evidence-delivery steps, and MAY
 * restate an unverifiable requirement toward observability -- never expanding
 * the feature's scope.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';
import type { SpecModel } from '../../artifact-graph/types.js';
import { withGovernedGuidance, buildGovernedPrimer } from './governed-guidance.js';

/**
 * Governed guidance for both projections of the enforce phase. The primer
 * carries the projected enforcement-type roster and the binding grammar, which
 * the `governed-guidance-projection` tests require on every model-aware surface;
 * the bespoke note keeps the pass honest about coverage. */
const PROPOSE_ENFORCE_GOVERNED = (specModel: SpecModel) =>
  specModel.kind === 'governed'
    ? `${buildGovernedPrimer(specModel)}\n\n## Enforcement quality stance\n\nCoverage is a mirror, not a target. A passing check proves it ran, not that it verifies the claim. Prefer the highest-leverage check; use review/manual strength openly rather than faking automation; never write a hollow test to inflate coverage. \`degraded\` is a legitimate, visible state.`
    : '';

const PROPOSE_ENFORCE_BODY = `Complete enforcement for a feature that is already proposed.

This is the **second phase** of the two-phase proposal workflow. The feature pass
(\`/spcb:propose\`) wrote the proposal, the spec deltas, and the design, and left
the enforcement/testing sections as TO-BE-FILLED with no \`enforcement.yaml\`.
\`/spcb:explore-enforce\` has already explored how each requirement is verified.
This step turns that strategy into the governed artifacts, on the SAME change.

**What to fill:**

- **\`enforcement.yaml\`** beside every governed spec delta: a \`bindings\` map
  keyed by stable binding ID; each value is exactly \`type\`, \`covers\`, and
  \`source\`. \`covers\` names requirement IDs only (scenarios inherit). Choose
  \`type\` from the resolved roster (\`test\`, \`lint\`, \`static-analysis\`,
  \`command\`, \`review\`, \`manual\`); \`source\` is a project-relative file or
  a configured lens. Bind at the requirement level, not per scenario.
- **The proposal's \`Enforcement intent\`** table: covered truth | planned type |
  planned source | intended proof.
- **The design's \`Enforcement design\`** source contracts: assertions or
  observations, fixtures and harness, failure signal, known boundary.
- **\`tasks.md\` evidence-delivery steps**: say "Implement each source through
  its native harness, link it, execute it, record the result."

**You MAY emit \`MODIFIED\` deltas** into the existing spec or design when
\`explore-enforce\` flagged a requirement too vague to observe or a design too
coupled to test. Restate that requirement so a check can fail it. Such revisions
SHALL be limited to what verifiability requires and SHALL NOT broaden the
feature's scope.`;

/**
 * The propose-enforce SKILL projection. Registered under the governed model so
 * it is emitted as an invocable skill (see skill-generation.ts).
 */
export function getProposeEnforceSkillTemplate(specModel?: SpecModel): SkillTemplate {
  return {
    name: 'specbase-propose-enforce',
    description:
      'Complete enforcement for a proposed feature: fill enforcement.yaml, the Enforcement intent and design sections, and the evidence tasks. Run AFTER explore-enforce, on the same change.',
    instructions: withGovernedGuidance(
      `${PROPOSE_ENFORCE_BODY}\n\n${STORE_SELECTION_GUIDANCE}`,
      specModel,
      PROPOSE_ENFORCE_GOVERNED,
    ),
    license: 'MIT',
    compatibility: 'Requires specbase CLI.',
    metadata: { author: 'specbase', version: '1.0' },
  };
}

export function getProposeEnforceCommandTemplate(specModel?: SpecModel): CommandTemplate {
  return {
    name: 'SPCB: Propose Enforcement',
    description:
      'Complete enforcement for a proposed feature - fill enforcement.yaml, the testing sections, and the evidence tasks',
    category: 'Workflow',
    tags: ['workflow', 'enforcement', 'experimental'],
    content: withGovernedGuidance(PROPOSE_ENFORCE_BODY, specModel, PROPOSE_ENFORCE_GOVERNED),
  };
}