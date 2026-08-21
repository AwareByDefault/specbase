## 1. Restore adaptive standalone columns

- [x] 1.1 Project the predecessor public kanban snapshot as the unchanged renderer input and add a pure visible-pane-window calculation from usable width, pane order, minimum complete column width, and current focus.
- [x] 1.2 Render one equal-width real scroll pane per member of the contiguous visible window, retaining each pane's label, count, card identity, border, selection, scroll state, and existing handlers.
- [x] 1.3 Scope keyboard item/page movement to the focused pane, wheel input to the pane under the pointer, and visible-pane clicks to focus before subsequent keyboard commands.
- [x] 1.4 Preserve exactly one non-color focus cue and one selected-card cue while keeping remembered selections in unfocused columns visually inactive.
- [x] 1.5 Recompute the visible window on resize without resetting pane selection, scroll offsets, focused item, details, help, or overlays; retain the existing focused-column and minimum-size recovery branches below thresholds.
- [x] 1.6 Keep details/help/quit controls singular, labelled, and outside the column bodies, and verify all renderer commands remain read-only against the public snapshot and planning store.

## 2. Deliver headless interaction and presentation evidence

- [x] 2.1 Extend `test/tui/view-board.test.ts` through `bun:test` with pure window-capacity cases and headless frames for wide, exact-threshold, narrow, short, dense, empty, long-label, and resize round-trip layouts for bindings `view-wide-column-headless-tests` and `tui-wide-column-presentation-tests`.
- [x] 2.2 Add parsed mouse and keyboard cases proving click-to-focus, pointer-scoped wheel isolation, focused-pane item/page movement, independent remembered selection/scroll, singular controls, preserved details/help routes, and non-color focus/selection cues.
- [x] 2.3 Confirm the behavior and design-system test bindings contain exactly `type`, requirement-level `covers`, and `source`, resolve to `test/tui/view-board.test.ts`, and merge without replacing surviving current pair bindings.
- [x] 2.4 Execute `bun test test/tui/view-board.test.ts` through the native OpenTUI/Bun harness.
- [x] 2.5 Record the command, tested dimension matrix, captured frame references, pass/fail result, and any limitation or remediation in the change `notes.md` evidence log.

## 3. Deliver terminal-lifecycle and design-review evidence

- [x] 3.1 Extend `test/tui/view-terminal.integration.test.ts` through its real PTY harness with a representative wide-column render and input/resize/quit journey that asserts unchanged project files, exact child outcome, alternate-screen/cursor cleanup, and terminal-flag restoration for binding `view-wide-column-pty-integration`.
- [x] 3.2 Build first, then execute `bun test test/tui/view-terminal.integration.test.ts` through the native PTY harness and record the command, platform/terminal dimensions, pass/fail result, and any limitation or remediation in `notes.md`.
- [x] 3.3 After deterministic evidence passes, prepare wide/dense/narrow/recovery frame captures and run the configured `design` lens for binding `tui-wide-column-design-review`, recording every finding, disposition, and correction or explicit optional-improvement rationale in `notes.md`.
- [x] 3.4 Confirm the PTY and design-review bindings contain exactly `type`, requirement-level `covers`, and `source` and that the review source is the configured `design` lens.

## 4. Verify the completed slice and operator experience

- [x] 4.1 Run `pnpm run build`, `pnpm test:tui`, `pnpm run lint`, `pnpm test`, and `node bin/specbase.js validate restore-side-by-side-standalone-kanban-columns-8d156f6e --type change --strict --no-interactive`; record every result and resolve regressions attributable to this change.
- [x] 4.2 After functional checks pass, have a human operator use a real wide terminal, resize through the multi/focused boundary, navigate adjacent columns by keyboard and mouse, scroll dense columns, open/close details and help, and quit; append a dated UX journal to `notes.md` covering simplicity, user-centered design, visibility, consistency, feedback, clarity, accessibility and keyboard operation, usability, efficiency, delight, observed defects, and optional unfixed improvements.
- [x] 4.3 Triage every deterministic, review, or journal defect: fix in-scope functional or accessibility defects and rerun affected native harnesses, or record an explicit rationale and follow-up for optional unfixed improvements.
