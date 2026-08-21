## 1. Shared viewer state and commands

- [x] 1.1 Add display-safe project identity to the shared board model and validate its protocol projection.
- [x] 1.2 Add transient help and announcement state without changing stored project truth or plain/JSON lifecycle semantics.
- [x] 1.3 Make paging act on the focused pane and make empty/boundary navigation return concise feedback.
- [x] 1.4 Apply stored detail offset to visible detail scrolling while preserving origin selection.

## 2. Human-centered board presentation

- [x] 2.1 Render persistent project, lifecycle-board, snapshot, and read-only context.
- [x] 2.2 Replace ambiguous `Open` controls with `Details` and add a visible, dismissible keyboard-help route.
- [x] 2.3 Render concise feedback for location changes, detail transitions, empty lanes, and boundaries.
- [x] 2.4 Expose actionable diagnostic details while keeping readable board content available.
- [x] 2.5 Rework constrained-width and constrained-height layouts to preserve identity, focus, content, and one non-duplicated essential control surface.

## 3. Evidence delivery

- [x] 3.1 Update `test/core/view.test.ts` for focus-relative paging, help/detail state, boundary behavior, and announcements.
- [x] 3.2 Update `test/tui/view-board.test.ts` for context, precise controls, help, visible scrolling/feedback, diagnostics, and representative wide/narrow/short layouts.
- [x] 3.3 Update `test/commands/view.test.ts` for shared-model context and actionable partial/failure diagnostics.
- [x] 3.4 Confirm `test/tui/view-terminal.integration.test.ts` proves fatal recovery and terminal restoration; strengthen it if the contract is not already observable.
- [x] 3.5 Verify every behavior and design-system requirement is linked to its declared source in the paired `enforcement.yaml` files.

## 4. Native verification

- [x] 4.1 Run the focused Node/Vitest view suites and record the result.
- [x] 4.2 Run the Bun/OpenTUI headless, PTY, and packed-runtime suites and record the result.
- [x] 4.3 Run lint, build, strict change validation, and coverage; record linkage, native-harness execution, and semantic correspondence separately.
