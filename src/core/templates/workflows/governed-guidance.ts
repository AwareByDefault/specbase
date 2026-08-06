/**
 * Governed-model workflow guidance (design decision 10).
 *
 * The canonical SPCB workflow templates are generated once into project-agnostic
 * skill/command files. To keep the legacy flat workflow byte-for-byte unchanged
 * while teaching governed projects the two-plane + paired-enforcement model, each
 * affected getter takes an OPTIONAL resolved spec model:
 *
 *   - omitted / legacy  -> the getter returns its existing payload verbatim, so
 *     every hash-locked parity snapshot and the default init flow are untouched.
 *   - governed          -> the governed section below is appended.
 *
 * The governed guidance itself never hardcodes plane paths or lifecycle rules as
 * ground truth for a specific project: it instructs the agent to CONFIRM the
 * governed model and read concrete artifact paths from `openspec status` /
 * `openspec instructions` output, satisfying "derive from CLI output rather than
 * hardcoding a flat capability layout".
 */
import type { SpecModel } from '../../artifact-graph/types.js';

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
 * The curated per-plane trigger lists for the four default planes. These are
 * hand-written pedagogy (the same quality as the original architectural
 * structural-trigger list) so explore on the defaults is crisp; user-added
 * planes beyond the defaults get the plane-agnostic procedure instead.
 */
