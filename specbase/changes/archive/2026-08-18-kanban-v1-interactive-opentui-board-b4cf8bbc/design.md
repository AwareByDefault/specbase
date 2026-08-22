## Context

The current `ViewCommand` reads the store and prints draft, active, completed, and specification sections directly. Its filesystem derivation, classification, sorting, and formatting are coupled. The desired lifecycle instead spans open ideas, active changes, archived changes, and accepted specs. The main CLI must remain Node >=20.19 and Commander-based, while current OpenTUI 0.5.4 requires Bun >=1.3 (or exact Node 26.4 with FFI). The interactive renderer therefore cannot load in the normal Node process.

## Goals / Non-Goals

**Goals:**

- Produce one deterministic, serializable board model for interactive, plain, and JSON output.
- Make the interactive board fully useful as a read-only viewer with mouse and keyboard parity.
- Keep terminal ownership and OpenTUI imports in a bundled internal renderer entrypoint launched with Bun.
- Preserve progress resolution and provide observable resize, narrow-layout, failure, and cleanup behavior.

**Non-Goals:**

- Editing, reordering, drag-to-mutate, artifact execution, activity signals, or queue actions.
- Browser UI, Elysia, a monorepo, chat, identity, or remote multi-user state.
- Raising the package-wide Node floor or supporting OpenTUI through Node 26.4.

## Decisions

### One pure board model

Create `src/core/view/model.ts` and types under `src/core/view/`. `deriveViewBoard(root)` reads through injected store readers and returns a versioned JSON-safe model with `summary`, lifecycle `columns`, and `specs`. Card IDs come from immutable metadata IDs. Open ideas sort oldest-first then by ID. Active changes sort by task completion ascending then ID. Archived changes sort newest archive date first then ID. Specs sort by requirement count descending then locator. Unreadable entries become deterministic diagnostics and are omitted, except an accepted spec that is readable but unparseable remains with zero requirements to preserve the current contract.

The model contains no current time in V1. Plain rendering and JSON serialization are pure projections, so repeated reads of unchanged files are byte-stable after ANSI is disabled.

### CLI mode selection

Register `--plain` and `--json` in Commander and the completion registry. `--json` takes precedence and writes only JSON. `--plain` writes non-ANSI text. Without either flag, interactivity requires both stdin and stdout to be TTYs; otherwise the command selects plain output automatically.

The Node command derives the model before launching the renderer. It locates `bun`, checks version >=1.3, and spawns the shipped renderer entrypoint with descriptors 0, 1, and 2 inherited unchanged from the caller's TTY. Descriptor 3 is a parent-to-child pipe used only for one UTF-8 JSON board model. The parent writes exactly one serialized model, closes fd 3, and the child treats EOF as the only frame delimiter. The child reads to EOF before renderer creation, rejects an empty payload, invalid UTF-8/JSON, trailing non-whitespace, unsupported model version, or schema-invalid model on stderr, and exits 65 without taking over the terminal. A parent-side spawn or pipe failure closes fd 3, reaps any child, reports the failure with `specbase view --plain` guidance, and exits 74. No OpenTUI module is imported by the Node command.

After a successful handoff, the child alone owns renderer setup, raw input mode, alternate screen, cursor state, OpenTUI handlers, and their restoration. The parent never changes terminal modes. The parent owns child process lifetime: it waits and reaps; forwards the first SIGINT or SIGTERM it receives to the child; closes fd 3 if it is still open; and does not emit normal output while waiting. The child handles SIGINT/SIGTERM through its single cleanup path, restores the terminal, removes its handlers, and exits 130/143 respectively. A user-requested normal quit returns 0. An uncaught setup/render/input/shutdown failure after a valid handoff is reported on stderr and returns 70 after cleanup. Any other explicit child nonzero code is propagated unchanged by the parent. If the child terminates from another signal, the parent returns the conventional `128 + signal` status. Cleanup is idempotent, and the parent does not attempt renderer cleanup.

### Bundled renderer lifecycle

`src/tui/view/entry.ts` is the only renderer owner and its application code is bundled to a private published path such as `dist/internal/view-tui.mjs`. It uses `@opentui/core`, not React or Solid. It creates the renderer once, installs input/resize/signal handlers, and always destroys the board controller and renderer in `finally`. Normal exit returns rather than calling `process.exit()`.

The package pins `@opentui/core` to `0.5.4` exactly as a production runtime dependency. The build marks `@opentui/core` and its platform native optional packages external: they are neither inlined into the application bundle nor copied as vendored binaries. A package manager resolves them from the packed package's dependency metadata at consumer install time, and Bun resolves them from that installed dependency tree at interactive runtime. Bun is external and does not change `engines.node`. The support claim is limited to the platform/architecture combinations exercised by the repository's existing Linux, macOS, and Windows CI runners; retained manifest records alone do not claim every architecture supported upstream.

### Shared commands for input parity

`src/core/view/commands.ts` defines the read-only command vocabulary: move focus, select card/pane, scroll active pane, open detail, close detail, and quit. The reducer owns logical focus and detail state. Keyboard and mouse adapters translate input to these commands; renderables do not mutate the board or navigation state directly.

