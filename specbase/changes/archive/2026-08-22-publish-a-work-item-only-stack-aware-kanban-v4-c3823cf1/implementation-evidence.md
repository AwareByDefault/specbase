## Verification record

### Structural linkage

- `derive-kanban-snapshot` and `work-card-stack-context` → `test/core/view/model.test.ts` via `kanban-v4-model-tests`.
- `validate-work-only-kanban` → `test/commands/view.test.ts` via `kanban-v4-validation-tests`.
- Package/CLI derivation parity → `test/cli-e2e/store-lifecycle.test.ts` via `kanban-v4-package-cli-parity`.
- Current coverage health after implementation: 343/343 requirements covered; 0 broken, stale, or hanging pairs. Review-backed pairs remain visibly degraded by design.

### Native-harness execution

- RED checkpoint `5aa6f78`: focused Vitest produced 7 expected failures and 27 passes. Failures were version 3 instead of 4, retained accepted-spec fields, absent stack annotations, unsupported requested v4 validation, and package version 3.
- `pnpm exec vitest run test/core/view/model.test.ts test/commands/view.test.ts test/cli-e2e/store-lifecycle.test.ts test/core/view.test.ts test/core/view/architecture.test.ts`: all focused files passed; after review remediation the focused model/validator/package group totals 47 tests.
- `pnpm run test:tui`: 3 files, 39 Bun/OpenTUI tests passed, including packed external runtime.
- `pnpm exec vitest run test/commands/change-stacks.test.ts`: 10 tests passed. (A prior parallel run raced the packed-runtime build deleting `dist`; the isolated native rerun passed.)
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run lint`: passed with one pre-existing warning in `src/core/references.ts` for an unused eslint-disable directive.
- `pnpm run build`: passed; private Bun/OpenTUI bundle remained isolated at 35.40 KB.
- `specbase validate publish-a-work-item-only-stack-aware-kanban-v4-c3823cf1 --strict`: passed.
- `git diff --check`: passed.

### Semantic correspondence

- Mixed-store derivation now returns version 4 with every readable idea/change/archive once, no accepted-spec pane or counts, and exact `{id, position, total}` annotations for valid stacked work.
- Stack membership is indexed once per snapshot. Invalid stack manifests add deterministic diagnostics and do not remove readable work cards.
- Public and isolated renderer validators reject legacy v4 fields and invalid stack ordinals; explicit v3 compatibility rejects malformed counts, cards, and inconsistent summaries.
- Installed package output and `specbase view --json` are structurally equal.
- Plain and standalone TUI projections show work lanes only and expose stack identity/ordinal without importing headless store code into the renderer protocol.
- Independent adversarial review found four issues: loose v3 validation, repeated stack rescans, silent unreadable-stack handling, and removal of the public legacy `SpecCard` type. All four were remediated and independently verified against the final tree.

### Boundaries

- Explicit validation-only v3 compatibility remains available when callers request version 3; current derivation, CLI JSON, and TUI protocol are v4.
- Accepted specifications remain in the planning store and their dedicated APIs; only the Kanban delivery projection omits them.
