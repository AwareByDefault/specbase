## Why

The standalone board currently spends wide terminal space on one focused lane even when adjacent lifecycle context would fit. Restoring side-by-side columns lets operators compare nearby work while preserving the focused single-column experience on constrained terminals.

## What Changes

- Show multiple lifecycle columns simultaneously when the standalone terminal has room for usable adjacent columns.
- Keep each visible column independently selectable and scrollable, with input scoped to the intended column.
- Retain focused-column navigation, resize continuity, details, recovery guidance, read-only behavior, and terminal cleanup on narrow or short terminals.
- Leave the public board data contract unchanged; this is a standalone presentation change.
- Defer Pi rendering, action controls, workflow activity, and mutation.

## Planes

### Behavioral truth
- `behavior.cli.view`: wide standalone viewers expose adjacent independently scrollable columns while constrained viewers retain focused-column navigation (modified).

### Design-system truth
- `design-system.tui-board`: wide-column composition preserves lifecycle hierarchy, focus, and legibility (modified).

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| Wide viewers expose adjacent independently scrollable columns and preserve logical context across width changes | `test` | `test/tui/view-board.test.ts` | OpenTUI headless frames at wide, threshold, narrow, and short dimensions prove visible-window order, per-pane selection/scroll isolation, mouse/keyboard scope, resize continuity, controls, and read-only recovery. |
| Multi-column behavior survives the real parent/child terminal lifecycle | `test` | `test/tui/view-terminal.integration.test.ts` | PTY integration verifies a wide rendered session, resize/input/quit outcomes, unchanged project files, child result propagation, and terminal restoration. |
| Wide columns preserve aligned comparison, focus, and non-color hierarchy | `test` | `test/tui/view-board.test.ts` | Character-frame assertions prove distinct headings, boundaries, counts, card regions, scroll context, focused column, and selected-card cues without depending on color. |
| The adaptive composition remains legible and user-centered under dense content | `review` | `design` | The configured design lens judges hierarchy, scanability, focus clarity, spacing, truncation, and recovery residue that deterministic frames cannot honestly assess alone. |

## Impact

- Affected systems: standalone OpenTUI board layout, resize projection, pane rendering, mouse hit targets, and keyboard focus presentation.
- Affected public API: none; the predecessor board snapshot remains the sole data input.
- No planning-store, renderer-launch protocol, or execution-boundary change.
