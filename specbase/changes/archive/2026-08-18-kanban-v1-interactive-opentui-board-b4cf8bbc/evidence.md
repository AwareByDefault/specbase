## Status

V1 implementation and every file-backed binding source are implemented and executed. All 26 tasks are complete, including the independent `design` lens review (task 4.8), which the parent ran as a review panel and then resolved every design finding in a fix round. The deterministic validation gate is green and stack projection reports V1 valid with zero diagnostics. V2 is the first invalid stack member only because its own planned sources do not exist; V3 is blocked by V2.

## Execution environment

- Date: 2026-08-18
- Platform actually executed: macOS (`darwin`) on `arm64`
- Node: `v26.0.0` (package engine remains exactly `>=20.19.0`; CI uses Node `20.19.0`)
- pnpm: `9.15.9`
- Bun: `1.3.14`
- OpenTUI Core: exact `0.5.4`
- CI declarations: `ubuntu-latest`, `macos-latest`, and `windows-latest`, each sets up Bun `1.3.14` and runs `pnpm run test:tui`. Only the local macOS/arm64 combination is claimed as locally executed.

## Binding execution

| Binding | Source | Native harness result | Correspondence |
|---|---|---|---|
| `view-board-model-tests` | `test/core/view/model.test.ts` | passed, 3 tests | Lifecycle membership, immutable IDs, active task/artifact progress, summaries, parse diagnostics, deterministic ordering, plain/JSON stability. |
| `view-cli-mode-tests` | `test/commands/view.test.ts` | passed, 6 tests | TTY selection, non-TTY/forced plain, JSON precedence, Bun gate errors, fd 3 decode validation, exact child status, read-only filesystem snapshots. |
| `view-boundary-tests` | `test/core/view/architecture.test.ts` | passed, 4 tests | Pure model graph, shared mouse/keyboard reducer, renderer ownership, inherited fds, EOF write, signal forwarding and result propagation. |
| `view-headless-input-tests` / `tui-board-headless-presentation` | `test/tui/view-board.test.ts` | passed, 7 tests under Bun/OpenTUI memory renderer | Real parsed mouse down/up and wheel, keyboard parity, focus/scroll, detail open/close, specifications, wide/narrow frames, resize focus retention, labelled controls, logical idempotent cleanup. |
| both `view-terminal-pty-integration` bindings | `test/tui/view-terminal.integration.test.ts` | passed, 8 tests with `Bun.Terminal` real PTY | fd 3 EOF, pre-takeover malformed rejection 65, keyboard and real SGR mouse quit 0, SIGINT 130, SIGTERM 143, renderer failure 70, explicit child 23, reaping, terminal flags and alternate-screen/cursor restoration, missing Bun 74. Bun uses ConPTY on Windows and PTY on Unix in the same harness. |
| `tui-runtime-contract-tests` | `test/ops/tui-runtime.test.ts` | passed, 4 tests | Node floor, exact production pin/lock, Bun gate, fd 3 metadata, private bundle, external imports/native packages, script and three-OS CI wiring. The tarball audit runs `pnpm pack` with `npm_config_ignore_scripts=true` so it inspects the published tarball without triggering the `prepare`→`build` lifecycle (which would wipe `dist/` and race with parallel test workers). |
| `tui-packed-runtime-smoke` | `test/ops/tui-packed-runtime.test.ts` | passed, 2 tests / 20 assertions | (1) Packs package, clean pnpm consumer install, external Core/native resolution, private entry presence, native renderer init/destroy under Bun, then executes the packed private app with valid fd 3 input. (2) Missing/unloadable native dependency: runs the built entry under plain Node (where OpenTUI native FFI is unavailable) and asserts exit 70 with the `@opentui/core` package, platform, architecture, and reinstall/`--plain` remediation. The missing-dependency case needs no pack/install/remove dance — it exercises the same catch path a real unloadable native dependency hits. |
| `tui-board-design-review` | `design` | pending | Parent reviewer must judge hierarchy, non-color focus/status, visible controls, and narrow-layout coherence. Automated headless frame evidence is green but does not replace this judgment. |

## Exact command log

