## Why

`specbase view` is the surface for managing work. Today its board organizes the
project by coarse destinations — open ideas, active changes, archived changes —
and does not reflect the derived work-item lifecycle that PR #13
(`enforcement-split-and-lifecycle`) introduced. A change in `implementing` sits
beside one still `ready-to-apply` in the same lane, and the board never tells
the operator *what phase the work is in* or *what to do next*. The lifecycle
states (`proposed`, `enforcement`, `ready-to-apply`, `implementing`, `reviewing`,
`archived`) are already derived on read by the status surface; the board should
organize itself around exactly those states, because that is how the operator
thinks about the work.

## What Changes

The interactive, plain, and JSON board projections SHALL organize changes by
their derived lifecycle state rather than by coarse activity/archive destination.

- **Board lanes are lifecycle states.** The board columns become the six derived
  states — `proposed`, `enforcement`, `ready-to-apply`, `implementing`,
  `reviewing`, `archived` — and a change card lands in the lane matching its
  derived lifecycle state.
- **Ideas stay a backlog lane.** Open ideas precede the lifecycle (they are not
  yet changes) and remain a labelled backlog lane ahead of the six lanes.
- A change SHALL be placed by its derived state, never by a stored field. As a
  change moves phase (proposal → enforcement → ready-to-apply → implementing →
  reviewing → archived), its card moves lanes on the next read.
- The summary reports the count per lifecycle lane, so a glance says how much
  work sits in each phase.
- Deterministic ordering applies per lane (progress, then immutable ID).
- One shared derived model: the interactive, plain, and JSON projections render
  the same derived board, so all three agree on lane placement.
- The view stays viewer-only and read-only; `specbase view` still never edits,
  reorders, or mutates state. The coarse `ideas/active/archives` destination
  surfaces are replaced by the lanes (ideas as a backlog lane + six lifecycle
  lanes).

Existing spec-tree browsing is unchanged by this change; moving it to a distinct
panel is a separate, later task.

## Planes

### Behavioral truth
- `behavior.cli.view`: the board renders work organized by lifecycle state with a
  backlog idea lane, lane counts in the summary, and deterministic per-lane
  ordering (modified).
- `design-system.tui-board`: the board's hierarchy and status language express the
  lifecycle state by lane placement; lane labels and counts are visible without
  color (modified).

### Architectural truth
None added. The lifecycle state source already exists (`status` derives it from
artifacts/tasks/review footprint/archive location); this change consumes it. No
structural invariant changes.

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| `dashboard-lanes` | test | `test/core/view/lifecycle-model.test.ts` | Renders a fixture store with changes in every derived state and asserts each lands in the correct lane, plus summary per-lane counts. |
| `summary-lane-counts` | test | `test/commands/view.test.ts` (or dedicated) | `--plain`/`--json` output shows per-lane counts matching derived states; a lane with zero changes still renders. |
| `lane-ordering` | test | `test/core/view/model.test.ts` | Deterministic per-lane ordering (progress → ID) matches the spec. |
| `board-lane-visibility` | design | `design` lens | The six lanes + idea backlog are legible without color and the focused lane has a non-color cue. |

## Impact

- Affected specs: `behavior.cli.view`, `design-system.tui-board` (modified).
- Affected code: the view board model and projections (`src/core/view/{model,
  projections,commands,protocol}.ts`), the OpenTUI board layout (`src/tui/view/
  board.ts`), and the CLI/command-registry (`src/cli/index.ts`,
  `src/core/completions/command-registry.ts`).
- Derivation added directly: no new lifecycle source; it reads one new field
  (`lifecycle`) already surfaced by `status --json`.