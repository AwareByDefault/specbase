## 1. Publish authoritative lifecycle snapshots

- [x] 1.1 Define the versioned serializable lifecycle snapshot/result DTOs and compatibility constant, split CLI construction into its own package subpath, remove the CLI re-export from the root entrypoint, and export the supported resolver from that headless root.
- [x] 1.2 Implement immutable-ID resolution across active and dated archive positions, preserving current legacy fallback only where already supported and returning stable missing/unresolved/ambiguous diagnostics with remediation.
- [x] 1.3 Compose artifact graph, tracked-task, repository-position, and lifecycle services behind one headless resolver with deterministic normalization and diagnostic ordering.
- [x] 1.4 Adapt `specbase status --json` to resolve immutable IDs through the shared active/archive resolver before constructing status context, then project lifecycle, position, progress, and diagnostics while preserving its existing outer status envelope.
- [x] 1.5 Build the package and inspect generated declarations and exports to confirm an installed consumer can use the root API without importing Commander registration or renderer internals and the CLI bin still resolves its explicit entrypoint.

## 2. Deliver core and boundary evidence

- [x] 2.1 Extend `test/commands/work-item-lifecycle.test.ts` through Vitest with cross-platform active/archive fixtures and adapter-delegation assertions for binding `lifecycle-resolver-contract-tests`.
- [x] 2.2 Extend `test/core/view/architecture.test.ts` with deterministic lifecycle-boundary import-graph analysis that reports forbidden CLI, renderer, OpenTUI, or interactive-input reachability for binding `lifecycle-headless-boundary-analysis`.
- [x] 2.3 Confirm both architecture bindings in `specs/architecture/lifecycle-snapshots/enforcement.yaml` contain exactly `type`, requirement-level `covers`, and `source` and resolve to the implemented files.
- [x] 2.4 Execute `pnpm exec vitest run test/commands/work-item-lifecycle.test.ts test/core/view/architecture.test.ts` through the native harness.
- [x] 2.5 Record the command, environment, pass/fail result, and any limitation or remediation in the change `notes.md` evidence log.

## 3. Deliver installed-package and parity evidence

- [x] 3.1 Extend `test/cli-e2e/store-lifecycle.test.ts` through the existing Vitest cross-machine store harness with build/pack/install and active, archived, missing, and ambiguous snapshot cases for binding `lifecycle-snapshot-api-tests`.
- [x] 3.2 Extend the same journey to compare package results with parsed `specbase status --json` facts for binding `lifecycle-status-parity-tests`, keeping each binding's assertions explicitly named.
- [x] 3.3 Confirm both behavior bindings in `specs/behavior/api/lifecycle-snapshots/enforcement.yaml` contain exactly `type`, requirement-level `covers`, and `source` and resolve to the implemented files.
- [x] 3.4 Run `pnpm run build`, then execute `pnpm exec vitest run test/cli-e2e/store-lifecycle.test.ts` through the native harness.
- [x] 3.5 Record the build and test commands, clean-package fixture details, pass/fail results, and any limitation or remediation in the change `notes.md` evidence log.

## 4. Verify the completed slice and operator experience

- [x] 4.1 Run `pnpm run lint`, `pnpm test`, and `node bin/specbase.js validate expose-stable-specbase-lifecycle-snapshots-e1911fd5 --type change --strict --no-interactive`; record every result and resolve regressions attributable to this change.
- [x] 4.2 After functional checks pass, have a human operator exercise the root-package API and matching `status --json` journey, then append a dated UX journal to `notes.md` covering simplicity, user-centered design, visibility, consistency, feedback, clarity, accessibility and keyboard operation (or explicit non-applicability), usability, efficiency, delight, observed defects, and optional unfixed improvements.
- [x] 4.3 Triage every journal defect: fix in-scope functional or accessibility defects and rerun affected native harnesses, or record an explicit rationale and follow-up for optional unfixed improvements.
