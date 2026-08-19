## Context

The proposal phase of governed changes is already artifact-ordered
(`proposal -> specs/design -> enforcement -> tasks`). Change A
(`split-enforcement-workflow`) turns that proposal phase into two deliberate
phases: the feature pass, then the enforcement pass. Today `status` reports
per-artifact done/ready/blocked but not the work item's lifecycle position, and an
idea that seeds a change can lose its thinking when that change closes. This design
derives a lifecycle state, resolves the one non-derivable state (`reviewing`), and
guarantees the idea's thinking is archived with its change. It requires change A to
have landed.

## Goals / Non-Goals

**Goals:**
- Surface a computed lifecycle position in `status` with no stored `state` flag.
- Preserve an idea's accumulated thinking through its change's archive.
- Resolve the one state derivation cannot see (`reviewing`) with an explicit,
  reversible footprint.

**Non-Goals:**
- Not a new `graduate` or `retire` command; the idea-graduation move already
  exists and is unchanged by this design.
- Not relaxing the existing move-graduation to "idea never leaves `ideas/`" —
  that is an alternative design, out of scope.
- Not a persisted lifecycle ledger; the state always derives on read.

## Decisions

### D1. The lifecycle derives from artifacts, tasks, and one review footprint

| State | Derived from | Notes |
|---|---|---|
| `proposed` | feature artifact set present; enforcement/testing still TO-BE-FILLED | the pause exists because of change A |
| `enforcement` | the enforcement write has begun but the apply gate is not met | distinguished from `proposed` by a started-marker |
| `ready-to-apply` | all apply-required artifacts present, apply not started | |
| `implementing` | apply entered, some but not all tasks complete | |
| `reviewing` | all tasks done, `validate --strict` green, plus the review footprint | the only non-derived signal |
| `archived` | change directory present under `changes/archive/<date>-<id>/` | terminal |

`proposed` vs `enforcement` is the subtle case. Both are "feature artifacts
present, enforcement not complete." The distinguisher is whether the enforcement
phase has begun writing. `propose-enforce` (change A) writes a small started marker
(the `enforcement.yaml` field or the filled `Enforcement design` section) the
instant it begins. `proposed` means the enforcement sections are still untouched
TO-BE-FILLED; `enforcement` means the write has begun but does not yet meet the
apply gate. This keeps the distinction derived rather than a second stored flag.

### Decision: `reviewing` uses a `lastReviewedAt` footprint, not a state flag

Running the review panel may leave no file mark. Options weighed:

- **No footprint / soft `reviewing`** — rejected: `reviewing` would be
  indistinguishable from "implementing finished, awaiting review," so the state
  would flake.
- **A `lastReviewedAt` stamp in `.openspec.yaml` when the panel completes** —
  chosen. It is a review-completion *stamp*, not a lifecycle `state` field; it is
  settable only by the review panel run, and `reviewing` derives from its
  presence. Light, reversible, and it does not reintroduce a mutable lifecycle
  flag. The stamp records that the panel ran, never that it approved — the panel
  is not a hard gate (per the decision to not gate on review).

### Decision: idea thinking is preserved, not relinked

The existing graduation (see `behavior/workflow/idea-graduation`) moves the idea
directory into the change at propose, so `archive` can carry the idea alongside
the archived change. This design makes that a guarantee: every archived change
that grew from an idea carries its `notes.md` and scratchpad into
`changes/archive/<date>-<id>/`. A loose/coupled backlog record is preserved; this
design extends the existing idea-graduation move rather than reversing it.

## Migration plan

Sequencing gates:
1. Land change A (`split-enforcement-workflow`) archive first.
2. Add the `lastReviewedAt` footprint to the review panel completion path.
3. Add the lifecycle derivation to the `status` command and its JSON emitter.
4. Extend `archive` to carry the idea's thinking into the archive path.
5. Run `validate` and the new tests, then archive B.

## Open questions

- Should `archived` be listed in the active-done status, or only for a change
  resolved directly by id? Low risk; default is direct-only so active lists stay
  clean.
- The carriage choice for the idea dir during archive: for a change that graduated
  by moving the idea dir, the notes are already inside the change; a copy is then
  a no-op or a defined carry. The loose case (idea never proposed) stays in
  `ideas/` and is out of scope for this change.

## Risks / Trade-offs

- [Stored state falls out of sync] -> The lifecycle is always derived; the only
  written value is the review `lastReviewedAt` stamp, which the panel writes and
  derivation reads.
- [B lands before A] -> The proposal's why states the apply order; the derived
  `proposed` / `enforcement` states are not produced without A's phases, so the
  ungated call fails closed.
- [Archive drops an idea's thinking] -> The archive path carries the idea dir; a
  test asserts its notes travel into the archived directory.