## Why

The lifecycle board is safe and navigable, but it still makes operators infer project context, hidden controls, no-op outcomes, and recovery paths. This change makes the read-only board self-orienting, predictable, and actionable in wide, narrow, partial-data, and failure states without overlapping the planned activity-awareness or delivery-queue capabilities.

## What Changes

- Identify the current project and the board's read-only snapshot semantics persistently.
- Make lane, item, detail, and help navigation discoverable and naturally mapped across keyboard and mouse input.
- Give immediate feedback for navigation, empty lanes, boundaries, detail transitions, and partial data.
- Turn interactive diagnostics into actionable problem, consequence, and next-step guidance while preserving usable board data.
- Make constrained-width and constrained-height layouts preserve identity, focus, controls, and recovery paths without duplicated or clipped chrome.
- Correct current navigation defects: page movement follows the focused pane and detail scrolling visibly follows its stored offset.
- Keep lifecycle derivation, per-card activity, queue readiness, execution controls, and specification browsing scope unchanged.

## Planes

### Behavioral truth

- `behavior.cli.view`: observable orientation, navigation feedback, help, state handling, and recovery in the read-only viewer (modified).

### Design-system truth

- `design-system.tui-board`: hierarchy, signifiers, plain-language controls, non-color state cues, and constrained-terminal presentation (modified).

### Architectural truth

- None. The existing pure board model, transient projection state, shared command reducer, and renderer lifecycle boundaries remain unchanged.

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| `viewer-location-context`, `viewer-action-signifiers` | `test` | `test/tui/view-board.test.ts` | The rendered board exposes project/lane/item context, read-only status, precise controls, and complete help. |
| `viewer-navigation-semantics`, `viewer-immediate-feedback` | `test` | `test/core/view.test.ts`, `test/tui/view-board.test.ts` | Commands act on the focused surface and every meaningful transition or no-op is visibly acknowledged. |
| `viewer-actionable-recovery` | `test` | `test/commands/view.test.ts`, `test/tui/view-board.test.ts`, `test/tui/view-terminal.integration.test.ts` | Partial data remains usable and fatal failures preserve the terminal with a concrete fallback. |
| `board-hierarchy`, `focus-and-controls`, `narrow-layout` | `test` + `review` | `test/tui/view-board.test.ts`, `design` lens | Representative renderings preserve hierarchy, non-color focus, labelled controls, and constrained-layout usability; qualitative coherence receives design review. |

## Impact

- Affected specs: `behavior.cli.view`, `design-system.tui-board`
- Affected code: `src/core/view/**`, `src/tui/view/**`, and the `view` command's startup feedback
- Affected tests: core view reducer/model tests, OpenTUI board tests, command projection tests, and PTY lifecycle tests
- Dependencies/runtime: unchanged
- Compatibility: plain and JSON projections remain deterministic; interactive mode remains viewer-only
- Sequencing: this change builds on `kanban-lifecycle-state`; V2 activity awareness and V3 delivery queue remain separate follow-on concerns
