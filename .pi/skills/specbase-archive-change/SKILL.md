---
name: specbase-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
allowed-tools: Bash(specbase:*)
license: MIT
compatibility: Requires specbase CLI.
metadata:
  author: specbase
  version: "1.0"
  generatedBy: "1.6.0"
---

Archive a completed change in the experimental workflow.

**Store selection:** If the user names a store (a store is a standalone Specbase repo registered on this machine) or the work lives in one, run `specbase store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `specbase/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `specbase list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `specbase status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Use `artifactPaths.specs.existingOutputPaths` from status JSON to check for delta specs. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `specbase/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke specbase-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

5. **Perform the archive**

   Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move `changeRoot` to the archive directory

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
   ```

6. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Whether specs were synced (if applicable)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")

All artifacts complete. All tasks complete.
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (specbase status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use specbase-sync-specs approach (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting

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

### Archiving a governed change (governed)

Governed archive promotes a change into durable truth only when its complete
spec/enforcement PAIRS are verified, reconciled together, and free of unresolved
enforcement. The legacy artifact/task/delta prompts above still apply; the
governed gate below is ADDITIONAL and authoritative.

- **Require governed readiness BEFORE archiving.** Do not archive until the
  affected `spec.md`/`enforcement.md` PAIRS validate together (`specbase
  validate` / `specbase spec validate`), coverage is satisfied (no **hanging**
  mandatory SHALL/MUST claims, no **stale** or uncovered bindings), every active
  binding's declared `targets` exist, and NO `planned`, unenforced, unresolved,
  **broken**, or failing-mandatory bindings remain. Reuse the `/spcb-verify`
  results as the readiness evidence; if verification has not been run or does not
  pass, block ordinary archive readiness and direct the user to `/spcb-verify`
  or the explicit validation-bypass command. Interactive confirmation is NOT
  enforcement evidence - never treat a "proceed anyway" answer as proof the pair
  is enforced.
- **Treat governed deltas as an inseparable pair on sync.** When a governed change
  has complete paired deltas, show ONE combined summary of the normative, binding,
  and retired-target operations that archive will apply, then invoke **pair-aware
  governed synchronization** (the governed archive CLI path) so `spec.md` and
  `enforcement.md` reconcile together by stable identity. Never promote a
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
  binding's former `targets` (tests, rules, fixtures, review procedures) as
  **cleanup candidates**. Before any manual removal, assess whether a surviving
  binding still references each candidate; never delete a shared or intentionally
  retained target, and never auto-delete project code from this workflow.
- **Report an explicit BYPASS honestly.** If the user deliberately chooses the
  supported validation bypass, invoke the CLI with its required confirmation flags
  (e.g. `--no-validate`) and report the result as **unverified (validation
  bypassed)** - state that the archive was NOT fully verified rather than claiming
  governed readiness.
