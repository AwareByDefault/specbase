## Outcome

Wide standalone `specbase view` sessions show multiple lifecycle columns simultaneously while narrow terminals retain focused-column navigation and all existing recovery behavior.

## Demonstration

Headless Bun frames prove adjacent independently scrollable columns at wide dimensions and a coherent focused column at narrow dimensions.

## Explicit deferrals

The standalone viewer remains read-only. Pi rendering, action controls, and workflow activity remain deferred.

## Technical evidence — 2026-08-21

### Headless Bun/OpenTUI

- Command: `bun test test/tui/view-board.test.ts` — pass (29 tests, 210 assertions).
- Captured character-frame dimensions cover 160×22 wide panes, the pure 2-column threshold (69 usable cells), 120×30 default, 86×20 two-column, 60×22 narrow recovery, 35×20 narrow controls, 15×20 minimum-size recovery, and 70×12 short layout.
- The frames assert contiguous pane windows, equal non-overlapping pane widths, headings/counts/cards, a double-border plus `▶` focus cue, a single selected-card cue, singular global controls, immutable input snapshot, independent wheel/keyboard state, details/help routes, and wide→narrow→wide state preservation.

### Real Bun PTY

- Built first with `pnpm run build` — pass.
- Command: `bun test test/tui/view-terminal.integration.test.ts` — pass (10 tests, 77 assertions) on darwin/arm64 using a 100×28 PTY resized to 160×28.
- The wide journey observes adjacent Ideas and Proposed panes, exercises terminal resize plus keyboard quit, and proves exit 0, unchanged project files, alternate-screen/cursor cleanup, and restored terminal flags. The existing SGR-mouse, signal, renderer-failure, and child-status journeys also pass.

### Binding linkage

- `view-wide-column-headless-tests` and `tui-wide-column-presentation-tests` each resolve to `test/tui/view-board.test.ts`; `view-wide-column-pty-integration` resolves to `test/tui/view-terminal.integration.test.ts`; `tui-wide-column-design-review` resolves to the configured `design` lens. Every delta binding has exactly `type`, `covers`, and `source`; current-pair bindings remain separate until archive merge.

### Slice verification

- `pnpm test:tui` — pass (41 tests, 305 assertions).
- `pnpm run lint` — pass with one pre-existing warning in `src/core/references.ts:196` (`no-control-regex` unused disable).
- `node bin/specbase.js validate restore-side-by-side-standalone-kanban-columns-8d156f6e --type change --strict --no-interactive` — pass.
- `pnpm test` — fails outside this slice: 16 failures in the capstone pointer-store journey, artifact-workflow status path/error assertions, `test/ops/tui-runtime.test.ts`, and stale template/skill parity/coverage expectations. No TUI board or PTY test fails.

### Design-lens review and remediation

- Terra design review confirmed wide peer-column hierarchy, empty/dense recovery, non-color double-border/`▶` focus, singular controls, pointer-local wheel handling, and preserved wide→narrow→wide context.
- It found two high issues: focused wheel scrolling could hide the selected item, and the calculated minimum column could drop a long focused title. It also found silently clipped long card labels. The reducer now keeps focused selection inside the visible scroll window, the renderer materializes only fully mouse-hit-testable cards, pane titles keep a concise label/count, and long labels use ellipses. Focused tests and the full TUI suite pass after remediation.
- The first full `pnpm test:tui` rerun passed all 41 assertions but hit a Bun/macOS `EFAULT` while deleting the packed-runtime temporary directory in `afterAll`; rerunning `bun test test/ops/tui-packed-runtime.test.ts` passed both tests and cleanup. Recorded as harness flake, not product failure.
- The PTY aggregate-output resize assertion still proves cleanup more strongly than post-resize geometry; headless frames and the operator journey below carry the reflow evidence.

## Human-operator UX spike — 2026-08-21

**Journey:** Opened the built interactive board in a dedicated 160×30 tmux terminal, navigated columns and a dense archived lane, opened details, resized to 60×22 focused mode, restored 160×30, inspected the retained card/context, and quit. Parsed-mouse journeys remain covered by the real input harness because this operator pass was keyboard-driven.

- **Simplicity:** Side-by-side columns make the lifecycle understandable without cycling through separate full-screen panes. Left/right and `h/l` are natural; the single footer avoids per-column control noise.
- **User-centered design:** Ideas remains the first board column, lifecycle work follows left-to-right, and Specifications stays a secondary full-body reference instead of stealing comparison width.
- **Visibility:** At 160 columns five lanes were simultaneously legible. The focused lane's double border and `▶`, selected-card marker, counts, and header announcement remained visible without relying on color.
- **Consistency:** Wide and narrow modes use the same identity, status vocabulary, controls, and selection state. Returning to wide mode restored the same archived card and adjacent lifecycle context.
- **Feedback:** Header announcements report lane and item position after keyboard actions. Empty columns explain recovery. Details preserve project/read-only context.
- **Clarity:** Ellipsized long titles prevent accidental hard clipping, but several similarly prefixed change IDs remain difficult to distinguish until details are opened.
- **Accessibility:** Complete keyboard operation worked through navigation, details, resize recovery, and quit. Non-color cues survived captured frames. Mouse equivalence, focus transfer, and wheel isolation pass parsed-input tests.
- **Usability:** Conservative card materialization guarantees visible selection and reliable mouse hit targets, but ordinary 30-row terminals show fewer cards per column than the raw vertical space appears able to hold.
- **Efficiency:** Lifecycle comparison is much faster than the former one-pane view; dense lanes still require wheel/page navigation and the three-item wheel step can move farther than expected.
- **Delight:** The wide board finally reads like a kanban rather than a tab switcher, and resize recovery retained operator context cleanly.
- **Observed defects fixed:** Hidden focused selection, missing long pane titles, and silently clipped labels were corrected before this journal.
- **Optional unfixed improvements:** Tune card density from measured ScrollBox viewport rows, strengthen the PTY assertion around post-resize repaint, add a visible truncated-title detail affordance, and consider a one-step help transition from an open detail overlay. These remain spike follow-ups.
