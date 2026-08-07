---
description: Propose a new change - create it and generate all artifacts in one step
---

Propose a new change - create the change and generate all artifacts in one step.

I'll create a change with artifacts:
- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)

When ready to implement, run /spcb-apply

---

**Store selection:** If the user names a store (a store is a standalone Specbase repo registered on this machine) or the work lives in one, run `specbase store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `specbase/` root.

**Input**: The argument after `/spcb-propose` is the change name (kebab-case), OR a description of what the user wants to build.
**Provided arguments**: $@

**Steps**

1. **If no input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**
   ```bash
   specbase new change "<name>"
   ```
   This creates a scaffolded change in the planning home resolved by the CLI with `.openspec.yaml`.

3. **Get the artifact build order**
   ```bash
   specbase status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

4. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        specbase instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `resolvedOutputPath`: Resolved path or pattern to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure and write it to `resolvedOutputPath`
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `specbase status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

5. **Show final status**
   ```bash
   specbase status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run `/spcb-apply` to start implementing."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `specbase instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next

## Governed spec model

This project uses the governed spec model (6 permanent truth planes with paired enforcement). Do NOT assume the flat `specs/<capability>/spec.md` layout.

**Confirm the model from the CLI, do not guess:**
- Run `specbase status --change "<name>" --json` and read `specModel`.
- The governed model reports `specModel.kind == "governed"` with
  `planes: [behavior, architecture, ops, code-quality, design-system, agents]` and `pairedEnforcement: true`.
- If `specModel.kind` is `legacy` (or absent), follow the flat-spec guidance
  above unchanged.

**Under the governed model, derive concrete paths from CLI output** (`status`
`artifactPaths` and `specbase instructions <artifact> --change ... --json`),
never hardcode them. Durable truth lives in the declared planes:
- behavior: User/client-visible outcomes that must remain true (enforcement: tests / property tests) → `specs/behavior/<locator>/{spec.md,enforcement.md}`
- architecture: Package responsibilities, boundaries, and structural invariants (enforcement: lint / static-analysis / conformance) → `specs/architecture/<locator>/{spec.md,enforcement.md}`
- ops: What we use and how it runs: packages, dev env, IaC, deployment (enforcement: lockfile audit / plan validate / drift detect) → `specs/ops/<locator>/{spec.md,enforcement.md}`
- code-quality: What good code looks like: smells, qualities, and rules (enforcement: smell-lint + review) → `specs/code-quality/<locator>/{spec.md,enforcement.md}`
- design-system: The product's expressed identity: visual design tokens (color, type, spacing, radius, motion), design principles, and the voice/tone of user-facing copy. Governs HOW outcomes are presented, orthogonal to behavior (WHAT they do). Token truths DESCRIBE the token artifact (tailwind.config / tokens.json), which stays the runtime source of truth, and bind lint/contrast/a11y checks against it; principle and voice truths bind the design review lens for the judgment a linter cannot make. (enforcement: token-lint / contrast + a11y checks + design review) → `specs/design-system/<locator>/{spec.md,enforcement.md}`
- agents: The repo's own agentic instruments: review panel, repo-specific skills, subagents, and hooks it builds. Members are instruments the repo owns, NOT behavioral guardrails on agents (those ride on the plane whose subject they constrain). Each spec DESCRIBES an agent-operational artifact (config.yaml, DEFAULT_LENSES, a SKILL.md, a hook) and its enforcement binds a conformance/drift check to that artifact. (enforcement: instrument conforms to its spec (config / lens / frontmatter / hook checks)) → `specs/agents/<locator>/{spec.md,enforcement.md}`

Every governed `spec.md` is PAIRED with an `enforcement.md`. Stable identity is
scoped narrowly: the frontmatter `id` (e.g. `behavior.<locator>`) is the only project-unique governed ID; requirement, scenario, and binding `**ID:**` slugs are unique only within their pair, and stay fixed when titles or locators move.

**Plane classification:** match each proposed claim to the plane whose declared
purpose best fits the claim's nature. The shipped defaults are behavior, architecture, ops, code-quality, design-system, agents; a single initiative may touch several planes — list one spec per plane touched, never mix planes in one spec.

**Structure conventions (governed):**
- Locators may nest to arbitrary safe depth (e.g. `behavior/platforms/desktop`);
  JSON reports normalized slash-separated locators, filesystem access is native.
- A directory that only GROUPS child pairs is a **namespace** and needs no pair of
  its own. Only a directory that contains `spec.md` must also contain
  `enforcement.md`; ancestry provides navigation, never inherited requirements.
- A change stores its `spec.md` and `enforcement.md` deltas under the SAME
  plane-qualified locator as the target current pair, so both members move together.

**Agents plane (this project declares it):** its members are the repo's OWN
agentic instruments (review panel, repo-specific skills, subagents, hooks), NOT
guardrails on agent behavior — those ride on the plane whose subject they
constrain. Each agents `spec.md` **describes** an agent-operational artifact
(`config.yaml`, the lens set, a `SKILL.md`, a hook) and its `enforcement.md`
binds a **conformance/drift check** to that artifact using the ordinary
mechanisms (`command`, `test`) — no new mechanism, and the spec never generates
the artifact (the runtime keeps the artifact as its source of truth). `specbase
init` may PLANT baseline agents specs (`agents/spec-driven`, `agents/review-panel`)
directly as scaffolding — the one exception to the proposal→spec→archive flow;
edit a planted baseline through a change, never by re-running init.

### Authoring rules (governed)

These rules travel with this skill; apply them whenever you place or write a
governed pair. They are the current text of this project's clean manifestos.

**Placement - where a pair belongs:**

