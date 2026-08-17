## 1. Resolve project-defined enforcement types

- [x] 1.1 Add open enforcement-type records to the governed spec model with `id`, `purpose`, core `strength`, and `sourceKind`, and seed curated schema defaults.
- [x] 1.2 Parse `specModel.enforcement.types` and `types+` project overrides resiliently, then resolve replacement/append semantics alongside planes.
- [x] 1.3 Surface the resolved type roster through status, instructions, context, config serialization, and public TypeScript exports without hardcoded public mechanism IDs.

## 2. Introduce compact `enforcement.yaml`

- [x] 2.1 Implement the direct-YAML parser and strict binding-map schema: map-key identity plus exactly `type`, `covers`, and `source`, with scalar/list requirement coverage normalization.
- [x] 2.2 Update governed discovery and pair resolution to prefer `enforcement.yaml`, accept a lone legacy `enforcement.md`, and report a dual-file ambiguity.
- [x] 2.3 Derive binding strength and source resolution from the resolved type; update coverage, drift, diagnostics, retired-source detection, and requirement-level scenario inheritance.
- [x] 2.4 Update show, list, context, validation, synchronization, and archive merge so touched pairs normalize to `enforcement.yaml` while legacy Markdown remains readable.

## 3. Preserve enforcement design across planning artifacts

- [x] 3.1 Update the governed proposal template and instructions to require an enforcement-intent table naming planned type, source, covered truth, and intended proof.
- [x] 3.2 Update the governed design template and instructions to require source contracts covering assertions or observations, harness/environment, failure signal, and known boundary.
- [x] 3.3 Update the governed tasks template and instructions to require implementing each source, linking it from the manifest, executing it through its native harness, and recording the result.
- [x] 3.4 Update the enforcement artifact template, schema output path, and authoring instructions to emit only compact `enforcement.yaml` bindings.

## 4. Project the resolved model into workflows

- [x] 4.1 Project enforcement type IDs, purposes, strengths, and source kinds into every governed authoring, apply, verify, archive, onboard, and review surface.
- [x] 4.2 Replace command-vector/status/target/procedure guidance with the compact source model and separate structural linkage, execution outcome, and semantic correspondence.
- [x] 4.3 Update review residue routing to derive deterministic sibling evidence from requirement coverage instead of `covered_by` lists.

## 5. Migrate shipped and self-hosted artifacts

- [x] 5.1 Update baseline planted pairs, per-plane templates, examples, and generated clean guidance from `enforcement.md` to `enforcement.yaml`.
- [x] 5.2 Convert current self-hosted governed pairs to compact YAML without changing their requirement-to-evidence relationships; preserve legacy Markdown only in migration fixtures or dated historical archives.
- [x] 5.3 Update documentation and repository guidance to teach that the manifest is an index while proposal, design, tasks, and sources define and deliver enforcement.

## 6. Implement and run the planned evidence sources

- [x] 6.1 Add `test/core/governed/enforcement-yaml.test.ts` covering direct YAML, exact binding fields, scalar/list normalization, pair identity, Markdown fallback, and dual-file conflicts.
- [x] 6.2 Add `test/core/governed/enforcement-types.test.ts` covering defaults, replacement, append, invalid records, duplicates, and resolved-model propagation.
- [x] 6.3 Update coverage, target-validation, archive, and discovery suites for type-derived strength, file/lens sources, scenario inheritance, source drift, and YAML normalization.
- [x] 6.4 Add `test/core/templates/enforcement-planning.test.ts` proving the proposal, design, and tasks templates carry their distinct enforcement responsibilities.
- [x] 6.5 Extend governed-guidance projection tests with custom and removed type rosters and the compact binding shape.
- [x] 6.6 Run all focused evidence sources through Vitest, record failures and fixes, then run typecheck, the full test suite, and strict Specbase validation.
- [x] 6.7 Resolve every compact binding source in this change, run each declared file source through its repository-native harness, record the focused results, and confirm migration did not retire any still-shared source.
- [x] 6.8 Close final-review gaps in strict manifest validation, filename-bound parsing, dual-file archive blocking, lossless legacy target splitting, and file-source validation; add regression coverage for each gap.

## Verification record

- Clean scope: validation ran from a temporary tree materialized from HEAD plus only the intended index content; dependencies were symlinked from the main checkout, and the dirty main worktree was not used as test input.
- Compact source resolution: all 11 distinct file sources referenced by the five change deltas exist across 17 bindings; no lens source is declared by the change deltas.
- Focused harness: Vitest ran 14 files and all 205 tests passed, covering every declared delta source plus artifact-graph coverage, parser, and strict-change regressions.
- Generated-surface parity: Vitest ran the governed-guidance, projection, review-panel projection, and propose-surface suites; all 4 files and 113 tests passed. The clean-rules generator also reported its checked-in module up to date during build.
- Full harness: Vitest ran 151 files and all 2,429 tests passed.
- Build: `pnpm build` passed in the clean scoped tree.
- Store checks: strict current-spec validation passed for all 49 pairs with no invalid pair; strict coverage reported `valid: true`, 292/292 requirements, and 769/769 scenarios, with no stale bindings, enforcement-only pairs, broken targets, or unbound evidence.
- Archived artifacts: direct archived-change lookup is not supported by the CLI. In the temporary tree, the archived artifact directory was placed at its active-change path and the five affected specs were restored to their HEAD pre-archive state; strict change validation then passed for 1/1 change with zero issues.
- Migration inventory: 54 governed manifests (49 current pairs + 5 deltas) contain 254 legacy bindings, 389 compact bindings, 603 cover references across 308 pair-local requirement IDs, and 389 source references using 140 distinct source strings. Five shipped templates were also migrated separately.
- Migration cleanup: no source file was deleted. Multi-target bindings were split and all surviving links were retained; therefore no still-shared source was retired.
- Diff hygiene: the clean scoped tree passed `git diff --check`; after selective staging, `git diff --cached --check` also passed.
