## 1. Publish the headless kanban contract

- [ ] 1.1 Project the predecessor lifecycle snapshot API into this implementation and verify every active/archive card consumes its immutable ID, logical position, lifecycle, progress, and diagnostics without duplicating derivation.
- [ ] 1.2 Define public kanban snapshot, card, column, summary, diagnostic, validation-result, and version exports while keeping transient selection, focus, scrolling, terminal dimensions, and renderer protocol private.
- [ ] 1.3 Implement headless board derivation for ideas, active changes, archives, and accepted specifications with deterministic columns, counts, ordering, serializable values, and stable merged diagnostics.
- [ ] 1.4 Implement unknown-value validation for an explicitly requested supported version, returning typed success or stable unsupported-version/invalid-shape diagnostics without renderer-frame semantics.
- [ ] 1.5 Adapt `specbase view --json` to serialize the public board snapshot directly; keep plain and interactive projections downstream of the same value.
- [ ] 1.6 Build the package and inspect root exports and generated declarations so installed consumers can derive and validate snapshots without CLI or terminal imports.

## 2. Deliver board composition evidence

- [ ] 2.1 Extend `test/core/view/model.test.ts` through Vitest with mixed-store, malformed-item, deterministic-order, summary, diagnostic, and predecessor lifecycle-resolver composition assertions for bindings `kanban-lifecycle-composition-tests` and `kanban-board-model-tests`.
- [ ] 2.2 Confirm the architecture delta binding in `specs/architecture/tui-view/enforcement.yaml` and the board-model behavior binding in `specs/behavior/api/kanban-board/enforcement.yaml` contain exactly `type`, requirement-level `covers`, and `source` and merge without replacing surviving current `architecture.tui-view` bindings.
- [ ] 2.3 Execute `pnpm exec vitest run test/core/view/model.test.ts` through the native Vitest harness.
- [ ] 2.4 Record the command, fixture coverage, pass/fail result, and any limitation or remediation in the change `notes.md` evidence log.

## 3. Deliver validator and package parity evidence

- [ ] 3.1 Extend `test/commands/view.test.ts` through Vitest with public kanban validator success, unsupported-version, malformed-shape, stable-diagnostic, and non-mutating preservation cases for binding `kanban-board-validation-tests`.
- [ ] 3.2 Extend `test/cli-e2e/store-lifecycle.test.ts` through its cross-machine harness to build/pack/install the root package API, derive a representative board, validate it, prove no renderer runtime loads, and compare it structurally with parsed `specbase view --json` for binding `kanban-package-cli-parity-tests`.
- [ ] 3.3 Confirm the validator and parity bindings in `specs/behavior/api/kanban-board/enforcement.yaml` contain exactly `type`, requirement-level `covers`, and `source` and resolve to the updated files.
- [ ] 3.4 Execute `pnpm exec vitest run test/commands/view.test.ts`, then run `pnpm run build` and `pnpm exec vitest run test/cli-e2e/store-lifecycle.test.ts` through their native harnesses.
- [ ] 3.5 Record all commands, clean-package details, pass/fail results, and any limitation or remediation in the change `notes.md` evidence log.

## 4. Verify the completed slice and operator experience

- [ ] 4.1 Run `pnpm run lint`, `pnpm test`, and `node bin/specbase.js validate expose-a-versioned-headless-specbase-kanban-api-37554619 --type change --strict --no-interactive`; record every result and resolve regressions attributable to this change.
- [ ] 4.2 After functional checks pass, have a human operator exercise package derivation/validation and the equivalent `view --json` journey, then append a dated UX journal to `notes.md` covering simplicity, user-centered design, visibility, consistency, feedback, clarity, accessibility and keyboard operation (or explicit non-applicability for each headless step), usability, efficiency, delight, observed defects, and optional unfixed improvements.
- [ ] 4.3 Triage every journal defect: fix in-scope functional or accessibility defects and rerun affected native harnesses, or record an explicit rationale and follow-up for optional unfixed improvements.
