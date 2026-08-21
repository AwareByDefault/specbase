## 1. Activity model and provider

- [ ] 1.1 Add the versioned activity value, injected clock/provider interfaces, 15-minute evaluator, future-time clamp, and per-card unknown fallback.
- [ ] 1.2 Implement the local `project-files` metadata provider with card-directory confinement, escaping-symlink rejection, content-blind reads, batching, and no writes/network/process inspection.
- [ ] 1.3 Enrich open idea, active change, and archived change cards after lifecycle/progress derivation without changing ordering or governed state.

## 2. View projections

- [ ] 2.1 Add compact non-color activity labels to cards and exact source/time/age to detail, preserving lifecycle and progress hierarchy.
- [ ] 2.2 Add deterministic activity labels to plain output and the structured `activity` object to JSON for every work card.
- [ ] 2.3 Preserve V1 mouse/keyboard behavior, focus, scrolling, and narrow layout while activity content appears and changes length.

## 3. Core and CLI evidence

- [ ] 3.1 Implement `test/core/activity-awareness.test.ts` for freshness boundaries, stale/unknown/future states, source fields, privacy bounds, failures, and no writes; link/verify `activity-model-tests`.
- [ ] 3.2 Implement `test/core/activity-awareness.architecture.test.ts` for provider/time injection and separation from lifecycle/progress/network/process modules; link/verify `activity-boundary-tests`.
- [ ] 3.3 Implement `test/commands/view.activity.test.ts` for card/plain/JSON parity and unchanged lifecycle/order/progress; link/verify the view activity bindings.
- [ ] 3.4 Run all three sources through `pnpm exec vitest run` with explicit file paths and record commands and results in `evidence.md`.

## 4. Renderer and design evidence

- [ ] 4.1 Implement `test/tui/view-activity.test.ts` with fresh/stale/unknown card and detail frames at wide/narrow sizes; link/verify the TUI activity bindings.
- [ ] 4.2 Run the headless activity source through `pnpm run test:tui -- test/tui/view-activity.test.ts` with Bun >=1.3 and record the exact command, runtime version, OS/architecture, and result in `evidence.md`.
- [ ] 4.3 Request the `design` lens review for subordinate hierarchy and non-color distinctions; record the review outcome separately in `evidence.md`.

## 5. Change validation and execution record

- [ ] 5.1 Keep change-local `evidence.md` as the canonical execution record; distinguish planned/not-executed, structural linkage, native-harness execution, and review outcomes.
- [ ] 5.2 Run build, lint, focused Vitest, and Bun headless suites and record each exact result in `evidence.md`.
- [ ] 5.3 Run `openspec validate kanban-v2-activity-awareness-e3823ed2 --strict` and `openspec stack validate add-kanban-tui-viewer-for-specs-460680a4 --json`; resolve V2 projection failures without implementing V3 and record outputs in `evidence.md`.
