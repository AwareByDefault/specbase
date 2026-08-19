# Design — split enforcement workflow

## Context

Currently `specbase propose` builds every apply-required artifact (proposal, specs, design,
enforcement, tasks) in one automated pass. Enforcement is the weakest output of that bundle.
The governed schema already orders the artifacts correctly — `enforcement` requires `[specs,
design]`, `tasks` requires enforcement, `apply` requires tasks — so the *ordering* is not the
problem; the problem is that the skill layer collapses the ordering into a single run and
invents enforcement without a design phase. This change forces the phase to be a real stage.

## Goals / Non-Goals

**Goals:**
- Give enforcement its own explore → propose cycle, sequenced after the feature.
- Make the enforcement phase the single place bindings and testing sections are decided.
- Support testability-driven feedback into the feature spec/design without scope creep.

**Non-Goals:**
- Not making the review panel a hard gate on enforcement output.
- Not maximizing the count of automated bindings; `degraded` and honest `review`/`manual`
  strength remain acceptable.
- Not introducing a new verification-plan artifact — the design's `Enforcement design`
  section is reused as the home for the enforcement thinking.

## Decisions

1. **Feature pass stops after `design`.** `spcb:propose` (feature mode) writes proposal,
   specs, and design, then stops. `enforcement.yaml` is not written; `Enforcement intent` and
   `Enforcement design` are left as explicit TO-BE-FILLED placeholders. The existing
   "create ALL apply-required artifacts" guardrail in the propose workflow template is
   relaxed to allow this intentional resting state.
2. **New enforcement skills.** `spcb:explore-enforce` (verification-only thinking, starts from
   the feature specs) and `spcb:propose-enforce` (materializes `enforcement.yaml`, the testing
   sections, and the evidence tasks on the same change).
3. **Reuse `design.md`'s `Enforcement design` section.** The explore-enforce thinking —
   source contracts, harness, failure signal, known boundary — lives there, one section, no
   new artifact ceremony.
4. **Focused feedback only.** `spcb:propose-enforce` may emit `MODIFIED` deltas into specs or
   design, but only revisions required for verifiability. This bounds the phase so it cannot
   become a second feature cycle.
5. **No review gate.** The `enforcement` lens's judgment ("does the bound check actually
   exercise the claim?") is brought forward into the enforcement phase as design guidance
   rather than an after-the-fact blocking review.

## Enforcement design

Each planned source is executed through the project's native harness (vitest for tests).

- **`test/agents/workflow-enforcement-split.test.ts`** — asserts the workflow shape:
  - The propose workflow (feature mode) stops after `design` and does not emit
    `enforcement.yaml`.
  - `spcb:explore` omits stage-three enforcement sketching (behavior + structure only).
  - The `spcb:explore-enforce` and `spcb:propose-enforce` skills exist with the required
    capabilities, and `propose-enforce` fills enforcement sections and may emit
    testability-driven `MODIFIED` deltas.
  - Failure signal: any assertion fails → the test suite fails. Known boundary: the test
    checks the workflow contract, not the quality of any individual binding authored by a
    future agent.
- **`enforcement` lens (review)** — a review binding asserts the new skills genuinely own the
  enforcement judgment rather than a hollow placeholder, and that a proposal authored through
  them reflects the enforcement quality stance. Executed by the review panel; not a gate.

## Risks / Trade-offs

- [Changes rest between phases] -> The feature-pass `design` is a visible resting state with
  the enforcement sections marked TO-BE-FILLED; the follow-up lifecycle change surfaces it as
  a tracked state. Until then the resting state is a skill convention.
- [Enforcement feedback creeps into feature scope] -> `verifiability-feedback` limits
  revisions to what verifiability requires; enforced by the spec and the review lens.

## Migration Plan

- Add the two enforcement skills, narrow the two feature skills, relax the propose template's
  "create all artifacts" guardrail, and mark the proposal/design enforcement sections as
  TO-BE-FILLED. Existing one-shot proposals remain valid; the split applies to new/workflow
  changes going forward.

## Open Questions

- Whether the resting-pause between phases should be surfaced as a tracked lifecycle state —
  deferred to the `work-item-lifecycle` change (B), which must follow this one (A).