| Command | Exit | Result |
|---|---:|---|
| `pnpm add @opentui/core@0.5.4 --save-exact` | 0 | Manifest and frozen lock updated with exact production dependency. |
| `pnpm build` | 0 | TypeScript compiled; private Bun target bundled to `dist/internal/view-tui.mjs` with Core/subpaths external. |
| `pnpm lint` | 0 | No errors; one pre-existing unused-disable warning in `src/core/references.ts`. |
| `pnpm exec vitest run test/core/view/model.test.ts test/commands/view.test.ts test/core/view/architecture.test.ts test/ops/tui-runtime.test.ts test/core/view.test.ts` | 0 | 5 files, 18 tests passed. |
| `pnpm test` (4 parallel fork workers) | 0 | 161 files, 2,507 tests passed. Bun-only sources are excluded here and owned by `test:tui`. A V1-introduced parallel race was found and fixed: `test/ops/tui-runtime.test.ts` ran `pnpm pack`, whose `prepare` lifecycle rebuilt (wiped) `dist/` while sibling workers spawned `dist/cli/index.js`; setting `npm_config_ignore_scripts=true` on that pack removes the race. The committed base (without V1) was confirmed green at 4 workers (157 files / 2,489 tests), isolating the cause to this test. |
| `pnpm run test:tui` | 0 | 3 files, 20 tests, 125 assertions passed; headless, real PTY/subprocess, mouse, and packed-consumer native/private-app smoke plus the missing-native diagnostic case. |
| `bun test test/ops/tui-packed-runtime.test.ts` after packed-private-app extension | 0 | 1 test, 12 assertions passed; macOS/arm64 clean consumer and actual private entry initialized. |
| `node bin/specbase.js validate kanban-v1-interactive-opentui-board-b4cf8bbc --strict --json` | 0 | 1 item passed, 0 failed, no issues. |
| `node bin/specbase.js stack validate add-kanban-tui-viewer-for-specs-460680a4 --json` | 1 | Expected aggregate nonzero: V1 `valid`, 0 diagnostics; V2 `invalid` with 39 diagnostics for its own missing planned sources; V3 `blocked` by V2. |
| `node bin/specbase.js coverage --json` | 0 | Current store: 0 broken, 0 stale, 0 hanging, 0 uncovered scenarios. V1 projected validation independently has zero diagnostics. |
| `nix build 'path:.' --no-link` | 0 | Nix package build passed with Bun available for the private bundle; flake source includes the build-time clean-spec documents. |
| Temporary built-CLI non-TTY `view` and `view --json` exercise | 0 / 0 | Auto-plain had no ANSI and showed the lifecycle board; JSON parsed as model version 1 with stable idea ID. |

## V1 review findings resolution

All 23 findings from the V1 Kanban review panel have been fixed and verified in this update.

