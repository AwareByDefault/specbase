## Context

The interactive viewer already derives one read-only, versioned board model in Node and renders it in a separate Bun/OpenTUI child. The in-progress `kanban-lifecycle-state` change replaces broad active/archive columns with explicit lifecycle lanes. Current interaction tests establish keyboard/mouse parity and terminal restoration, but several usability gaps remain: project identity is absent, `Open` is ambiguous for read-only detail, keyboard help is incomplete, page movement is wired to Ideas rather than the focused lane, stored detail offset is not visibly applied, empty and boundary actions are silent, global diagnostics are reduced to a count, and narrow chrome duplicates controls.

This change composes after `kanban-lifecycle-state`. It does not redefine lifecycle, add per-card activity, or expose the V3 delivery queue.

## Goals / Non-Goals

**Goals:**

- Answer where the operator is, what is possible, what will happen, what happened, and how to recover in every interactive state.
- Preserve the focused-lane board model and viewer-only safety boundary.
- Make keyboard operation, visible focus, monochrome legibility, constrained terminals, and actionable diagnostics primary behavior.
- Keep interaction semantics deterministic in the shared reducer and keep presentation in the renderer.

**Non-Goals:**

- Live refresh, per-card freshness/activity, priority scoring, queue readiness, execution, mutation, drag/drop, saved UI state, search, or specification-tree redesign.
- New packages, runtime changes, renderer boundaries, or lifecycle derivation.
- Reformatting plain or JSON output beyond fields already required by the shared board model.

## Decisions

### 1. Keep one focused lane instead of simultaneous columns

The terminal remains a lifecycle navigator: a labelled lane strip plus one full-width focused lane. This preserves readable card identity and natural left/right lane mapping at common terminal widths. Wide mode may show richer context, but it will not shrink all lifecycle lanes into narrow columns.

### 2. Add persistent context and one transient announcement

The shared board model will expose display-safe project identity derived from the selected root. Viewer state will hold one concise announcement describing the latest navigation result or no-op. The renderer will present:

1. project and board identity plus `READ ONLY`;
2. summary and lifecycle lane map;
3. focused lane and cards;
4. a subordinate announcement;
5. context-sensitive controls.

Announcements are transient viewer state only. They do not enter plain/JSON project truth and do not imply live project refresh.

### 3. Use one shared help/detail overlay convention

`?` opens keyboard help through the same overlay-level interaction convention as item detail; `Esc` closes either. The normal footer exposes only frequent actions. Help groups board navigation, detail navigation, and exit/recovery so novices recognize controls and experts retain arrows, Vim keys, Tab, and paging.

`Details` replaces `Open` because the viewer never launches or mutates the work item.

### 4. Make command outcomes focus-relative

Page Up/Down will dispatch movement against the current pane, not Ideas. Detail scrolling will update the actual scrollable detail viewport after each render. Boundary and empty-pane commands retain focus and set an explanatory announcement instead of silently doing nothing.

### 5. Treat constrained width and height separately

Rendered lane-label widths choose wide or one-lane navigation, so multi-digit counts cannot clip later destinations. Height reduces secondary summary and border chrome before selected content or essential controls. Narrow mode renders one wrapping control footer rather than a second duplicated navigation row. Below the usable floor, the renderer shows explicit resize and quit guidance instead of clipped UI. Existing selected indices and pane-local scroll remain stable across transitions.

### 6. Preserve partial data and progressively disclose diagnostics

A non-zero diagnostic count remains visible without replacing readable content. The board provides a labelled Diagnostics detail surface containing source, problem, consequence, and next step. Where the model cannot infer a specific repair, the next step directs users to deterministic `--plain` output and project validation rather than guessing.

Fatal renderer/runtime errors remain parent-command errors and retain the existing pre-takeover or cleanup guarantees.

### 7. Explicit state treatment

- **Success:** context, focused lane, selected item, and controls are visible.
- **Empty lane:** explanatory copy says no items are present and identifies lane-switch controls.
- **Empty project:** all zero-state truth remains visible with a safe workflow next step.
- **Loading:** the parent emits a short loading status before renderer takeover; no partially initialized board is shown.
- **Partial:** readable items render with a diagnostic summary and details route.
- **Failure:** terminal cleanup is preserved and the error provides validation, retry, or `--plain` recovery.

## Enforcement design

### Behavior sources

- `test/core/view.test.ts` exercises the shared command reducer with focused non-Ideas panes, empty lanes, boundaries, help/detail transitions, and announcement state. Failure is a Vitest assertion failure. It establishes deterministic logical outcomes but does not prove OpenTUI pixels or terminal cleanup.
- `test/tui/view-board.test.ts` renders the headless OpenTUI board at wide, narrow, and short dimensions; drives keyboard and mouse input; and observes project context, `Details`/`Help` labels, visible announcements, diagnostics, constrained layout, and effective detail scrolling. Failure is a Bun test assertion failure. It proves rendered semantics in the supported renderer but not every terminal emulator or assistive technology.
- `test/commands/view.test.ts` exercises non-fatal model diagnostics and fatal interactive-launch messages, asserting readable remainder plus problem/consequence/next-step guidance. Failure is a Vitest assertion failure. It does not prove renderer presentation.
- `test/tui/view-terminal.integration.test.ts` remains the native PTY source for failure cleanup and non-interactive fallback guidance. It establishes terminal restoration and exit behavior, not visual hierarchy.

### Design-system sources

- `test/tui/view-board.test.ts` deterministically observes labelled hierarchy, non-color focus markers, context-sensitive controls, help grouping, and no duplicate/overlapping constrained chrome at representative dimensions.
- The `design` review lens judges whether hierarchy, signifiers, language, and progressive disclosure satisfy the intended human-centered experience. This review is intentionally used for qualitative correspondence that string/layout assertions cannot prove.

## Risks / Trade-offs

- **[Announcement noise]** Feedback after every key can become distracting. -> Report meaningful location changes and no-ops concisely; do not animate or queue messages.
- **[Header pressure]** Project context consumes scarce rows. -> Use a compact identity line and reduce secondary summary before essential context in short terminals.
- **[Path disclosure]** A full local path is verbose and may expose unnecessary context. -> Show the root basename as primary identity; reserve the full path for details/help if needed.
- **[Static snapshot confusion]** Strong feedback can imply live project mutation. -> Keep `READ ONLY` and snapshot language persistent and avoid refresh timestamps or activity semantics reserved for V2.
- **[Active-delta composition]** V2/V3 still restate pre-lifecycle view requirements. -> Keep this change independent of activity/queue wording and archive/rebase lifecycle-dependent deltas in order.

## Migration Plan

1. Extend the shared model and protocol with display-safe project identity where required.
2. Extend transient viewer state and commands for help and announcements.
3. Correct focus-relative paging and bind detail offset to rendered scrolling.
4. Rework header, footer, detail/help, diagnostics, and constrained layouts.
5. Add reducer, headless-renderer, command, and PTY coverage; run both Node/Vitest and Bun/OpenTUI harnesses.
6. Validate `kanban-lifecycle-state` and this change strictly before review.

Rollback is a normal source/test revert; project files and stored lifecycle state require no migration.
