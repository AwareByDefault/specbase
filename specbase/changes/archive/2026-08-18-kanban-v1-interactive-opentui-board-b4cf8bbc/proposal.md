## Why

`specbase view` is a print-only dashboard, so people cannot inspect the lifecycle of ideas, active changes, archived changes, and accepted specs as one navigable workspace. A viewer-only terminal board makes that lifecycle useful without introducing editing or automation risk.

## What Changes

- Make `specbase view` launch an interactive, viewer-only terminal board when both input and output are TTYs.
- Show open ideas, active changes, and archived changes as lifecycle columns, while keeping accepted specifications available through summary and detail views.
- Support mouse and keyboard selection, pane focus, scrolling, detail open/close, and visible controls with equivalent outcomes.
- Preserve deterministic task and artifact progress for active changes and deterministic card ordering.
- Render deterministic plain output outside an interactive TTY or with `--plain`; emit the same board model with `--json`.
- Handle terminal resize, narrow layouts, launch failures, and terminal restoration explicitly.
- Keep the established Node CLI baseline while containing the interactive renderer in a separate Bun runtime lane with an explicit fd 3 model-handoff and signal/exit protocol.
- Keep OpenTUI and its native packages external runtime-resolved dependencies, and smoke-test a packed consumer installation and native renderer initialization on the existing Linux, macOS, and Windows CI runners.
- Defer activity signals, delivery queues, editing, execution, chat, browser UI, and remote collaboration.

## Planes

### Behavioral truth

- `behavior.cli.view`: interactive launch, lifecycle/detail navigation, viewer-only input, and plain/JSON projections (modified).

### Architectural truth

- `architecture.tui-view`: pure board derivation and renderer/input boundaries (new).

### Design-system truth

- `design-system.tui-board`: durable hierarchy, focus, controls, status expression, and narrow-layout presentation (new).

### Ops truth

- `ops.tui-runtime`: contained Bun/OpenTUI runtime, exact dependency pin, bundling, and native artifacts (new).

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| Board lifecycle, ordering, summaries, specs, and task progress | `test` | `test/core/view/model.test.ts` | Pure fixtures derive the complete deterministic board model. |
| Interactive/plain/JSON selection and viewer-only behavior | `test` | `test/commands/view.test.ts` | CLI integration proves mode selection, stable JSON, fallback, and actionable failure. |
| Mouse/keyboard parity, detail, scrolling, resize, focus, and logical cleanup | `test` | `test/tui/view-board.test.ts` | Bun/OpenTUI headless tests drive real parsed keyboard and mouse input and inspect frames/state. |
| Terminal takeover and restoration | `test` | `test/tui/view-terminal.integration.test.ts` | A real PTY drives the built parent/child subprocess through normal exit, SIGINT, SIGTERM, renderer failure, and child nonzero paths and verifies restored terminal state and propagated status. |
| Pure model and shared-command boundaries | `test` | `test/core/view/architecture.test.ts` | Structural tests reject renderer dependencies in model code and direct input mutation. |
| Board hierarchy, focus, status, and narrow presentation | `test` / `review` | `test/tui/view-board.test.ts` / `design` | Headless frames prove deterministic states; design review judges hierarchy and legibility. |
| Contained runtime and external dependency resolution | `test` | `test/ops/tui-runtime.test.ts` | Manifest/build tests prove the runtime lane, fd protocol, exact external package declaration, private app bundle, and unchanged Node floor. |
| Packed install and native initialization on each supported CI OS | `test` | `test/ops/tui-packed-runtime.test.ts` | The existing OS matrix installs the packed package in a clean consumer and initializes/destroys the runtime-resolved native renderer with Bun >=1.3. |

## Impact

- Affected specs: `behavior.cli.view`, `architecture.tui-view`, `design-system.tui-board`, `ops.tui-runtime`.
- Affected code: `src/core/view/`, `src/commands/view.ts`, `src/tui/view/`, `src/cli/index.ts`, completion registry, build/package scripts.
- Affected dependencies: exact external runtime-resolved `@opentui/core` package and the native optional package selected for each existing CI runner platform/architecture; Bun remains an external interactive runtime.
- No application source, dependency, or lockfile change is part of this planning change.