Placing a governed pair in the spec tree:

- Treat planes as peers, never as layers. Each plane answers to a different
  actor, on its own clock.
- Apply the actor test: put two requirements in the same plane only if the same
  actor would demand their revision. When the plane is ambiguous, ask who shows
  up angry when the requirement breaks.
- Give every fact exactly one home locator. Let other planes reference it by
  locator; never let them restate it.
- Expect co-change: one feature may legitimately land deltas in several planes.
- Forbid coupled change: editing one plane's text must never force an edit to
  another's.
- Apply the swap test: swapping a vendor, a CI system, or a runtime pin must
  touch ops specs only.
- Treat depth as volatility. A leaf refines its ancestors; a parent never
  depends on a leaf.
- Let ripple flow leafward. A parent edit may ripple to its leaves; a leaf edit
  must never force an ancestor edit.
- Keep every node open-closed. Adding a leaf must touch nothing above it. A
  parent that lists its children has a reverse dependency.
- Inherit nothing. Ancestry provides navigation only; parent and leaf bind
  independently, and a conflict between them is a defect, not a precedence
  question.
- Place each requirement at the depth that matches how far you intend its
  changes to ripple.
- Hoist on duplication. Promote a requirement to the parent only when two or
  more siblings would otherwise duplicate it. Leave specifics at the leaf.
- Quantify to place. "Every X SHALL…" is a parent claim; enforce it by one
  conformance test over the registry, not by per-child assertions.
- Grant no leaf exemptions. If one leaf cannot satisfy a parent invariant,
  narrow the parent; never special-case the leaf.
- Earn parents. Default an intermediate directory to a pure namespace with no
  `spec.md`, and create the pair only when siblings actually share invariants.
- Earn depth. Flatten an intermediate node that has no pair and no plausible
  one.

Reject these placement smells: leaked fact, restated truth across planes, churny
parent, enumerating parent, speculative parent, leaf exemption.

**Writing - what one pair says:**

Writing one governed spec pair (`spec.md` + `enforcement.md`):

- State only current, verifiable truth. Write WHAT the system promises, never
  HOW the code delivers it. Delete mechanism narration.
- Give every candidate requirement a verdict: keep durable truth, promote a real
  structural invariant to the architecture plane, demote code narration to
  design docs, drop what is superseded.
- Make one claim per requirement. Split a compound requirement.
- Use SHALL, name the actor, and state an observable outcome in active voice.
- Write every claim so a check could fail it. If no check can fail the claim,
  rewrite it or demote it.
- Put a universal claim ("every command SHALL…") at a parent locator.
- Write scenarios as examples, not enumeration. The requirement owns the claim;
  cover the representative case, the edge case, and the risky case.
- Keep foreign facts out. Name the role ("the telemetry backend"), never the
  vendor another plane owns.
- Reference a foreign truth by its locator and never restate its content. A
  restated truth is a future lie.
- Bind checks at the requirement level, not per scenario.
- Prefer the highest-leverage check. One fitness function or property test beats
  many example tests.
- Match the mechanism to the claim: structural → lint / conformance; behavioral
  → tests / property tests; subjective → `review` with a named lens;
  unverifiable today → `manual` with stated `limitations`.
- Bind an automated check only when it truly exercises the claim, and state
  `limitations` when it covers only part.
- Never write a test to inflate coverage. `degraded` is a fact, not a failure.

Reject these writing smells: mechanism narration, untestable claim, compound
claim, enumerated scenarios, foreign fact, restated truth, hollow binding,
per-scenario binding.

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
to every `spec.md` and `enforcement.md` you author, whether or not the user
engages with the structure discussion. The offer decides WHERE truth lives; the
writing rules decide HOW it is stated, and they always apply.

### Classifying planes and creating pairs (governed)

- **Classify every proposed spec by plane** (behavioral vs architectural truth).
  A single initiative may change user-visible behavior AND package boundaries; if
  so, author **separate deltas for each plane**, each with its own stable spec ID.
- **Create specifications THEN enforcement**, following the schema's artifact
  order (`specs` before `enforcement`). Get each artifact's guidance and output
  path from `specbase instructions <artifact> --change "<name>" --json` and write
  to the CLI-reported paths.
- **Assign stable identity when authoring:** a project-unique spec `id` in the
  `spec.md` frontmatter, and pair-local `**ID:**` slugs for each requirement,
  scenario, and enforcement binding.
- **Pair every governed spec with enforcement:** each SHALL/MUST requirement needs
  at least one binding in the paired `enforcement.md`; a binding may be
  `planned` while planning but must become `active` before verify/archive. A
  `covers` list references only IDs from its own pair.
- **Author bindings by the philosophy below - now the requirements exist, apply
  it concretely:** for each requirement choose the *highest-leverage real check*
  and name concrete `targets`; bind at the requirement level; and use honest
  `review`/`manual` bindings where no automated check is meaningful. Do NOT
  emit one binding per scenario or a hollow test to inflate coverage. "At least
  one binding" is a floor for honest evidence, not a quota to maximize.

### Enforcement philosophy (governed)

Enforcement records how each normative claim is *known to hold* - it is not a
coverage quota. Aim for deliberate, honest evidence, not a wall of tests:

- **Coverage is a mirror, not a target.** A passing check proves it *ran*, not
  that it verifies the claim; do not maximize automated bindings for their own
  sake. `degraded` (a spec covered only by review/manual) is factual, not a
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
  subjective or UX claims -> an honest `review` binding with a real procedure;
  genuinely unverifiable-today -> a `manual` binding stating its `limitations`.
  Use review/manual openly and first-class rather than faking automation.