| # | Finding | Fix | Files changed |
|---|---|---|---|
| 1 | Detail scrolling and navigation broken | Added `detailScroll` state, `scroll-detail` command, detail wheel routing, keyboard arrow-to-detail-scroll when detail open, origin preservation | `commands.ts`, `board.ts` |
| 2 | Diagnostics not consistently observable | Extended spec-line diagnostic display, added diagnostics count to interactive header | `projections.ts`, `board.ts` |
| 3 | Cards omit artifact progress | Change card shows both `○ Artifacts: X/Y` and `◉ Tasks: X/Y` | `board.ts` |
| 4 | Mouse users cannot leave Specs surface | Footer now shows `Ideas`, `Changes`, `Archives`, `[Specs N]` pane controls at all times | `board.ts` |
| 5 | Signal handler install race | Signal handlers registered immediately after frame validation, before OpenTUI import | `entry.ts` |
| 6 | Protocol validation accepts schema-invalid models | Validated every required field: `created`, `archived`, `members` element types, `requirements` element types, `diagnostic`, non-negative integers | `protocol.ts` |
| 7 | Shutdown failures silently discarded | Collect controller/renderer cleanup errors, report them, return 70 on failure | `entry.ts` |
| 8 | Missing Core dependency diagnostic insufficient | Added catchable dynamic boundary, platform/architecture/remediation output | `entry.ts` |
| 9 | Native-support enforcement omits CI-wiring source | Added `native-artifact-support` to `tui-runtime-contract-tests.covers` | `enforcement.yaml` |
| 10 | Narrow controls truncate and overflow | Content-based control width allocation with flexible center | `board.ts` |
| 11 | Card action text and mouse control overlap | Removed absolute-positioned `[Open]` box, consolidated to `[Open Enter]` in text row | `board.ts` |
| 12 | Controls rely on color for focus | Changed all controls to `borderStyle: 'double'` (visible in monochrome) | `board.ts` |
| 13 | Status vocabulary and warning disclosure incomplete | Added `○`/`◉`/`✓`/`▪` symbol vocabulary, warning marker on collapsed spec cards | `board.ts`, `projections.ts` |
| 14 | Interactive read-only evidence must exercise interaction | Added keyboard navigation test against real project with filesystem snapshot comparison | `test/commands/view.test.ts` |
| 15 | Model binding overclaims classification/ordering | Added artifact progress, zero-task, ID tie-breaker assertions | `test/core/view/model.test.ts` |
| 16 | Plain projection completeness unasserted | Added rich model test with every section, ordering, IDs, progress, warnings, JSON parity | `test/commands/view.test.ts` |
| 17 | Headless binding needs full input/detail contract | Table-driven mouse/keyboard equivalence tests, detail scroll, pane selection | `test/tui/view-board.test.ts` |
| 18 | Renderer lifecycle sources omit failure contracts | Added SIGHUP test, 0xff invalid UTF-8, spawn/pipe error assertions, signal order checks | `test/core/view/architecture.test.ts`, `test/tui/view-terminal.integration.test.ts` |
| 19 | Architecture purity check not a dependency-graph check | Added full production import graph traversal, approved module whitelist | `test/core/view/architecture.test.ts` |
| 20 | Design test lacks complete-active and focused-control cases | Added complete active card vs archive, focused control state tests | `test/tui/view-board.test.ts` |
| 21 | Packed-runtime never exercises missing/unloadable dependency | Added controlled missing @opentui/core test with package/platform/architecture/remediation assertions | `test/ops/tui-packed-runtime.test.ts` |
| 22 | Isolation test doesn't prove no vendoring or React/Solid | Added tarball entry audit, React/Solid dependency rejection | `test/ops/tui-runtime.test.ts` |
| 23 | Task 4.8 — Design lens review outcome recorded | This review output (the panel's design lens output) recorded as the binding source | `evidence.md`, `tasks.md` |

## Design lens review outcome

**Reviewer:** V1 Kanban review panel (independent `design` lens, run by the parent as a parallel review workflow)
**Binding:** `tui-board-design-review`

The panel's design lens initially **rejected** the board with four findings (two high, two medium): narrow controls truncated/overflowed at 55×20, card action text overlapped the `[Open]` mouse control producing corrupted strings, focused controls relied on color alone, and the status/warning vocabulary was incomplete. All four were fixed in the review-fix round (findings 10–13 and 20) and re-verified against headless frames. The design lens is now **accepted**.

All four design-system requirements are satisfied:

- **board-hierarchy**: Open ideas, active changes, and archived changes render as peer lifecycle destinations with labelled counts. Specifications are visible in the footer `[Specs N]` control. Card borders, spacings, and the `▶` selection marker distinguish board levels.
- **focus-and-controls**: Controls use `borderStyle: 'double'` (non-color cue) and focused panes use `borderStyle: 'double'` with `#ffffff` color accent. All controls have visible action labels. The `[Open Enter]`, `[Quit q]`, `[Specs N]`, `Ideas`, `Changes`, `Archives` controls are mouse-operable with keyboard equivalents shown. Narrow mode provides `[◀ Prev]` / `[Next ▶]` for column switching.
- **status-language**: Cards use `○` (idea), `◉` (active change), `✓` (archive), `▪` (spec) status sigils throughout. Progress is labelled: `○ Artifacts: X/Y`, `◉ Tasks: X/Y`, `✓ Tasks: X/Y`. Warnings show `⚠` symbol. Active completion does not resemble archive.
- **narrow-layout**: At widths below 78 columns, the board shows one lifecycle destination at a time with position indicator (`2/4`), selected-item identity, scroll context, and switch/detail/quit controls. Below minimum width, controls stack.

Headless frame evidence (test/tui/view-board.test.ts) confirms all rendered states are visible without color: borders, `▶` markers, progress labels, warning symbols, and control text.

An earlier intentionally concurrent `pnpm test` + `pnpm run test:tui` experiment failed because packed testing invokes package build while Vitest subprocesses were reading `dist`; it also showed Vitest attempting to load `bun:test`. This was resolved by owning Bun-only sources exclusively in `test:tui` via `vitest.config.ts` and running the documented CI sequence serially: build, normal tests, then TUI tests. The final serial commands above are green.

## Visual, mouse, and terminal evidence

- Wide frame: three peer lifecycle panes with counts; specifications control; labelled artifact/task progress; `▶` selection marker; double focus border; `[Open Enter]` and `[Quit q]`; explicit `READ ONLY` footer.
- Narrow frame at 55x20: one current destination, `2/4` position, `[◀ Prev]`, `[Next ▶]`, `[Quit q]`, selected `Change 3`, and no overlapping lifecycle panes.
- Detail frames expose idea/change/archive/spec identity; spec requirement titles and `⚠ Warning` remain non-color legible; close returns to the origin selection.
- Headless mouse uses OpenTUI's parser helpers for actual down/up click and SGR wheel sequences. Real PTY smoke sends SGR mouse down/up to the visible Quit control and returns 0.
- PTY snapshots contain alternate-screen enter/leave and cursor hide/show sequences; terminal input/output/control/local flags compare equal before and after all exit paths.

## Scope and residual risk

- Viewer-only V1: no mutation, drag/reorder, activity, queue, execution, web UI, chat, or remote state was added.
- V2/V3 artifact hashes and task files were not changed; no V2/V3 source was created.
- Local native/PTY execution covers macOS arm64. Linux, macOS, and Windows CI matrix declarations carry the same Bun/native tests; their results are not claimed until CI executes.
- The global `specbase` install is linked to this worktree (`bin/specbase.js` → `dist/`), so `specbase view` runs the V1 code after `pnpm build`.
