# Design: lifecycle-state board

## How the lanes are derived

The lifecycle state is **already derived by the repo's status surface**
(`behavior.workflow.status`, from PR #13's `work-item-lifecycle`). `status --json`
returns a `lifecycle` field per change, computed on read from:

- artifacts present (feature/enforcement sections),
- task completion,
- a review-completion footprint,
- archive location.

The board does **not** invent new derivation logic. It consumes the resolved
`lifecycle` for each change and places the card in the corresponding lane. This
keeps the board honest: the lane is the state, and the state never drifts from
the artifacts that define it.

## Board model changes (`src/core/view/{model,projections,commands,protocol}.ts`)

- The board model's concept of a "destination column" (`ideas` / `active` /
  `archives`) is replaced by a **backlog lane** (`ideas`) plus **six lifecycle
  lanes** (`proposed`, `enforcement`, `ready-to-apply`, `implementing`,
  `reviewing`, `archived`).
- Summarize changes and produce, per lane, the ordered card list (progress then
  immutable ID) and a per-lane count for the summary.
- The interactive, plain, and JSON projections all render this one derived
  model, so they agree on lane placement. The existing
  `plain-and-json-projections` / `interactive-viewer-launch` / viewer-input-parity
  / detail-nav / terminal-lifecycle requirements continue to hold; only the
  column concept changes.

## Renderer changes (`src/tui/view/board.ts`)

- Header: summary shows open ideas and a count per lifecycle lane.
- Lanes render left-to-right in lifecycle order (`proposed` → `archived`), with
  the idea backlog first. Each lane header shows its label and count.
- A change card shows its artifact/task progress (unchanged) inside its lane.
- Wide mode shows the backlog + up to the available lanes; narrow mode falls
  back to the existing one-lane-at-a-time navigation, where "lane" now means a
  lifecycle lane or the idea backlog.

## Out of scope

- **Not** moving the specification tree to a distinct panel (separate task).
- **Not** adding mutation, reorder, drag, execution, or activity — still viewer-only.
- **Not** changing the derivation source in `work-item-lifecycle`.

## Non-goals / risks

- The `archived` lane mirrors the prior archive surface; a completed-but-active
  change must stay visually distinct from an archived one (non-color cue).
- Empty lanes still render (a with-count label) so missing work is visible.