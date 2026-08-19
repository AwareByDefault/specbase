/**
 * Governed-model workflow guidance (design decision 10).
 *
 * The canonical SPCB workflow templates are generated once into project-agnostic
 * skill/command files. To keep the legacy flat workflow byte-for-byte unchanged
 * while teaching governed projects the declared-plane + paired-enforcement model, each
 * affected getter takes an OPTIONAL resolved spec model:
 *
 *   - omitted / legacy  -> the getter returns its existing payload verbatim, so
 *     every hash-locked parity snapshot and the default init flow are untouched.
 *   - governed          -> the governed section below is appended.
 *
 * The governed guidance itself never hardcodes plane paths or lifecycle rules as
 * ground truth for a specific project: it instructs the agent to CONFIRM the
 * governed model and read concrete artifact paths from `specbase status` /
 * `specbase instructions` output, satisfying "derive from CLI output rather than
 * hardcoding a flat capability layout".
 */
import { DEFAULT_ENFORCEMENT_TYPES, type SpecModel } from '../../artifact-graph/types.js';
import { DEFAULT_PLANES } from '../../governed/lenses.js';
import { CLEAN_SPEC_RULES, CLEAN_SPECBASE_RULES } from './clean-rules.generated.js';

/**
 * The authoring rules every governed skill carries, assembled from the build
 * artifact the clean manifestos generate. This module NEVER restates a rule:
 * `docs/clean-spec.md` and `docs/clean-specbase.md` are the single authored
 * home, `scripts/generate-clean-rules.mjs` lifts their marked Rules sections,
 * and the constants below are the only in-code copy. The rules are inlined into
 * the prompt (rather than referenced by path) because `docs/` does not ship, so
 * a path reference would dangle in every installed repo.
 */
export const GOVERNED_MANIFESTO_RULES = `### Authoring rules (governed)

These rules travel with this skill; apply them whenever you place or write a
governed pair. They are the current text of this project's clean manifestos.

**Placement - where a pair belongs:**

${CLEAN_SPECBASE_RULES}

**Writing - what one pair says:**

${CLEAN_SPEC_RULES}`;

/** True only when a governed spec model is resolved. Core dispatches on the
 * declared model, never on a schema name. Doubles as a type guard so callers
 * can narrow `SpecModel | undefined` to `SpecModel` after the check. */
export function isGovernedModel(specModel?: SpecModel): specModel is SpecModel {
  return specModel?.kind === 'governed';
}

/**
 * Append governed guidance to a base template body when (and only when) the
 * resolved model is governed. Returns the base unchanged otherwise, which keeps
 * legacy output identical down to the byte. `guidance` may be a static string
 * (for plane-agnostic guidance) or a function of the resolved spec model (so
 * plane-aware guidance interpolates the project's declared planes at generation
 * time rather than baking a static plane roster into the prompt).
 */
export function withGovernedGuidance(
  base: string,
  specModel: SpecModel | undefined,
  guidance: string | ((specModel: SpecModel) => string)
): string {
  if (!isGovernedModel(specModel)) return base;
  const body = typeof guidance === 'function' ? guidance(specModel) : guidance;
  return `${base}\n\n${body}`;
}

/**
 * Shared primer: how to recognize the governed model at runtime and where its
 * durable truth lives. Reused verbatim by every affected workflow so skill and
 * command projections carry identical governed semantics (parity requirement).
 */
/**
 * The curated per-plane trigger lists for every default-shipped plane
 * ({@link DEFAULT_PLANES}). These are hand-written pedagogy (the same quality as
 * the original architectural structural-trigger list) so explore on the defaults
 * is crisp; user-added planes beyond the defaults get the plane-agnostic
 * procedure instead.
 */
