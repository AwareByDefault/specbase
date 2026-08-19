---
description: "Complete enforcement for a proposed feature - fill enforcement.yaml, the testing sections, and the evidence tasks"
---

Complete enforcement for a feature that is already proposed.

This is the **second phase** of the two-phase proposal workflow. The feature pass
(`/spcb-propose`) wrote the proposal, the spec deltas, and the design, and left
the enforcement/testing sections as TO-BE-FILLED with no `enforcement.yaml`.
`/spcb-explore-enforce` has already explored how each requirement is verified.
This step turns that strategy into the governed artifacts, on the SAME change.

**What to fill:**

- **`enforcement.yaml`** beside every governed spec delta: a `bindings` map
  keyed by stable binding ID; each value is exactly `type`, `covers`, and
  `source`. `covers` names requirement IDs only (scenarios inherit). Choose
  `type` from the resolved roster (`test`, `lint`, `static-analysis`,
  `command`, `review`, `manual`); `source` is a project-relative file or
  a configured lens. Bind at the requirement level, not per scenario.
- **The proposal's `Enforcement intent`** table: covered truth | planned type |
  planned source | intended proof.
- **The design's `Enforcement design`** source contracts: assertions or
  observations, fixtures and harness, failure signal, known boundary.
- **`tasks.md` evidence-delivery steps**: say "Implement each source through
  its native harness, link it, execute it, record the result."

**You MAY emit `MODIFIED` deltas** into the existing spec or design when
`explore-enforce` flagged a requirement too vague to observe or a design too
coupled to test. Restate that requirement so a check can fail it. Such revisions
SHALL be limited to what verifiability requires and SHALL NOT broaden the
feature's scope.
