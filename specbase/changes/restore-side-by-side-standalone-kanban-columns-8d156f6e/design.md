## Context

The standalone OpenTUI renderer maintains selection and scroll state for every board pane, but its current wide path renders a navigation strip plus only the focused pane. The predecessor makes the board snapshot a public headless contract; this slice changes only how the standalone renderer projects that unchanged snapshot.

Existing narrow navigation, overlays, terminal-size recovery, signal cleanup, and read-only commands are valuable recovery behavior and must remain intact. The layout must also handle changing card counts and long labels without deciding width from a fixed navigation-strip estimate.

## Goals / Non-Goals

**Goals:**
- Render multiple adjacent board columns at wide dimensions.
- Preserve independent selection and scroll state for every visible column.
- Keep focus, mouse targeting, and keyboard navigation unambiguous.
- Reflow between multi-column and focused-column modes without losing logical context.

**Non-Goals:**
- Change the versioned board snapshot or card ordering.
- Add action controls, activity, Pi rendering, or mutation.
- Replace the renderer child protocol or terminal cleanup path.
- Redesign details, help, diagnostics, or minimum-size recovery.

## Decisions

### D1. Derive a contiguous board-column window from usable width

Define the board-column order as Ideas followed by the six lifecycle lanes; exclude the Specifications reference destination from this window. Define one minimum usable column width that includes borders and card padding. After reserving header, footer, and gaps, compute the number of complete board columns that fit. Two or more selects multi-column mode; fewer selects the existing focused-column mode. When three or more columns fit, the initial Ideas window also exposes at least Proposed and Enforcement so the workflow is immediately comparative rather than presenting Ideas as the only lifecycle-adjacent column.

Choose a contiguous window in stable board-column order that contains the focused board column. Shift the window only when focus would leave it. This gives keyboard lane movement spatial continuity and prevents unrelated columns from jumping on item movement. When Specifications is focused, route it to a dedicated full-body reference view instead of counting it toward board-column capacity.

### D2. Render one real scroll pane per visible column

Call the existing pane renderer once for each pane in the visible window and assign equal flex width after accounting for gaps. Do not clone cards into a composite text surface. Each pane keeps its existing selection and scroll keys, border, title, mouse handlers, and card identities.

Wheel input remains attached to the pane under the pointer. Keyboard item and page movement remains attached to the focused pane. Clicking a visible pane focuses it before subsequent keyboard commands.

### D3. Keep focus state separate from visibility

Visibility does not imply focus. Exactly one pane uses the focused border/title cue and exactly one card in that pane uses the selected cue. Unfocused columns may retain remembered selections without presenting them as active. This preserves the existing viewer-state model and avoids introducing renderer-only selection.

### D4. Recompute layout without resetting logical state

Resize updates terminal dimensions and recomputes column capacity and the visible window from the current focused pane. It does not reset per-pane selection, scroll offsets, overlays, or the selected item. When width falls below the multi-column threshold, the focused pane fills the body through the existing constrained path. When width returns, adjacent panes reappear with their remembered context.

Height constraints and the minimum terminal floor continue to take precedence. A wide but too-short terminal still uses compact or explicit recovery presentation rather than clipping controls.

### D5. Keep controls and reference content outside columns

Retain one shared details/help/quit control region and one focus announcement. Do not repeat global controls in every column. Lane navigation controls may remain as a compact route when useful, but multi-column body space is determined from usable card width, not from whether the entire lane strip fits. Ideas remains the first board column; Specifications remains a secondary dedicated reference view and never displaces lifecycle columns in a wide board window.

## Enforcement design

### `test/tui/view-board.test.ts`

- **Contract:** Extend the existing Bun/OpenTUI headless harness with a pure visible-window matrix and rendered frames for multiple wide dimensions, the exact two-to-one-column threshold, narrow and short recovery, and wide-to-narrow-to-wide resize. Assert contiguous stable pane order, complete minimum widths, aligned non-overlapping headings/card regions, one focused pane and selected card with non-color cues, independent pane selections/scroll offsets, pointer-scoped wheel input, keyboard-scoped item/page movement, click-to-focus, singular global controls, preserved overlays/details, and unchanged input board values.
- **Fixtures and harness:** Existing `bun:test` `createTestRenderer` fixtures with dense and empty lanes, long labels, multiple card counts, keyboard events, real parsed mouse events, and explicit renderer resizing.
- **Failure signal:** Frame omissions/overlap, clipped controls, wrong visible window, focus ambiguity, cross-pane state mutation, lost selection/scroll/overlay on resize, or write-through behavior fails the focused Bun test with the dimension and pane case.
- **Known boundary:** Character frames establish deterministic geometry and cues but not subjective scanability; design review and a human UX journal cover that boundary.

### `test/tui/view-terminal.integration.test.ts`

- **Contract:** Extend the real Bun PTY parent/child journey to render at a width that fits adjacent columns, exercise lane/item input and resize where supported by the harness, then quit normally. Assert visible adjacent labels, unchanged store files, exact process outcome, alternate-screen/cursor restoration, and terminal flags restored to their initial values.
- **Fixtures and harness:** Existing `bun:test` PTY harness against the built private renderer entry and a representative store; build first so `dist/` matches the implementation.
- **Failure signal:** Missing wide-column output, input/resize failure, unexpected exit result, project mutation, leaked alternate screen/cursor state, or changed terminal flags fails the integration case.
- **Known boundary:** The PTY source samples representative real-terminal behavior; the headless dimension matrix carries exhaustive layout boundaries.

### `design` review lens

- **Contract:** Review wide, dense, narrow, and recovery frames for aligned peer-column composition, immediate lifecycle comparison, unmistakable focus and selection without color, legible headings/counts/cards, consistent spacing and truncation, and singular discoverable controls.
- **Fixtures and harness:** Captured frame set and interaction notes produced only after deterministic tests pass, reviewed through the configured design lens.
- **Failure signal:** A review finding identifies the frame, violated hierarchy or legibility claim, severity, and a concrete correction or documented optional improvement.
- **Known boundary:** Review is judgment evidence and does not replace executable state-isolation, input, resize, or cleanup assertions.

## Risks / Trade-offs

- [Columns become too narrow to read] -> Enter focused-column mode before a second complete minimum-width column would be clipped.
- [Focus moves off-screen] -> Recenter the contiguous window whenever focused-lane navigation crosses its edge.
- [Mouse wheel affects the wrong pane] -> Keep handlers on each rendered pane and verify unaffected pane offsets remain stable.
- [Resize resets operator context] -> Derive visibility from existing state; never recreate selection or scroll maps on layout change.
- [Wide headers and controls consume the gain] -> Keep global controls singular and truncate presentation labels without changing identity.

## Migration Plan

1. Add a pure visible-window calculation from width, pane order, and focused pane.
2. Render every pane in that window with equal usable widths and existing pane handlers.
3. Preserve the focused-column and minimum-size branches unchanged below their thresholds.
4. Exercise wide, boundary, narrow, short, resize, mouse-wheel, keyboard, overlay, and cleanup frames using the existing headless renderer harness.

Rollback restores the one-pane wide body while leaving the public board contract and planning data unchanged.

## Open Questions

- Whether a later product slice should present Specifications as a drawer over the board rather than its dedicated full-body reference view. This slice keeps it dedicated so reference density cannot weaken lifecycle comparison.