export const DEFAULT_PLANE_TRIGGERS: Record<string, string> = {
  behavior: [
    'Outcome triggers (it is behavioral truth when the claim is about):',
    '- a user- or client-visible outcome (what the system DOES, observable),',
    '- a change to inputs the user provides or outputs the user/client sees,',
    '- a public contract (HTTP/CLI/UI response shape, error, or flag).',
  ].join('\n'),
  architecture: [
    'Structural triggers (it is architectural truth when building it hits):',
    '- a new port or adapter, or any new seam between the core and the outside',
    '  world (persistence, network, filesystem, clock, external service);',
    '- a new package, module, or layer, or a shift of responsibility between',
    '  existing ones;',
    '- a new dependency edge or boundary rule (who may import/depend on whom),',
    '  or a change to an existing one;',
    '- a new cross-cutting invariant the code must uphold (purity, determinism,',
    '  dependency injection, isolation, error-handling policy).',
  ].join('\n'),
  ops: [
    'Selection/run triggers (it is ops truth when the claim is about):',
    '- adopting, replacing, or removing a dependency, runtime, or tool;',
    '- how the dev environment boots or what it must mirror;',
    '- infrastructure declared as state (Terraform/IaC) rather than ad-hoc scripts;',
    '- how the system is deployed or where it runs in production.',
  ].join('\n'),
  'code-quality': [
    'Smell/quality triggers (it is code-quality truth when the claim is about):',
    '- a code smell to prohibit (ambient time, hidden coupling, deep nesting);',
    '- a clean-code quality the code must uphold (names reveal intent, no cruft);',
    '- what makes a good test (assert behavior not implementation, no mock-call',
    '  order assertions).',
  ].join('\n'),
  'design-system': [
    'Identity triggers (it is design-system truth when the claim is about):',
    '- a design token or token set (color, type scale, spacing, motion) and what',
    '  the token artifact must contain — the truth DESCRIBES the token file, which',
    '  stays the runtime source of truth;',
    '- a design principle the UI must uphold (contrast, density, affordance,',
    '  accessibility floor);',
    '- the product voice: how copy, labels, and errors must read.',
    'Token truths are enforced by token-lint / contrast + a11y checks against the',
    'token artifact; principle and voice truths bind the design review lens.',
    'NOT a user-visible outcome of a feature — that is behavior.',
  ].join('\n'),
  agents: [
    'Instrument triggers (it is agents truth when the claim is about one of the',
    'repo’s OWN agentic instruments, NOT how an agent should behave):',
    '- a review panel / lens set the repo runs over its own code;',
    '- a repo-specific skill, subagent, or command the repo builds for agents;',
    '- a hook (commit, CI, or tool hook) the repo installs as an agent guardrail;',
    '- the repo’s use of the spec-driven workflow itself (spcb, its plane roster).',
    'NOT a tool/language preference or safety rule for generated code — those ride',
    'on the plane whose subject they constrain (ops, code-quality, behavior).',
    'Each agents spec DESCRIBES an operational artifact (config.yaml, the lens set,',
    'a SKILL.md, a hook) and is enforced by a conformance/drift check against it —',
    'the artifact stays the runtime source of truth; the spec never generates it.',
  ].join('\n'),
};

/**
 * Shared primer: how to recognize the governed model at runtime and where its
 * durable truth lives. Generated from the resolved plane set so a project's
 * declared planes (and their purposes) are baked into its prompts at write time
 * rather than enumerated as a static two-plane constant. Reused by every affected
 * workflow so skill and command projections carry identical governed semantics
 * (parity requirement).
 */
