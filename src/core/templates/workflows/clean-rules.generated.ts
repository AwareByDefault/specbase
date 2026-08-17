// GENERATED FILE - DO NOT EDIT BY HAND.
//
// Source: docs/clean-spec.md, docs/clean-specbase.md (the delimited Rules sections).
// Regenerate: node scripts/generate-clean-rules.mjs (runs automatically in `pnpm build`).
//
// The manifestos are the single authored home of these rules. `docs/` does not
// ship in the npm package, so the build bakes the rules in here and every
// generated skill carries them into an installed repo.

/**
 * Distilled rules for WRITING one governed spec pair, lifted verbatim from
 * the marked Rules section of `docs/clean-spec.md`.
 */
export const CLEAN_SPEC_RULES = `Writing one governed spec pair (\`spec.md\` + \`enforcement.yaml\`):

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
- Select a type from the resolved project roster and keep each binding to exactly
  \`type\`, requirement-level \`covers\`, and one \`source\`.
- Keep source behavior, harness details, failure signals, and known boundaries in
  planning artifacts and the source itself.
- Report structural linkage, native-harness execution, and semantic
  correspondence separately.
- Never write a test to inflate coverage. \`degraded\` is a fact, not a failure.

Reject these writing smells: mechanism narration, untestable claim, compound
claim, enumerated scenarios, foreign fact, restated truth, hollow binding,
per-scenario binding.`;

/**
 * Distilled rules for PLACING a governed pair in the spec tree, lifted verbatim
 * from the marked Rules section of `docs/clean-specbase.md`.
 */
export const CLEAN_SPECBASE_RULES = `Placing a governed pair in the spec tree:

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
  \`spec.md\`, and create the pair only when siblings actually share invariants.
- Earn depth. Flatten an intermediate node that has no pair and no plausible
  one.

Reject these placement smells: leaked fact, restated truth across planes, churny
parent, enumerating parent, speculative parent, leaf exemption.`;
