## Verification record

### Structural linkage

- `reviewing-requires-ready-pr` and `pull-request-observation-projection` → `test/commands/work-item-lifecycle.test.ts` and packed parity via `test/cli-e2e/store-lifecycle.test.ts`.
- `record-draft-pr-result`, `ready-to-review-capability`, and `reviewing-action-set` → `test/commands/work-item-lifecycle.test.ts`, with installed action parity in the CLI journey.
- `remote-review-result-boundary` → the metadata-only, lock/CAS, no-remote result tests in `test/commands/work-item-lifecycle.test.ts`.
- Current coverage health: 343/343 requirements covered; no broken, stale, hanging, or incomplete pairs. Review-backed pairs remain visibly degraded by design.

### Native-harness execution

- RED checkpoint `cf95e85`: the two declared sources produced 9 expected failures and 24 passes. Failures showed panel timestamps still causing Reviewing, lifecycle/action version 1, missing canonical PR projection, absent v2 capabilities, rejected ready-result recording, and no ready card in package/CLI output.
- `pnpm exec vitest run test/commands/work-item-lifecycle.test.ts test/commands/view.test.ts test/utils/change-metadata.test.ts test/core/view/lifecycle-model.test.ts`: 4 files, 77 tests passed.
- `pnpm exec vitest run test/cli-e2e/store-lifecycle.test.ts`: 11 packed-package/CLI journey tests passed.
- `pnpm run test:tui`: 39 Bun/OpenTUI and packed-runtime tests passed.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run lint`: passed with one pre-existing warning in `src/core/references.ts` for an unused eslint-disable directive.
- `pnpm run build`: passed; private renderer remained isolated.
- Strict change validation and correction-stack validation passed.
- `git diff --check`: passed.

A full `pnpm test` run completed 2,449 passing tests but remains non-green on 123 pre-existing repository-wide failures across 21 files. The failures include generated template/checked-in skill drift, stale coverage-guidance expectations, skill-count/hash expectations, and tests that race by concurrently rebuilding/removing `dist`. None of those failing files is changed by this lifecycle member except the review-panel template wording; the focused review-panel registration failure is the pre-existing governed skill-count expectation (15 versus 17), not the wording change. Scoped native evidence above is green.

### Semantic correspondence

- Lifecycle v2 treats `lastReviewedAt` as audit only, normalizes legacy draft metadata to canonical `pullRequest.state: draft`, and assigns Reviewing only to completed active work with `state: ready`.
- Active and archived snapshots and Kanban v4 cards retain exact PR observations; package, status, and JSON board projections agree.
- Action catalog v2 publishes one `specbase.ready-to-review` delivery capability and Reviewing actions for `specbase.pr-feedback`, PR-context Explore, and explicit human Archive.
- Result recording accepts exact replay and same-identity draft→ready, rejects regression, identity conflict, incomplete tasks, and newly blocked/stale policy before mutation.
- A per-change lock serializes competing submissions; metadata writes use temp-file rename. Concurrent conflicting submissions prove one acceptance and one conflict with no lock residue.
- Public and isolated v4 validators accept validated legacy `draftPullRequest` cards for compatibility, reject malformed legacy values, and current derivation emits only canonical `pullRequest`.
- The action boundary imports no Git, GitHub, network, comment, merge, or branch adapter and mutates only canonical metadata.

### Adversarial review

The first review found three blockers: blocked/stale result acceptance, non-atomic cross-process compare-and-set, and incomplete v4 legacy-card compatibility. All were remediated and independently verified against the final tree.

### Boundaries

- Remote readiness is an externally supplied observation; these tests do not exercise live GitHub credentials or operations.
- Archive remains human-selected and intentionally does not require remote approval or merge.
- Catalog v1 and lifecycle v1 are superseded current contracts; legacy draft metadata and v4 card inputs remain read-compatible where promised.