export function buildGovernedPrimer(specModel: SpecModel): string {
  const planes = specModel.kind === 'governed' ? specModel.planes : [];
  const planeLines = planes.map(
    (p) => `- ${p.id}: ${p.purpose} (enforcement: ${p.enforcementFlavor}) \u2192 \`specs/${p.id}/<locator>/{spec.md,enforcement.yaml}\``
  );
  const planeIds = planes.map((p) => p.id);
  const enforcementTypes = specModel.kind === 'governed'
    ? specModel.enforcement?.types ?? DEFAULT_ENFORCEMENT_TYPES
    : [];
  const enforcementTypeLines = enforcementTypes.map(
    (type) => `- ${type.id}: ${type.purpose} (strength: ${type.strength}; source: ${type.sourceKind})`
  );
  // The shipped defaults are read from the one place that declares them, never
  // restated here: a roster literal in this module is exactly the frozen-roster
  // bug this guidance exists to avoid.
  const defaultIds = DEFAULT_PLANES.map((p) => p.id);
  const defaultsCovered = defaultIds.filter((id) => planeIds.includes(id));
  const userAdded = planes.filter((p) => !defaultIds.includes(p.id));
  const firstPlane = planes[0]?.id ?? 'behavior';
  // Opt-in agents plane: append its distinct conventions only when the project
  // declares it, so a project without it gets byte-identical guidance.
  const agentsConventions = planeIds.includes('agents')
    ? `

**Agents plane (this project declares it):** its members are the repo's OWN
agentic instruments (review panel, repo-specific skills, subagents, hooks), NOT
guardrails on agent behavior — those ride on the plane whose subject they
constrain. Each agents \`spec.md\` **describes** an agent-operational artifact
(\`config.yaml\`, the lens set, a \`SKILL.md\`, a hook) and its \`enforcement.yaml\`
binds a **conformance/drift source** to that artifact using a type from the
resolved project roster — no agents-only type, and the spec never generates the
artifact (the runtime keeps the artifact as its source of truth). \`specbase
init\` may PLANT baseline agents specs (\`agents/spec-driven\`, \`agents/review-panel\`)
directly as scaffolding — the one exception to the proposal→spec→archive flow;
edit a planted baseline through a change, never by re-running init.`
    : '';
  return `## Governed spec model

This project uses the governed spec model (${planes.length} permanent truth plane${planes.length === 1 ? '' : 's'} with paired enforcement). Do NOT assume the flat \`specs/<capability>/spec.md\` layout.

**Confirm the model from the CLI, do not guess:**
- Run \`specbase status --change "<name>" --json\` and read \`specModel\`.
- The governed model reports \`specModel.kind == "governed"\` with
  \`planes: [${planeIds.join(', ')}]\` and \`pairedEnforcement: true\`.
- If \`specModel.kind\` is \`legacy\` (or absent), follow the flat-spec guidance
  above unchanged.

**Under the governed model, derive concrete paths from CLI output** (\`status\`
\`artifactPaths\` and \`specbase instructions <artifact> --change ... --json\`),
never hardcode them. Durable truth lives in the declared planes:
${planeLines.join('\n')}

Every governed \`spec.md\` is PAIRED with an \`enforcement.yaml\`. Its binding values contain exactly \`type\`, requirement-level \`covers\`, and one \`source\`; the binding map key is its stable identity. Scenarios inherit coverage from their requirement. The resolved enforcement types are:
${enforcementTypeLines.join('\n')}

Stable identity is
scoped narrowly: the frontmatter \`id\` (e.g. \`${firstPlane}.<locator>\`) is the only project-unique governed ID; requirement, scenario, and binding \`**ID:**\` slugs are unique only within their pair, and stay fixed when titles or locators move.

**Plane classification:** match each proposed claim to the plane whose declared
purpose best fits the claim's nature. The shipped defaults are ${defaultsCovered.length ? defaultsCovered.join(', ') : 'none'};${userAdded.length ? ` this project also declares ${userAdded.map((p) => p.id).join(', ')} (read its purpose from the CLI).` : ''} a single initiative may touch several planes \u2014 list one spec per plane touched, never mix planes in one spec.

**Structure conventions (governed):**
- Locators may nest to arbitrary safe depth (e.g. \`${firstPlane}/platforms/desktop\`);
  JSON reports normalized slash-separated locators, filesystem access is native.
- A directory that only GROUPS child pairs is a **namespace** and needs no pair of
  its own. Only a directory that contains \`spec.md\` must also contain
  \`enforcement.yaml\`; ancestry provides navigation, never inherited requirements.
- A change stores its \`spec.md\` and \`enforcement.yaml\` deltas under the SAME
  plane-qualified locator as the target current pair, so both members move together.${agentsConventions}

${GOVERNED_MANIFESTO_RULES}`;
}

