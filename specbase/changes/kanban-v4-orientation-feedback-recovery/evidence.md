# Verification Evidence

## Structural linkage

- `behavior.cli.view` requirements `viewer-location-context`, `viewer-action-signifiers`, `viewer-navigation-semantics`, `viewer-immediate-feedback`, and `viewer-actionable-recovery` resolve to the declared Vitest, Bun/OpenTUI, and PTY sources in `specs/behavior/cli/view/enforcement.yaml`.
- Modified `design-system.tui-board` requirements remain linked to `test/tui/view-board.test.ts` and the configured `design` review lens.
- `specbase validate kanban-v4-orientation-feedback-recovery --type change --strict --no-interactive` passed on 2026-08-21.
- `specbase coverage --json` reported valid coverage with no stale bindings, enforcement-only pairs, broken targets, or unbound evidence.

## Native-harness execution

- `pnpm exec vitest run test/commands/view.test.ts test/core/view.test.ts test/core/view/architecture.test.ts test/core/view/model.test.ts test/core/view/lifecycle-model.test.ts` — passed after final review remediation: 5 files, 26 tests.
- `pnpm run test:tui` — passed after final review remediation: 37 Bun tests covering headless rendering, real PTY lifecycle, and packed runtime installation. An earlier run encountered one transient macOS temporary-directory cleanup error; the immediate retry and final run were green.
- `pnpm run build` — passed, including TypeScript compilation and private Bun/OpenTUI renderer bundle.
- `pnpm run lint` — passed with one pre-existing warning in `src/core/references.ts` about an unused eslint-disable directive.
- `specbase validate kanban-lifecycle-state --type change --strict --no-interactive` — passed.
- `specbase validate kanban-v4-orientation-feedback-recovery --type change --strict --no-interactive` — passed.
- `git diff --check` — passed.

## Semantic correspondence

- Reducer tests exercise focus-relative paging, empty and boundary feedback, help/detail transitions, and selection preservation.
- Headless OpenTUI tests observe project/lane/item context, read-only and snapshot language, precise Details/Help labels, actionable diagnostics, visible long-detail scrolling, non-color cues, and wide/narrow/short layouts.
- Command tests observe display-safe project identity, loading feedback, deterministic plain/JSON parity, and problem/consequence/next-step diagnostic output.
- PTY tests observe terminal restoration, project-file immutability, and actionable `--plain` recovery across normal exit, mouse exit, signals, renderer failures, malformed frames, and missing runtime.

## Review-panel remediation

The first blind panel ran behavioural, design, enforcement, and completeness lenses; the completeness critic added the current `architecture/tui-view` pair for review. Independent refute checks downgraded the project-title and end-to-end read-only claims, and verified wide-strip clipping, narrow-footer overflow, and short-terminal content loss.

Remediation added responsive count-aware lane/footer thresholds and an explicit terminal floor, short-mode content priority, persistent overlay/constrained context, dedicated announcements, non-color control focus, grouped help, actionable section/spec/protocol/runtime diagnostics, real mouse/keyboard parity across navigation/quit/detail scrolling, all-kind detail coverage, rendered paging, PTY filesystem snapshots, stronger projection/hierarchy/status assertions, lane-coherent protocol validation, an injected lifecycle model port, reducer-authoritative boundary-aware scroll state, and one shared close-overlay command. A second blind panel found no architectural or completeness gaps; its remaining behavioral, design, and enforcement findings were remediated and the deterministic gate was rerun.

## Baseline suite note

`pnpm test` completed with 2,522 passing tests and 10 failures in three template-guidance/parity files unrelated to the view implementation. The same 10 failures reproduce in a detached worktree at the run-start commit `473b771`; they are pre-existing branch drift, not regressions introduced by this change. No unrelated template instruments or expectations were modified as part of this work.
