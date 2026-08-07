# Clean Spec

How to write one governed spec pair (`spec.md` + `enforcement.md`).
For where a pair belongs in the tree, read [Clean Specbase](clean-specbase.md).

Style: one rule per sentence, imperative mood, active voice (ASD-STE100).
Status: living document. Rules graduate into governed pairs as they prove out.

---

## 1. State only what must remain true

A spec states current, verifiable truth. It is not a plan, a history, or a
tutorial.

- Write WHAT the system promises. Do not write HOW the code delivers it.
- Let code and tests embody the mechanism. Let the archive preserve the
  rationale.
- Give every candidate requirement a verdict:

| Verdict | Rule |
|---|---|
| **keep** | It is durable truth — user-visible, structural, ops, or agentic. Keep it. |
| **promote** | It is internal mechanism, but a real structural invariant. Move it to the architecture plane. |
| **demote** | It narrates how the code works and guards no contract. Move it to design docs. |
| **drop** | It is superseded, reverted, or never shipped. Delete it. |

Mechanism narration in a spec is the comment that explains what the code
does. Delete it.

## 2. Write requirements a check can fail

- Make one claim per requirement.
- Use SHALL. Name the actor. State an observable outcome.
  Example: "The CLI SHALL exit non-zero when validation fails."
- Write each claim so a check could fail it. If no check can fail the claim,
  rewrite it or demote it.
- Use active voice. Do not bury the actor in a passive sentence.
- A universal claim ("every command SHALL…") belongs at a parent locator.
  See [Clean Specbase §4](clean-specbase.md#4-place-each-requirement).

## 3. Write scenarios as examples, not enumeration

- The requirement owns the claim. Scenarios illustrate it.
- Cover the representative case, the edge case, and the risky case.
- Do not enumerate every path. Enumeration hides the claim and rots first.

## 4. Keep foreign facts out

- Do not name a fact that another plane owns. Write "the telemetry backend,"
  not "PostHog" — the vendor name lives in `ops/stack`.
- Reference a foreign truth by its locator. Never restate its content.
- A restated truth is a future lie: one copy will drift.

## 5. Enforce honestly

The paired `enforcement.md` records how each claim is known to hold. It is a
mirror, not a target.

- Bind checks at the requirement level, not per scenario. One binding's test
  family covers a requirement's scenarios.
- Prefer the highest-leverage check. One fitness function or property test
  beats many example tests.
- Match the mechanism to the claim: structural → lint / conformance;
  behavioral → tests / property tests; subjective → `review` with a named
  lens; unverifiable today → `manual` with stated `limitations`.
- Bind an automated check only when it truly exercises the claim. State
  `limitations` when it covers only part.
- Never write a test to inflate coverage. `degraded` is a fact, not a
  failure.

## 6. Smells

Each smell names a rule above; the fix lives at that rule.

- **Mechanism narration** — "how it works" prose posing as a requirement (§1).
- **Untestable claim** — a requirement no check could fail (§2).
- **Compound claim** — several promises fused into one requirement (§2).
- **Enumerated scenarios** — scenarios listing every path (§3).
- **Foreign fact** — a fact another plane owns, named inline (§4).
- **Restated truth** — the same claim living in two locators (§4).
- **Hollow binding** — enforcement pointing at a check that does not exercise
  the claim (§5).
- **Per-scenario binding** — one binding or test per scenario (§5).

## 7. Rules

The distilled imperative form of §1–§6. This block is the single authored home
of the writing rules injected into the generated spec-driven skills:
`node scripts/generate-clean-rules.mjs` lifts it verbatim during the build.
Edit the rules here — never in the generator, and never in a skill file.

<!-- BEGIN RULES -->
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
<!-- END RULES -->

---

*Adapted from Robert C. Martin's Clean Code, applied to governed specs.*