/**
 * The trigger-list block for the explore classifier: curated prose for each
 * default plane the project declares, plus a plane-agnostic procedure for any
 * user-added planes beyond the defaults.
 */
export function buildPlaneTriggers(specModel: SpecModel): string {
  const planes = specModel.kind === 'governed' ? specModel.planes : [];
  const blocks: string[] = [];
  for (const plane of planes) {
    const triggers = DEFAULT_PLANE_TRIGGERS[plane.id];
    if (triggers) {
      blocks.push(`**${plane.id} plane** \u2014 ${triggers}`);
    } else {
      blocks.push(
        `**${plane.id} plane** \u2014 match claims to this plane by its declared purpose: "${plane.purpose}". Enforcement flavor: ${plane.enforcementFlavor}.`
      );
    }
  }
  return blocks.join('\n\n');
}

/**
 * The onboarding lesson's plane enumeration: one indented line per declared
 * plane (id, purpose, storage subtree). The lesson teaches the project's roster
 * rather than a fixed pair, so a project that adds or removes a plane onboards
 * on the planes it actually has.
 */
export function buildOnboardPlaneLesson(specModel: SpecModel): string {
  const planes = specModel.kind === 'governed' ? specModel.planes : [];
  return planes
    .map((p) => `  - **${p.id}** - ${p.purpose}, under \`specs/${p.id}/...\`.`)
    .join('\n');
}

/**
 * The distilled enforcement/testing philosophy, shared verbatim by the explore
 * (general altitude) and authoring (concrete altitude) guidance so both apply
 * the same lens. It resists the coverage-as-target flood: evidence is allocated
 * deliberately, high-leverage checks are preferred, and review/manual are
 * first-class honest evidence.
 */
export const GOVERNED_ENFORCEMENT_PHILOSOPHY = `### Enforcement philosophy (governed)

Enforcement records how each normative claim is *known to hold* - it is not a
coverage quota. Aim for deliberate, honest evidence, not a wall of tests:

- **Coverage is a mirror, not a target.** A passing check proves it *ran*, not
  that it verifies the claim; do not maximize automated bindings for their own
  sake. \`degraded\` (a spec covered only by review/manual) is factual, not a
  demerit - never write a hollow test to "upgrade" it.
- **Prefer the highest-leverage check.** ONE fitness function (lint /
  static-analysis / conformance test) protects a structural invariant across the
  whole codebase; ONE property/invariant test covers a whole family of cases.
  Reach for these before example tests.
- **Bind at the requirement level, not per scenario.** Scenarios are examples
  that one binding's test family already covers - do NOT write one test per
  scenario, and do NOT create one binding per scenario.
- **Spend example tests on what bites:** the representative, edge, and risky
  cases - not every enumerated path.
- **Match a resolved type to the claim:** use the projected type roster rather
  than a frozen mechanism list. File-backed types point to project sources;
  lens-backed types point to configured lenses. Keep procedures, assertions,
  harness details, and limitations in planning artifacts and the source itself,
  never in the compact manifest. Use review/manual strength openly rather than
  faking automation.`;

/**
 * explore (spcb-explore-skill spec): staged behavior -> architecture ->
 * enforcement exploration, the dual-plane classifier, coverage-informed health
 * awareness, and the durable-insight classification table.
 */
export const GOVERNED_EXPLORE_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Health check first (governed)

