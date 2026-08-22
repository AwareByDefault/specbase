## Outcome

An installed consumer can derive and validate a versioned Specbase board snapshot containing stable cards and lifecycle columns. `specbase view --json` becomes an adapter over that same contract.

## Demonstration

Package-import output and CLI JSON output are structurally identical for the same planning store.

## Explicit deferrals

Action availability, external activity, Pi rendering, and mutation remain deferred.

## Technical evidence — 2026-08-21

- `pnpm exec vitest run test/core/view/model.test.ts` — passed (8 tests). The mixed-store fixtures cover deterministic ideas, lifecycle columns, archives, specification summaries, malformed-item diagnostics, and composition of active/archive card identity, position, lifecycle, progress, and diagnostics from the predecessor lifecycle resolver.
- `pnpm exec vitest run test/commands/view.test.ts` — passed (9 tests). The public validator preserves a valid snapshot reference and reports deterministic `kanban_board_unsupported_version` and `kanban_board_invalid_shape` diagnostics without mutation.
- `pnpm run build` — passed. `dist/core/index.d.ts` exposes `KANBAN_BOARD_VERSION`, derive/validate APIs, and public DTO types; `dist/index.js` contains no `tui`, launcher, or Commander reference.
- `pnpm exec vitest run test/cli-e2e/store-lifecycle.test.ts` — passed (10 tests). A clean temporary consumer installs the packed root package, derives and validates a mixed board, confirms no compiled `dist/tui` runtime is installed, and compares the result structurally with parsed `specbase view --json` output.
- `pnpm run lint` — completed with no errors; it retains one pre-existing warning in `src/core/references.ts` for an unused eslint-disable directive.
- `node bin/specbase.js validate expose-a-versioned-headless-specbase-kanban-api-37554619 --type change --strict --no-interactive` — passed.
- `pnpm test` — failed on unrelated generated-template/parity expectations: 36 files / 312 tests failed (2,232 passed). The failures are in `test/core/templates/coverage-guidance.test.ts`, `test/core/templates/review-panel.test.ts`, and `test/core/templates/skill-templates-parity.test.ts` (plus the same template drift family); this change does not modify template sources, generated skills, or their tests. No change-attributable regression was identified.
- Independent functionality review found glob-tracked task progress regressed through the lifecycle composition and optional public card fields were under-validated. The resolver now counts all files from the tracked artifact glob, and validation checks typed optional fields plus summary/card consistency; the pre-existing tracked-task regression suite and all focused tests pass.

## Human-operator UX spike — 2026-08-21

**Journey:** Built the package, derived and validated the live repository board through the root API, inspected column counts and a focused card, requested an unsupported version, then ran `specbase view --json` and compared its version, summary, and diagnostics.

- **Simplicity:** `deriveKanbanBoard(root)` followed by `validateKanbanBoardSnapshot(board, version)` is direct. Requiring an explicit requested version makes compatibility deliberate but adds one argument to the common path.
- **User-centered design:** The snapshot gathers ideas, active lifecycle work, archives, and accepted specs without requiring consumers to understand the filesystem layout.
- **Visibility and feedback:** Stable diagnostics and the unsupported-version remediation are clear. Returning the full accepted snapshot is useful in code but can create very large debug output if logged wholesale.
- **Consistency:** The package and `view --json` summaries, version, and diagnostics matched on the live repository; all output modes still consume one board value.
- **Clarity:** Column names and progress fields are understandable. Some cards fall back to directory-like titles when richer metadata is absent, which makes the raw board less friendly than the eventual UI should be.
- **Accessibility/keyboard:** The headless API has no interaction surface; JSON remains compatible with keyboard-only terminal tooling and assistive processing.
- **Usability and efficiency:** Current-store derivation felt responsive, but resolving lifecycle independently for each card rescans active/archive directories and may scale poorly on very large stores.
- **Delight:** The package API provides the same truth as the CLI without loading Commander, Bun, or OpenTUI, making external integration feel lightweight.
- **Observed defects fixed:** Nested tracked-task progress and optional card/summary validation gaps were fixed and regression-tested.
- **Optional unfixed improvements:** Add a batched lifecycle resolver to avoid repeated directory scans, provide a concise debug/summary helper, and improve title fallback precedence. These are spike follow-ups rather than current blockers.
