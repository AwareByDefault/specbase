---
name: specbase-propose-enforce
description: Complete enforcement for a proposed feature: fill enforcement.yaml, the Enforcement intent and design sections, and the evidence tasks. Run AFTER explore-enforce, on the same change.
allowed-tools: Bash(specbase:*)
license: MIT
compatibility: Requires specbase CLI.
metadata:
  author: specbase
  version: "1.0"
  generatedBy: "1.6.0"
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

**Store selection:** If the user names a store (a store is a standalone Specbase repo registered on this machine) or the work lives in one, run `specbase store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `specbase/` root.

## Enforcement quality stance

Coverage is a mirror, not a target. A passing check proves it ran, not that it verifies the claim. Prefer the highest-leverage check; use review/manual strength openly rather than faking automation; never write a hollow test to inflate coverage. `degraded` is a legitimate, visible state.