Open a governed explore session by consulting the aggregated coverage view:
run \`specbase coverage --json\` and read the per-spec states and orphan
classes. Mention any rot or gaps in the areas the idea touches - hanging
claims, stale bindings, **degraded** specs (covered only by review/manual
evidence), unresolved sources, or orphaned enforcement - and factor that health
into the discussion. When the idea touches a spec whose state is hanging,
stale, or degraded, surface that state and suggest addressing it or explicitly
deferring it in the proposal.

### Staged exploration: behavior -> structure -> enforcement (governed)

Walk a new idea through three named stages. Stay a conversational thinking
partner - the stages order the discussion, they are not a rigid script:

1. **Desired behavior.** What observable outcome does the user want, and which
   **behavioral spec pair** (\`specs/behavior/...\`) would own it?
2. **Supporting structure.** What structure must remain true to build it -
   packages, responsibilities, boundaries, invariants - and which
   **architectural spec pair** (\`specs/architecture/...\`) would own each
   invariant? Actively ask whether building this introduces any **structural
   trigger** (see the classifier below); a "yes" to any means an architectural
   spec is in scope, not optional.
3. **Enforcement - deferred to its own phase.** Feature exploration covers
   desired behavior and supporting structure only. Do **NOT** sketch bindings,
   source files, \`covers\` lists, or evidence strengths here, and do not decide
   verifiability: the requirements do not exist yet. Once the feature is
   proposed, verifiability is decided deliberately by **\`/spcb:explore-enforce\`**
   (how each requirement is known to hold) then **\`/spcb:propose-enforce\`**
   (writes the bindings and the testing sections on the same change).

**Plane classifier:** explicitly classify which plane(s) the idea touches. For
EACH declared plane, match the claim to its trigger list below; a "yes" to any
trigger means a spec in that plane is in scope, not optional:

${buildPlaneTriggers(specModel)}

- For user-added planes beyond the defaults, fetch \`specModel.planes\` from
  \`specbase status --json\` and match the claim to the plane whose declared
  \`purpose\` best fits the claim's nature. Do not force a claim into a plane
  whose purpose it does not match.
- If the idea touches several planes, name a candidate locator in EACH touched
  plane and author one spec pair per plane. Example: "add persistent history" is
  behavioral (\`behavior/history\`: save-on-write, list) AND architectural
  (\`architecture/persistence-port\`: a new store port + adapter) - author both,
  and bind each invariant to the check that protects it.
- If it only alters one plane's concerns within the existing others, plan a spec
  pair in that plane only and say why no other plane is needed.

The enforcement philosophy lives with the enforcement phase
(\`/spcb:explore-enforce\` + \`/spcb:propose-enforce\`), where the requirements
and scenarios exist to bind against. Feature exploration does not resolve it -
that is the point of the split.

### Classifying durable insights (governed)

Before offering to capture anything, decide which of five homes an insight
belongs to - they are not interchangeable:

| Insight | Home |
|---|---|
| User/client-visible capability that must stay true | Behavioral spec pair (\`specs/behavior/...\`) |
| Package responsibility or dependency invariant that must stay true | Architectural spec pair (\`specs/architecture/...\`) |
| Repo/ops selection or run-time invariant | Ops spec pair (\`specs/ops/...\`) |
| Code smell, quality, or rule | Code-quality spec pair (\`specs/code-quality/...\`) |
| Durable claim-to-source link | Paired \`enforcement.yaml\` binding |
| Intended proof, source contract, harness, and boundary | Proposal, design, tasks, and the source |
| Why THIS change is being made a certain way | \`design.md\` / \`proposal.md\` (change design) |
| Historical rationale for a past transition | The dated change archive |

- When exploration establishes a package responsibility or dependency invariant
  that must remain true, name it as a possible **architectural requirement** and
  consider how it could be **enforced** (which resolved type and source would protect it).
- When exploration only explains why one implementation approach was chosen for a
  particular change, its durable home is **design or proposal** (transitional
  rationale), NOT current architectural truth.
- Never fold "why we changed it" into an architectural spec: the spec states only
  what must be true now.
- When a custom test or lint **tool** itself exposes durable user-visible behavior
  (its own outputs, flags, or errors), that behavior is **behavioral truth** -
  specify it in a behavioral spec pair. Bind the architectural requirement to that
  tool through an **enforcement binding**; do NOT embed the tool's implementation
  inside the architectural spec.

### Non-deterministic claims: point at a lens or propose one (governed)

When a claim is genuinely **non-deterministic** - no automated check meaningfully
proves it (does the code actually PRODUCE the behavior? does it DEVIATE from the
architecture? does this test EXERCISE the claim or just import it?) - it is a
\`review\` binding executed by the **review panel**, a growing per-codebase panel of
blind per-lens reviewers.

- **Point the claim at an existing lens.** Name the review-panel \`lens\` that owns
  its concern: \`architectural\` (deviations from \`architecture/**\`), \`behavioural\`
  (does the code produce \`behavior/**\`), \`ops\` (does the repo use what the ops
  specs declare), \`enforcement\` (does the bound check actually exercise the claim),
  or \`code-quality\` (cleanliness). A lens's scope is a spec-tree subtree, resolved
  most-specific-first.
- **Or propose a new/scoped lens - never auto-create one.** If no existing lens
  fits, PROPOSE adding a new lens, or splitting a broad lens into a scoped one over
  a nested subtree (e.g. \`architecture/rings/boundaries\`), as a normal change.
  Growth is by proposal: the panel never adds or splits a lens on its own.
- **Coverage makes the pressure visible.** \`specbase coverage\` reports each lens's
  review-claim load, un-lensed review claims, and split candidates - use it to
  decide when to grow a lens, split one, or harden a claim to automated. The tool
  surfaces the case; the human makes the call.`;

