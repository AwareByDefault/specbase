/**
 * Governed-model workflow guidance (design decision 10).
 *
 * The canonical OPSX workflow templates are generated once into project-agnostic
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
 * declared model, never on a schema name. */
export function isGovernedModel(specModel?: SpecModel): boolean {
  return specModel?.kind === 'governed';
}

/**
 * Append governed guidance to a base template body when (and only when) the
 * resolved model is governed. Returns the base unchanged otherwise, which keeps
 * legacy output identical down to the byte.
 */
export function withGovernedGuidance(
  base: string,
  specModel: SpecModel | undefined,
  guidance: string
): string {
  if (!isGovernedModel(specModel)) return base;
  return `${base}\n\n${guidance}`;
}

/**
 * Shared primer: how to recognize the governed model at runtime and where its
 * durable truth lives. Reused verbatim by every affected workflow so skill and
 * command projections carry identical governed semantics (parity requirement).
 */
const GOVERNED_PRIMER = `## Governed spec model

This project may use the governed spec model (two permanent truth planes with
paired enforcement). Do NOT assume the flat \`specs/<capability>/spec.md\` layout.

**Confirm the model from the CLI, do not guess:**
- Run \`openspec status --change "<name>" --json\` and read \`specModel\`.
- The governed model reports \`specModel.kind == "governed"\` with
  \`planes: [behavior, architecture]\` and \`pairedEnforcement: true\`.
- If \`specModel.kind\` is \`legacy\` (or absent), follow the flat-spec guidance
  above unchanged.

**Under the governed model, derive concrete paths from CLI output** (\`status\`
\`artifactPaths\` and \`openspec instructions <artifact> --change ... --json\`),
never hardcode them. Durable truth lives in two planes:
- Behavioral truth: \`specs/behavior/<locator>/{spec.md,enforcement.md}\`
- Architectural truth: \`specs/architecture/<locator>/{spec.md,enforcement.md}\`

Every governed \`spec.md\` is PAIRED with an \`enforcement.md\`. Stable identity is
scoped narrowly: the frontmatter \`id\` (e.g. \`architecture.domain\`) is the only
project-unique governed ID; requirement, scenario, and binding \`**ID:**\` slugs
are unique only within their pair, and stay fixed when titles or locators move.

**Structure conventions (governed):**
- Locators may nest to arbitrary safe depth (e.g. \`architecture/platforms/desktop\`);
  JSON reports normalized slash-separated locators, filesystem access is native.
- A directory that only GROUPS child pairs is a **namespace** and needs no pair of
  its own. Only a directory that contains \`spec.md\` must also contain
  \`enforcement.md\`; ancestry provides navigation, never inherited requirements.
- A change stores its \`spec.md\` and \`enforcement.md\` deltas under the SAME
  plane-qualified locator as the target current pair, so both members move together.`;

/** explore (task 6.1 / Requirement: Explore classifies durable insights). */
export const GOVERNED_EXPLORE_GUIDANCE = `${GOVERNED_PRIMER}

### Classifying durable insights (governed)

Before offering to capture anything, decide which of five homes an insight
belongs to - they are not interchangeable:

| Insight | Home |
|---|---|
| User/client-visible capability that must stay true | Behavioral spec pair (\`specs/behavior/...\`) |
| Package responsibility or dependency invariant that must stay true | Architectural spec pair (\`specs/architecture/...\`) |
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
  inside the architectural spec.`;

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
  \`covers\` list references only IDs from its own pair.`;

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

Legacy changes (\`specModel.kind == "legacy"\`) retain the heuristic requirement /
scenario / design verification described above unchanged.`;

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
  before removing it. Never auto-delete a shared or intentionally retained target.`;
