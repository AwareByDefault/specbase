## 1. Shared board model and projections

- [x] 1.1 Refactor `src/core/view.ts` into a pure, versioned lifecycle board model under `src/core/view/`, preserving tracked-task resolution and adding open ideas, archives, accepted spec summaries, diagnostics, and deterministic tie-breakers.
- [x] 1.2 Add pure plain-text and JSON projections of the shared model, with no ANSI or ambient timestamp variance.
- [x] 1.3 Register `view --plain` and `view --json` in Commander and `COMMAND_REGISTRY`, including JSON precedence and automatic non-TTY plain selection.
- [x] 1.4 Keep all view commands read-only and return actionable model/store errors without partial interactive startup.

## 2. Contained interactive renderer

- [x] 2.1 Pin `@opentui/core` at exactly `0.5.4` as an external production runtime dependency, update the frozen pnpm lock, and keep OpenTUI/native packages runtime-resolved rather than bundled or vendored without changing `engines.node`.
- [x] 2.2 Add Bun >=1.3 discovery and spawn the child with inherited TTY fds 0-2 plus a parent-to-child fd 3 pipe carrying exactly one UTF-8 JSON model delimited by EOF.
- [x] 2.3 Reject empty, malformed, unsupported-version, or schema-invalid fd 3 input before renderer creation with exit 65; close/reap on parent spawn or pipe failure with exit 74 and actionable `--plain` guidance.
- [x] 2.4 Implement parent signal forwarding/reaping and child-owned idempotent cleanup so quit returns 0, renderer failure restores then returns 70, other explicit child status propagates unchanged, SIGINT/SIGTERM restore then return 130/143, and other signals map to `128 + signal`.
- [x] 2.5 Add the private bundled application entrypoint and package/build wiring while marking OpenTUI/native dependencies external so the normal Node CLI never imports renderer modules.
- [x] 2.6 Implement the wide and narrow viewer-only board, specifications summary/detail, visible controls, pane scrolling, resize reconciliation, shared navigation reducer, and keyboard/real-mouse parity.
- [x] 2.7 Own renderer setup, signal/input/resize handlers, teardown, terminal modes, cursor, and alternate screen in the child entrypoint's single `finally` cleanup path.

## 3. Behavioral and architectural evidence

- [x] 3.1 Implement `test/core/view/model.test.ts` for lifecycle membership, summaries, parse failures, tracked tasks, stable IDs, and deterministic ordering; link/verify `view-board-model-tests`.
- [x] 3.2 Implement `test/commands/view.test.ts` for TTY mode selection, non-TTY/`--plain`, JSON, fd 3 framing/malformed input, actionable Bun failures, and read-only execution; link/verify `view-cli-mode-tests`.
- [x] 3.3 Implement `test/core/view/architecture.test.ts` for pure model imports, shared command dispatch, renderer ownership, and the parent/child fd/signal boundary; link/verify `view-boundary-tests`.
- [x] 3.4 Run the three Vitest sources through `pnpm exec vitest run` with explicit file paths and record commands, versions, and results in `evidence.md`.

## 4. Renderer, PTY, design, and runtime evidence

- [x] 4.1 Add a `test:tui` package script that runs the Bun >=1.3 headless, real PTY/subprocess, and packed-runtime sources with explicit paths.
- [x] 4.2 Implement `test/tui/view-board.test.ts` with `@opentui/core/testing`, including parsed click, wheel, keyboard parity, focus, scroll, detail, resize, narrow frames, and logical cleanup; link/verify the headless board bindings.
- [x] 4.3 Implement `test/tui/view-terminal.integration.test.ts` using a real PTY/ConPTY subprocess harness against the built Node parent and Bun child. Cover fd 3 EOF, malformed input before takeover, normal exit, SIGINT, SIGTERM, renderer failure, explicit child nonzero, exact status propagation, reaping, and restoration of terminal modes/cursor/screen/handlers; link/verify both PTY bindings.
- [x] 4.4 Implement `test/ops/tui-runtime.test.ts` for the Node floor, Bun gate, fd 3 protocol metadata, exact external OpenTUI declaration, private entrypoint publication, and externalized native imports; link/verify `tui-runtime-contract-tests`.
- [x] 4.5 Implement `test/ops/tui-packed-runtime.test.ts` to pack the package, install it into a clean consumer, resolve external OpenTUI/native packages, and initialize/destroy the renderer under Bun while reporting platform/architecture diagnostics; link/verify `tui-packed-runtime-smoke`.
- [x] 4.6 Update every existing Linux/macOS/Windows CI matrix member to set up Bun >=1.3 and run `pnpm run test:tui` after the normal build/tests; do not claim unexecuted platform/architecture combinations.
- [x] 4.7 Run all TUI sources through `pnpm run test:tui`; record the exact script, Bun version, OS/architecture, PTY cases, packed tarball install, native initialization, and results in `evidence.md`.
- [x] 4.8 Request the `design` lens review for hierarchy, non-color status, focus, controls, and narrow layout; record the review outcome separately in `evidence.md`.

## 5. Change validation and execution record

- [x] 5.1 Keep change-local `evidence.md` as the canonical execution record; distinguish planned/not-executed, structural linkage, native-harness execution, and review outcomes without treating resolvable bindings as passing evidence.
- [x] 5.2 Run the project build, lint, focused Vitest suites, and `pnpm run test:tui`; record each result in `evidence.md`.
- [x] 5.3 Run `openspec validate kanban-v1-interactive-opentui-board-b4cf8bbc --strict` and `openspec stack validate add-kanban-tui-viewer-for-specs-460680a4 --json`; resolve V1 failures without implementing V2 or V3 and record the outputs in `evidence.md`.