/**
 * new / propose / ff / continue (task 6.2 / Requirement: Proposal and artifact
 * creation classify governed changes).
 */
export const GOVERNED_AUTHORING_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Surface the chosen structure before authoring (governed)

Placement is a decision worth showing. Once you have chosen where each pair
goes - and BEFORE you author its contents - present the placement, then offer to
discuss it:

1. **Show each chosen locator with the rule that put it there.** One line per
   pair: the plane-qualified locator, and the placement rule above that decided
   it (the actor test, one truth one plane, hoist on duplication, quantify to
   place, earn parents, earn depth). Name the rule; do not just assert the path.
2. **Say what you weighed and rejected** wherever the call was genuine - the
   sibling you did not hoist to, the parent you did not earn, the second plane
   you ruled out and why.
3. **Offer to discuss, and mean it.** Invite the user to move, split, merge, or
   re-plane anything you showed. The offer does NOT block: carry straight on
   into authoring, and revise the placement if they come back on it. This is an
   opt-OUT - never make the user opt in before you place.
4. **Stop and ASK only when placement is genuinely ambiguous** - two planes fit
   the same claim, or the change would have to create a parent pair. Real
   ambiguity is a question; a routine placement is an FYI.

**Writing quality is never gated by that offer.** Apply the writing rules above
to every \`spec.md\` and \`enforcement.yaml\` you author, whether or not the user
engages with the structure discussion. The offer decides WHERE truth lives; the
writing rules decide HOW it is stated, and they always apply.

### Classifying planes and creating pairs (governed)

- **Classify every proposed spec by plane** (behavioral vs architectural truth).
  A single initiative may change user-visible behavior AND package boundaries; if
  so, author **separate deltas for each plane**, each with its own stable spec ID.
- **Create specifications THEN enforcement**, following the schema's artifact
  order (\`specs\` before \`enforcement\`). Get each artifact's guidance and output
  path from \`specbase instructions <artifact> --change "<name>" --json\` and write
  to the CLI-reported paths.
- **Assign stable identity when authoring:** a project-unique spec \`id\` in the
  \`spec.md\` frontmatter, and pair-local \`**ID:**\` slugs for each requirement,
  scenario, and enforcement binding.
- **Pair every governed spec with enforcement:** each SHALL/MUST requirement needs
  at least one source binding in the paired \`enforcement.yaml\`. Each binding
  value contains exactly \`type\`, requirement-level \`covers\`, and one \`source\`.
- **Author bindings by the philosophy below - now the requirements exist, apply
  it concretely:** choose a type from the resolved roster and the
  *highest-leverage real source* for each requirement. Use multiple bindings for
  multiple sources and a real configured lens where automation is dishonest. Keep
  assertions, procedures, harness details, and boundaries in the proposal,
  design, tasks, and source. Do NOT emit one binding per scenario or a hollow
  test to inflate coverage.

${GOVERNED_ENFORCEMENT_PHILOSOPHY}`;