Mouse support uses actual down/up selection, wheel events on the intended scroll owner, and visible control hit targets. No drag operation is registered because cards cannot be reordered. Keyboard bindings expose every command, including Tab/Shift-Tab or arrows for movement, Enter for open/select, Escape for close, and q for quit.

### Responsive presentation

The renderer uses a wide three-column board when the terminal can preserve minimum card widths. At narrower widths it shows one lifecycle column at a time with an explicit column switcher and persistent context. At the minimum supported size it keeps title, selected item, and quit/detail controls visible and clips or scrolls content rather than overflowing. Every resize recomputes from current dimensions and retains logical focus where the selected item still exists.

## Enforcement design

- `test/core/view/model.test.ts` runs in Vitest with temporary cross-platform stores. It asserts lifecycle inclusion, unreadable-item handling, summary totals, stable IDs, progress aggregation, and all deterministic tie-breakers. Failure is an assertion diff. It does not prove terminal input or pixels.
- `test/commands/view.test.ts` runs the built Commander command with injected TTY flags and a fake Bun launcher. It asserts mode precedence, non-TTY plain output, byte-stable JSON/plain results, no ANSI in plain mode, read-only execution, and actionable missing/old-Bun failures. It does not prove OpenTUI rendering.
- `test/tui/view-board.test.ts` runs under Bun against `@opentui/core/testing`. It uses the real input parser's mouse click/wheel helpers and keyboard sequences, resizes the memory renderer, captures frames/spans, and verifies focus, visible controls, detail open/close, scrolling, narrow layout, parity, and logical destroy cleanup. Every fixture destroys its renderer in `finally`. It does not prove terminal takeover/restoration.
- `test/tui/view-terminal.integration.test.ts` launches the built Node parent and Bun child inside a real PTY/subprocess harness. It snapshots terminal attributes/cursor/screen observables before launch and after normal quit, SIGINT, SIGTERM, injected renderer failure, and an injected child nonzero result; it also asserts fd 3 EOF framing, malformed-input rejection before takeover, parent forwarding/reaping, and exact exit propagation. This is the evidence source for terminal restoration; headless renderer tests remain evidence only for logical view state. Platform-specific PTY/ConPTY adapters may differ, but scenarios and assertions stay common.
- `test/core/view/architecture.test.ts` runs in Vitest. It checks model modules do not import renderer/runtime modules, that input adapters dispatch the shared command vocabulary, and that only the entrypoint owns renderer creation/destruction. It is structural evidence, not a usability judgment.
- `test/ops/tui-runtime.test.ts` runs in Vitest against `package.json`, the lockfile, built package files, and launcher/build metadata. It asserts Node remains `>=20.19.0`, OpenTUI is exactly `0.5.4` as an external production dependency, Bun >=1.3 is checked, fd 3 is the sole model channel, the private application bundle is shipped, and OpenTUI/native imports remain external. It does not initialize native code.
- `test/ops/tui-packed-runtime.test.ts` is run through `pnpm run test:tui` after Bun >=1.3 setup in every existing Linux/macOS/Windows CI matrix member. It packs the package, installs that tarball into a clean temporary consumer, resolves OpenTUI/native packages from the consumer dependency tree, initializes and destroys a renderer under Bun, and fails with package/runtime diagnostics. It proves only the CI runner platform/architecture combinations actually executed.
- The `design` lens reviews hierarchy, non-color status cues, focus visibility, control clarity, and narrow-layout coherence. It does not replace headless interaction or PTY restoration tests.

`evidence.md` in this change directory is the canonical execution record. Every native-harness command, runtime/OS version, packed tarball smoke, PTY scenario, deterministic test, and review outcome is recorded there; binding resolution alone is not execution.

## Risks / Trade-offs

- **Pre-1.0 renderer API churn** -> Pin exactly and require headless tests before any upgrade.
- **Bun may be absent on otherwise supported Node installations** -> Fail only for interactive launch and always provide automatic/forced plain and JSON paths.
- **Terminal mouse protocols vary** -> Test the real OpenTUI parser and retain complete keyboard parity.
- **A child runtime complicates terminal ownership** -> Keep one launcher protocol, inherit the TTY only after model derivation, and make cleanup/failure integration tests mandatory.
- **Large stores may create dense boards** -> Use scrollable panes and stable model ordering; performance benchmarking is deferred until representative limits are known.

## Migration Plan

1. Extract and extend current view derivation into the pure model while keeping existing progress tests green.
2. Add plain and JSON projections and CLI flags; verify non-TTY compatibility before enabling interactive default selection.
3. Add the exact external package pin, fd 3 Bun launcher, private application bundle build, `test:tui` script, and package audit.
4. Implement shared commands and the OpenTUI board, then run Vitest, Bun headless, real PTY/subprocess, and packed-consumer native initialization suites.
5. Add Bun >=1.3 setup and `pnpm run test:tui` to every existing Linux/macOS/Windows CI matrix member.
6. Enable interactive TTY selection only after cleanup and failure paths pass and record all execution in `evidence.md`. Rollback can select plain output by default and remove the launcher without changing the board model contract.

## Open Questions

None. The real PTY/subprocess suite is required evidence for terminal restoration, and the packed-consumer smoke in each existing CI OS matrix member is required evidence for native runtime initialization. Neither source claims unexecuted terminal emulators or platform/architecture combinations.