const DEFAULT_PLANE_TRIGGERS: Record<string, string> = {
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
    (p) => `- ${p.id}: ${p.purpose} (enforcement: ${p.enforcementFlavor}) \u2192 \`specs/${p.id}/<locator>/{spec.md,enforcement.md}\``
  );
  const planeIds = planes.map((p) => p.id);
  const defaultIds = ['behavior', 'architecture', 'ops', 'code-quality'];
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
(\`config.yaml\`, the lens set, a \`SKILL.md\`, a hook) and its \`enforcement.md\`
binds a **conformance/drift check** to that artifact using the ordinary
mechanisms (\`command\`, \`test\`) — no new mechanism, and the spec never generates
the artifact (the runtime keeps the artifact as its source of truth). \`openspec
init\` may PLANT baseline agents specs (\`agents/spec-driven\`, \`agents/review-panel\`)
directly as scaffolding — the one exception to the proposal→spec→archive flow;
edit a planted baseline through a change, never by re-running init.`
    : '';
  return `## Governed spec model

This project uses the governed spec model (${planes.length} permanent truth plane${planes.length === 1 ? '' : 's'} with paired enforcement). Do NOT assume the flat \`specs/<capability>/spec.md\` layout.

**Confirm the model from the CLI, do not guess:**
- Run \`openspec status --change "<name>" --json\` and read \`specModel\`.
- The governed model reports \`specModel.kind == "governed"\` with
  \`planes: [${planeIds.join(', ')}]\` and \`pairedEnforcement: true\`.
- If \`specModel.kind\` is \`legacy\` (or absent), follow the flat-spec guidance
  above unchanged.

**Under the governed model, derive concrete paths from CLI output** (\`status\`
\`artifactPaths\` and \`openspec instructions <artifact> --change ... --json\`),
never hardcode them. Durable truth lives in the declared planes:
${planeLines.join('\n')}

Every governed \`spec.md\` is PAIRED with an \`enforcement.md\`. Stable identity is
scoped narrowly: the frontmatter \`id\` (e.g. \`${firstPlane}.<locator>\`) is the only project-unique governed ID; requirement, scenario, and binding \`**ID:**\` slugs are unique only within their pair, and stay fixed when titles or locators move.

**Plane classification:** match each proposed claim to the plane whose declared
purpose best fits the claim's nature. The shipped defaults are ${defaultsCovered.length ? defaultsCovered.join(', ') : 'none'};${userAdded.length ? ` this project also declares ${userAdded.map((p) => p.id).join(', ')} (read its purpose from the CLI).` : ''} a single initiative may touch several planes \u2014 list one spec per plane touched, never mix planes in one spec.

**Structure conventions (governed):**
- Locators may nest to arbitrary safe depth (e.g. \`${firstPlane}/platforms/desktop\`);
  JSON reports normalized slash-separated locators, filesystem access is native.
- A directory that only GROUPS child pairs is a **namespace** and needs no pair of
  its own. Only a directory that contains \`spec.md\` must also contain
  \`enforcement.md\`; ancestry provides navigation, never inherited requirements.
- A change stores its \`spec.md\` and \`enforcement.md\` deltas under the SAME
  plane-qualified locator as the target current pair, so both members move together.${agentsConventions}`;
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
 * Back-compat alias for callers that still reference the static primer; returns
 * the two-plane primer shape so legacy tests and any unmigrated callers keep
 * working. New callers should use {@link buildGovernedPrimer} with a resolved
 * spec model so the project's planes are interpolated.
 */
const GOVERNED_PRIMER = buildGovernedPrimer({
  kind: 'governed',
  version: 1,
  planes: [
    { id: 'behavior', purpose: 'User/client-visible outcomes', enforcementFlavor: 'tests / property tests', crossCutting: false, defaultSelected: true },
    { id: 'architecture', purpose: 'Package responsibilities, boundaries, and structural invariants', enforcementFlavor: 'lint / static-analysis / conformance', crossCutting: false, defaultSelected: true },
  ],
  pairedEnforcement: true,
});

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
- **Match mechanism to plane:** architectural invariants -> lint /
  static-analysis / conformance; behavioral claims -> tests / property tests;
  subjective or UX claims -> an honest \`review\` binding with a real procedure;
  genuinely unverifiable-today -> a \`manual\` binding stating its \`limitations\`.
  Use review/manual openly and first-class rather than faking automation.`;

/**
 * explore (spcb-explore-skill spec): staged behavior -> architecture ->
 * enforcement exploration, the dual-plane classifier, coverage-informed health
 * awareness, and the durable-insight classification table.
 */
export const GOVERNED_EXPLORE_GUIDANCE = (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}

### Health check first (governed)

Open a governed explore session by consulting the aggregated coverage view:
run \`openspec coverage --json\` and read the per-spec states and orphan
classes. Mention any rot or gaps in the areas the idea touches - hanging
claims, stale bindings, **degraded** specs (covered only by review/manual
evidence), broken targets, or orphaned enforcement - and factor that health
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
3. **Enforcement approach - stay general; certainty is the proposal's job.**
   The requirements and scenarios do not exist yet, so do NOT enumerate bindings,
   target files, \`covers\` lists, or evidence strengths here. Instead, name the
   FEW most important architectural invariants and behavioral outcomes the idea
   introduces, and for each sketch the *highest-leverage* way you would know it
   holds (a fitness function? a property test? honest review?). Flag anything that
   looks genuinely hard to verify (likely review or manual). Use the enforcement
   philosophy below as the lens for that approach, and reserve concrete bindings,
   targets, and coverage decisions for the proposal - where the requirements will
   exist to bind against.

**Plane classifier:** explicitly classify which plane(s) the idea touches. For
EACH declared plane, match the claim to its trigger list below; a "yes" to any
trigger means a spec in that plane is in scope, not optional:

${buildPlaneTriggers(specModel)}

- For user-added planes beyond the defaults, fetch \`specModel.planes\` from
  \`openspec status --json\` and match the claim to the plane whose declared
  \`purpose\` best fits the claim's nature. Do not force a claim into a plane
  whose purpose it does not match.
- If the idea touches several planes, name a candidate locator in EACH touched
  plane and author one spec pair per plane. Example: "add persistent history" is
  behavioral (\`behavior/history\`: save-on-write, list) AND architectural
  (\`architecture/persistence-port\`: a new store port + adapter) - author both,
  and bind each invariant to the check that protects it.
- If it only alters one plane's concerns within the existing others, plan a spec
  pair in that plane only and say why no other plane is needed.

${GOVERNED_ENFORCEMENT_PHILOSOPHY}

In explore this philosophy is a LENS for the approach, not a checklist to fill:
use it to decide which claims deserve the strongest evidence and which are
honestly review-only. The concrete bindings come later, in the proposal.

### Classifying durable insights (governed)

Before offering to capture anything, decide which of five homes an insight
belongs to - they are not interchangeable:

| Insight | Home |
|---|---|
| User/client-visible capability that must stay true | Behavioral spec pair (\`specs/behavior/...\`) |
| Package responsibility or dependency invariant that must stay true | Architectural spec pair (\`specs/architecture/...\`) |
| Repo/ops selection or run-time invariant | Ops spec pair (\`specs/ops/...\`) |
| Code smell, quality, or rule | Code-quality spec pair (\`specs/code-quality/...\`) |
| How a claim is proven (test/lint/review mechanism) | Paired \`enforcement.md\` binding |
| Why THIS change is being made a certain way | \`design.md\` / \`proposal.md\` (change design) |
| Historical rationale for a past transition | The dated change archive |

- When exploration establishes a package responsibility or dependency invariant
  that must remain true, name it as a possible **architectural requirement** and
  consider how it could be **enforced** (which mechanism would protect it).
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
- **Name the deterministic residue.** When sibling automated bindings already own
  part of the territory, list them in the review binding's \`covered_by\` so the
  lens reviews only the residue above the gate - the review surface shrinks as you
  harden, with no lens edit.
- **Coverage makes the pressure visible.** \`openspec coverage\` reports each lens's
  review-claim load, un-lensed review claims, and split candidates - use it to
  decide when to grow a lens, split one, or harden a claim to automated. The tool
  surfaces the case; the human makes the call.`;

/**
 * new / propose / ff / continue (task 6.2 / Requirement: Proposal and artifact
 * creation classify governed changes).
 */
export const GOVERNED_AUTHORING_GUIDANCE = `${GOVERNED_PRIMER}

### Classifying planes and creating pairs (governed)

- **Classify every proposed spec by plane** (behavioral vs architectural truth).
  A single initiative may change user-visible behavior AND package boundaries; if
  so, author **separate deltas for each plane**, each with its own stable spec ID.
- **Create specifications THEN enforcement**, following the schema's artifact
  order (\`specs\` before \`enforcement\`). Get each artifact's guidance and output
  path from \`openspec instructions <artifact> --change "<name>" --json\` and write
  to the CLI-reported paths.
- **Assign stable identity when authoring:** a project-unique spec \`id\` in the
  \`spec.md\` frontmatter, and pair-local \`**ID:**\` slugs for each requirement,
  scenario, and enforcement binding.
- **Pair every governed spec with enforcement:** each SHALL/MUST requirement needs
  at least one binding in the paired \`enforcement.md\`; a binding may be
  \`planned\` while planning but must become \`active\` before verify/archive. A
  \`covers\` list references only IDs from its own pair.
- **Author bindings by the philosophy below - now the requirements exist, apply
  it concretely:** for each requirement choose the *highest-leverage real check*
  and name concrete \`targets\`; bind at the requirement level; and use honest
  \`review\`/\`manual\` bindings where no automated check is meaningful. Do NOT
  emit one binding per scenario or a hollow test to inflate coverage. "At least
  one binding" is a floor for honest evidence, not a quota to maximize.

${GOVERNED_ENFORCEMENT_PHILOSOPHY}`;

/** update (task 6.3 / Requirement: Change updates preserve pair coherence). */
export const GOVERNED_UPDATE_GUIDANCE = `${GOVERNED_PRIMER}

### Keeping pairs coherent on update (governed)

Review each governed \`spec.md\` together with its paired \`enforcement.md\` - never
update one member of a pair in isolation. When you add, modify, remove, or move a
normative claim, check the paired bindings for the result:

- **Removed requirement/scenario** whose stable ID a binding still \`covers\` ->
  update or remove that now-**stale** binding, and report its no-longer-referenced
  \`targets\` as **cleanup candidates** (do not delete them here - apply decides
  safely).
- **Added SHALL/MUST claim** with no covering binding -> a **hanging claim**; add a
  binding.
- **Moved spec** (new locator, same meaning) -> keep the stable spec \`id\`
  unchanged; only the mutable locator/title changes.
- Preserve all scoped IDs (spec, requirement, scenario, binding) across the edit
  so drift detection stays meaningful.`;

/** sync (task 6.5 / Requirements: Specs Sync Skill, Delta Reconciliation Logic). */
export const GOVERNED_SYNC_GUIDANCE = `${GOVERNED_PRIMER}

### Reconciling governed pairs (governed)

Governed sync reconciles complete \`spec.md\`/\`enforcement.md\` PAIRS together by
stable scoped identity, never by title. Legacy header-identity merging above does
NOT apply to governed pairs.

- **Discover every concrete delta from status, not the filesystem shape.** Run
  \`openspec status --change "<name>" --json\` and read every nested specification
  AND enforcement delta path it reports; do not assume the flat
  \`specs/<capability>/spec.md\` layout.
- **Resolve current pairs by stable identity.** For each delta, resolve the
  corresponding current pair by its stable spec \`id\` and locator, then reconcile
  the whole pair - \`spec.md\` and \`enforcement.md\` - together in one step.
- **Reconcile normative content by pair-local ID.** Apply added, modified, removed,
  or renamed requirements and scenarios by their pair-local \`**ID:**\` slug, and
  preserve unaffected normative content. Titles and locators are mutable; the
  scoped IDs are not.
- **Reconcile bindings by pair-local ID.** Apply binding add/modify/remove/rename
  by pair-local binding ID, and validate each binding's \`covers\` IDs against the
  prepared paired spec.
- **A moved spec keeps its identity.** When a delta retains an existing stable spec
  \`id\` at a new locator, update the moved pair in place without changing its ID.
- **Preserve pair coherence.** Never promote a spec-only or enforcement-only half:
  a governed \`spec.md\` and its \`enforcement.md\` are synced together or not at all.
- **Report retired targets as cleanup candidates.** When reconciliation removes a
  binding or a normative ID it covered, report the binding's former \`targets\` as
  **cleanup candidates**, and indicate whether any surviving binding still shares
  those targets. Never auto-delete a test, rule, fixture, or review target here.
- **Block on invalid pairs, do not half-write.** If a prepared pair has duplicate
  scoped identity, stale coverage, a hanging mandatory claim, an unresolved binding
  status, a missing target, or a missing pair member, leave that current pair
  unchanged and report the actionable conflicts.
- **Stay idempotent.** Use the governed sync CLI behavior; running again on an
  already-synchronized change leaves the specification and enforcement files
  unchanged and duplicates no requirement, scenario, or binding.`;

/** verify (task 6.4 / Requirements: Completeness Verification, Correctness Verification). */
export const GOVERNED_VERIFY_GUIDANCE = `${GOVERNED_PRIMER}

### Verifying coverage and evidence (governed)

Governed verify checks whether declared enforcement actually protects the affected
normative truth, then reports evidence STRENGTH honestly. Core validates
declaration shape only; the WORKFLOW executes commands and review procedures with
your process tools.

- **Assess enforcement COVERAGE first.** From \`openspec validate\` (or
  \`openspec spec validate\`) plus \`openspec status --change "<name>" --json\`, load
  every affected \`spec.md\`/\`enforcement.md\` PAIR and map each requirement and
  scenario by its stable pair-local \`**ID:**\` to its covering bindings. Every
  mandatory (SHALL/MUST) requirement needs at least one complete **active** binding.
  Report separately: **hanging** mandatory claims (no covering binding), uncovered
  scenarios, **stale** bindings (covering a removed ID), **broken** bindings
  (missing target), and \`planned\` bindings. When a normative ID lacks complete
  enforcement, or a binding \`covers\` an absent ID, raise a **CRITICAL** issue that
  names the stable spec \`id\`, the pair-local normative ID, and the binding ID.
- **EXECUTE each affected automated binding's declared command.** For a binding
  whose mechanism is automated, read its declared \`run: {command, args, cwd}\`
  vector, resolve the project-relative \`targets\` and working directory, and run
  the declared executable with its exact argument vector using your process tools.
  Associate each pass/fail with the binding's covered stable IDs. A target file
  existing AND its command passing is **deterministic** evidence the check ran - but
  it does NOT by itself prove the check verifies the intended claim. If a mandatory
  automated command fails or cannot execute, raise a **CRITICAL** issue with the
  command output and the covered stable IDs, and mark the change **not ready to
  archive**.
- **Perform structured REVIEW procedures.** For a binding whose mechanism is
  \`review\`, follow its stated procedure using the required code and architecture
  inputs, and report the conclusion labeled with **review** strength (weaker than
  automated). Report \`manual\` evidence separately, together with its stated
  limitations - never present it as automated proof.
- **Assess SEMANTIC CORRESPONDENCE honestly.** For each changed automated binding
  that resolves and passes, inspect whether its check plausibly proves the covered
  claim. Report that judgment as a **REVIEW** conclusion, SEPARATE from the command
  status: distinguish "command passed" from "the check verifies the intended
  semantics". A plausible-correspondence conclusion is review evidence, not
  deterministic automation - never upgrade it to automated strength.
- **Report RETIRED enforcement targets.** Surface any former test, rule, fixture, or
  review target that sync or archive flagged as a **cleanup candidate**, and state
  whether any surviving binding still references it. Do NOT assume an unshared target
  was deleted without checking project usage, and never delete a target here.
- **Report evidence STRENGTH per binding and gate archive-readiness.** For every
  affected binding, label its evidence as **automated**, **review**, **manual**, or
  **unenforced**. Block archive-readiness while any affected binding is \`planned\`,
  unenforced, unresolved, stale, broken, or missing its target.
- **Consult \`openspec coverage\` (and \`openspec coverage --json\`) as the
  aggregated enforcement-coverage view backing this assessment** - per-spec
  states, strength mix, and orphaned enforcement in one health signal.

### Run the review panel for review bindings (governed)

The \`review\` procedure step is EXECUTED by the review panel, not a static
read-through. For the affected \`review\`/\`manual\` bindings:

- **Route each affected review binding to its lens** - the \`lens\` it declares,
  or the most-specific default lens for its subtree (\`architectural\` for
  \`architecture/**\`, \`behavioural\` for \`behavior/**\`, plus the cross-cutting
  \`enforcement\` and \`code-quality\` lenses). Run the panel over the lenses whose
  subtrees the change touches.
- **Review only the residue above the gate.** Pass each lens the deterministic
  bindings named in that review binding's \`covered_by\` as its blind list, so it
  reports only what the automated layer does not already prove.
- **Report findings as \`review\`-strength, attributed by lens and severity.**
  Panel findings are weaker evidence by construction: they DO NOT by themselves
  mark the change ready or not-ready, do NOT flip verification readiness, and
  NEVER block archive or \`openspec coverage --strict\` - those gate on structural
  rot only. High-severity findings are refute-verified before being reported.
- **Flag un-lensed review claims.** When an affected \`review\`/\`manual\` binding
  resolves to no defined lens, report it as an **un-lensed review** gap (the same
  class \`openspec coverage\` surfaces) and suggest pointing it at an existing lens
  or proposing a new/scoped one - never invent a lens on the fly.

Legacy changes (\`specModel.kind == "legacy"\`) retain the heuristic requirement /
scenario / design verification described above unchanged.`;

/** archive (task 6.5 / Requirements: Artifact Completion Check, Spec Sync Prompt, Archive Process). */
export const GOVERNED_ARCHIVE_GUIDANCE = `${GOVERNED_PRIMER}

### Archiving a governed change (governed)

Governed archive promotes a change into durable truth only when its complete
spec/enforcement PAIRS are verified, reconciled together, and free of unresolved
enforcement. The legacy artifact/task/delta prompts above still apply; the
governed gate below is ADDITIONAL and authoritative.

- **Require governed readiness BEFORE archiving.** Do not archive until the
  affected \`spec.md\`/\`enforcement.md\` PAIRS validate together (\`openspec
  validate\` / \`openspec spec validate\`), coverage is satisfied (no **hanging**
  mandatory SHALL/MUST claims, no **stale** or uncovered bindings), every active
  binding's declared \`targets\` exist, and NO \`planned\`, unenforced, unresolved,
  **broken**, or failing-mandatory bindings remain. Reuse the \`/spcb:verify\`
  results as the readiness evidence; if verification has not been run or does not
  pass, block ordinary archive readiness and direct the user to \`/spcb:verify\`
  or the explicit validation-bypass command. Interactive confirmation is NOT
  enforcement evidence - never treat a "proceed anyway" answer as proof the pair
  is enforced.
- **Treat governed deltas as an inseparable pair on sync.** When a governed change
  has complete paired deltas, show ONE combined summary of the normative, binding,
  and retired-target operations that archive will apply, then invoke **pair-aware
  governed synchronization** (the governed archive CLI path) so \`spec.md\` and
  \`enforcement.md\` reconcile together by stable identity. Never promote a
  spec-only or enforcement-only half. If only ONE member of a governed delta pair
  exists, report a blocking validation error rather than offering partial
  synchronization.
- **Archive through the schema-aware CLI path.** Run the archive via the governed
  archive command so pair validation, current-state pair updates, archive-root
  selection, and bypass reporting stay authoritative - do not hand-move governed
  pair files. On success, report the dated archive location, the updated current
  locators, the resulting enforcement status, and any cleanup candidates.
- **Report retired-target CLEANUP candidates; never auto-delete project code.**
  When reconciliation retires a binding or a normative ID it covered, surface the
  binding's former \`targets\` (tests, rules, fixtures, review procedures) as
  **cleanup candidates**. Before any manual removal, assess whether a surviving
  binding still references each candidate; never delete a shared or intentionally
  retained target, and never auto-delete project code from this workflow.
- **Report an explicit BYPASS honestly.** If the user deliberately chooses the
  supported validation bypass, invoke the CLI with its required confirmation flags
  (e.g. \`--no-validate\`) and report the result as **unverified (validation
  bypassed)** - state that the archive was NOT fully verified rather than claiming
  governed readiness.`;

/**
 * bulk archive (task 6.5). Reuses the single-change governed archive gate verbatim
 * so both projections stay identical, then adds per-change batch reporting.
 */
export const GOVERNED_BULK_ARCHIVE_GUIDANCE = `${GOVERNED_ARCHIVE_GUIDANCE}

### Applying the governed gate across a batch (governed)

- **Apply the governed readiness gate PER change.** Evaluate every selected
  governed change against the readiness gate above independently - one change's
  passing pairs never satisfy another's. A change whose pairs are unverified,
  hanging, stale, broken, or carry \`planned\`/unresolved bindings is **blocked**
  for ordinary archive, not archived alongside ready changes.
- **Report each change's outcome explicitly.** In the batch summary, state for
  every selected change whether it was **archived** (verified), **blocked**
  (readiness gate failed - name the failing pair and reason), or **bypassed**
  (archived with the explicit validation bypass, reported as unverified). Never
  fold a blocked or bypassed change into the archived count.`;

/** apply (task 6.3 / Requirement: Apply resolves enforcement bindings). */
export const GOVERNED_APPLY_GUIDANCE = `${GOVERNED_PRIMER}

### Implementing truth and evidence (governed)

Apply implements BOTH the product/architecture change and its declared evidence:

- **Resolve planned bindings.** As each binding's target and command land, move it
  from \`status: planned\` to \`status: active\`. If implementation finishes but a
  mandatory binding is still \`planned\` (or stale, hanging, broken, or missing its
  target), report the unresolved evidence and do **not** mark that spec's related
  work complete.
- **New enforcement mechanism.** If an architectural requirement needs a new lint
  rule or conformance check, implement the rule AND its checks, and make the
  binding name concrete \`targets\` and a runnable command. Any user-visible
  behavior of that tooling is itself behavioral truth - capture it in the
  appropriate behavioral spec pair.
- **Assess retired-target cleanup safely.** When reconciliation reports a retired
  test, rule, fixture, or review target, check surviving bindings and project usage
  before removing it. Never auto-delete a shared or intentionally retained target.
- **Consult \`openspec coverage\` (and \`openspec coverage --json\`) for the
  aggregated coverage health signal** while resolving bindings - the same view
  exploration and verification consume.`;

/** onboard (task 6.6 / Requirements: Guided Artifact Creation, Guided
 * Implementation, Archive with Explanation). */
export const GOVERNED_ONBOARD_GUIDANCE = `${GOVERNED_PRIMER}

### Teaching the governed model while onboarding (governed)

When the project uses the governed model, the guided cycle must TEACH the two
truth planes, stable scoped identity, paired enforcement, drift, and archived
rationale as it does real work - never present unsettled design as current
architecture. Weave the following into the phases:

- **Two truth planes.** Explain that durable truth lives in two permanent planes:
  **behavioral truth** (externally observable capabilities under
  \`specs/behavior/...\`) and **architectural truth** (current packages,
  responsibilities, boundaries, and structural invariants under
  \`specs/architecture/...\`). A single initiative may touch both; each plane gets
  its own spec pair.
- **Change creation.** Explain that a change is a container that preserves the
  transition **rationale** and the **planned** pair updates; show the
  schema-defined artifact structure (proposal -> specs -> enforcement -> tasks).
- **Proposal.** Explain WHY the change exists, and classify each affected governed
  spec as **behavioral** or **architectural** truth.
- **Governed specs.** Explain observable behavioral contracts vs current
  architectural invariants, and assign a project-unique stable spec \`id\` plus
  pair-local \`**ID:**\` requirement and scenario slugs. Stress that the IDs are
  durable identity while titles and locators are mutable presentation - a moved
  spec keeps its \`id\`.
- **Paired enforcement.** Explain that every \`spec.md\` is paired with an
  \`enforcement.md\`; assign pair-local **binding IDs**; describe **automated**,
  **review**, **manual**, and **planned** evidence honestly (a passing command is
  not proof of semantic correspondence); and demonstrate how stable IDs expose
  **stale** bindings (covering a removed ID) and **hanging** claims (a mandatory
  requirement with no covering binding), which \`openspec list\` and
  \`openspec validate\` surface.
- **Tasks.** Include implementation, **enforcement resolution** (planned ->
  active), **targeted verification**, and **retired-target assessment** as explicit
  task items.
- **Guided implementation.** Identify the affected stable spec \`id\` and pair-local
  normative IDs, implement or update the declared enforcement, and resolve the
  actual \`targets\` before marking related work complete. When implementation
  removes a requirement or scenario, update its binding and assess the former
  \`targets\` for safe cleanup (never auto-delete). When all tasks are complete, run
  governed verification (\`/spcb:verify\`) BEFORE transitioning to archive.
- **Archive with explanation.** Explain that specification and enforcement deltas
  update each affected pair TOGETHER, run the schema-aware governed archive, and
  show the dated archive location, the updated current locators, and any cleanup
  candidates. Explain that the archived **proposal and design preserve WHY** the
  transition occurred, while the current architectural spec states only what must be
  true NOW - historical rationale lives in the dated archive, not in current truth.
- **Point to governed surfaces.** Show that \`openspec status\`, \`list\`, \`show\`,
  \`spec\`, and \`validate\` report governed locators, stable IDs, pair status, and
  coverage, and that the governed workflow skills (explore, propose, apply, verify,
  sync, archive) understand both planes.`;