/** update (task 6.3 / Requirement: Change updates preserve pair coherence). */
export const GOVERNED_UPDATE_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Keeping pairs coherent on update (governed)

Review each governed \`spec.md\` together with its paired \`enforcement.yaml\` - never
update one member of a pair in isolation. When you add, modify, remove, or move a
normative claim, check the paired bindings for the result:

- **Removed requirement** whose stable ID a binding still \`covers\` -> update or
  remove that now-**stale** binding, and report a no-longer-referenced file
  \`source\` as a **cleanup candidate** (do not delete it here - apply decides
  safely). Scenario edits inherit through the owning requirement and do not stale
  a requirement-level binding.
- **Added SHALL/MUST claim** with no covering binding -> a **hanging claim**; add a
  binding.
- **Moved spec** (new locator, same meaning) -> keep the stable spec \`id\`
  unchanged; only the mutable locator/title changes.
- Preserve all scoped IDs (spec, requirement, scenario, binding) across the edit
  so drift detection stays meaningful.`;

/** sync (task 6.5 / Requirements: Specs Sync Skill, Delta Reconciliation Logic). */
export const GOVERNED_SYNC_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Reconciling governed pairs (governed)

- Discover complete delta pairs from CLI status and resolve current pairs by stable spec identity.
- Merge requirements by pair-local requirement ID and compact bindings by their map keys.
- Treat \`spec.md\` and \`enforcement.yaml\` as one coherent write; never promote one half.
- Validate every compact binding's resolved type, requirement-level \`covers\`, and \`source\`.
- Normalize every touched pair to \`enforcement.yaml\`; remove a legacy member only after successful promotion.
- Report an unreferenced former file source as a cleanup candidate, but never delete project code.`;

export const GOVERNED_VERIFY_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Verifying linkage, execution, and correspondence (governed)

Start with \`specbase coverage --json\`, the aggregated enforcement-coverage view backing this assessment.

1. **Structural linkage.** Resolve each binding type from the projected roster and resolve its source by source kind. A valid link means only that coverage is declared.
2. **Native-harness execution.** For each affected file source, inspect the repository to identify its native test, lint, analysis, or procedure harness. Run it when available and record the exact result; otherwise report it as unexecuted. Never invent a command vector from the manifest.
3. **Semantic correspondence.** Review whether each source plausibly exercises its covered requirement. A source that exists or passes can still be a mismatch.
4. **Scenario inheritance.** Judge bindings at requirement level; scenario additions, renames, and removals do not stale a binding.
5. **Review residue.** For a lens source, derive deterministic sibling evidence from automated bindings covering the same requirement. Do not use manual \`covered_by\` lists.

Report linkage, execution, and correspondence separately. Never describe a resolvable source as a passing execution.`;

export const GOVERNED_ARCHIVE_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Archiving a governed change (governed)

Require complete pairs, valid requirement-level coverage, resolved types and sources, and recorded native-harness results before archive. Promote \`spec.md\` with compact \`enforcement.yaml\` as one unit. A validation bypass is explicit and unverified. Report retired unshared file sources as cleanup candidates without deleting them.`;

export const GOVERNED_BULK_ARCHIVE_GUIDANCE = (specModel: SpecModel) => `${GOVERNED_ARCHIVE_GUIDANCE(specModel)}

Apply the readiness decision independently to every change and report each archived, blocked, or bypassed result.`;

export const GOVERNED_APPLY_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Delivering enforcement sources (governed)

Use \`specbase coverage --json\` as the aggregated coverage health signal while applying.

For every planned source: implement or update the source, link it with exactly \`type\`, requirement-level \`covers\`, and \`source\` in \`enforcement.yaml\`, execute it through its native project harness, and record the result. Do not copy commands, status, targets, procedures, or limitations into the compact manifest. Before cleaning up a retired file source, prove no surviving binding references it.`;

export const GOVERNED_ONBOARD_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Teaching the governed model while onboarding (governed)

When the project uses the governed model, the guided cycle must TEACH the
declared truth planes, stable scoped identity, paired enforcement, drift, and
archived rationale as it does real work - never present unsettled design as
current architecture. Weave the following into the phases:

- **Truth planes.** Explain that durable truth lives in the permanent planes this
  project declares, each with its own storage subtree and its own kind of claim:
${buildOnboardPlaneLesson(specModel)}
  Read the roster from \`specbase status --json\` (\`specModel.planes\`) rather than
  assuming it - a project may add, remove, or replace planes. A single initiative
  may touch several planes; each plane touched gets its own spec pair.
- **Change creation.** Explain that a change is a container that preserves the
  transition **rationale** and the **planned** pair updates; show the
  schema-defined artifact structure (proposal -> specs -> enforcement -> tasks).
- **Proposal.** Explain WHY the change exists, and classify each affected governed
  spec by the plane whose declared purpose fits its claim.
- **Governed specs.** Explain what each declared plane's claims look like - the
  observable contract, the structural invariant, or whatever its purpose names -
  and assign a project-unique stable spec \`id\` plus
  pair-local \`**ID:**\` requirement and scenario slugs. Stress that the IDs are
  durable identity while titles and locators are mutable presentation - a moved
  spec keeps its \`id\`.
- **Paired enforcement.** Explain that every \`spec.md\` is paired with an
  \`enforcement.yaml\`; assign pair-local **binding IDs** and show the exact
  \`type\`/requirement-level \`covers\`/\`source\` value. Separate structural
  linkage, native-harness execution, and semantic correspondence; demonstrate
  how stable IDs expose **stale** bindings (covering a removed requirement) and
  **hanging** claims (a mandatory requirement with no binding), which
  \`specbase list\` and \`specbase validate\` surface.
- **Tasks.** Include source implementation, compact manifest linkage,
  native-harness execution with a recorded result, and retired-source assessment
  as explicit task items.
- **Guided implementation.** Identify the affected stable spec \`id\` and
  pair-local normative IDs, implement or update each declared source, resolve it,
  and execute file sources through their native harness before marking related
  work complete. When implementation removes a requirement, update its binding
  and assess an unshared former file source for safe cleanup (never auto-delete).
  When all tasks are complete, run
  governed verification (\`/spcb:verify\`) BEFORE transitioning to archive.
- **Archive with explanation.** Explain that specification and enforcement deltas
  update each affected pair TOGETHER, run the schema-aware governed archive, and
  show the dated archive location, the updated current locators, and any cleanup
  candidates. Explain that the archived **proposal and design preserve WHY** the
  transition occurred, while the current architectural spec states only what must be
  true NOW - historical rationale lives in the dated archive, not in current truth.
- **Point to governed surfaces.** Show that \`specbase status\`, \`list\`, \`show\`,
  \`spec\`, and \`validate\` report governed locators, stable IDs, pair status, and
  coverage, and that the governed workflow skills (explore, propose, apply, verify,
  sync, archive) understand every declared plane.`;
