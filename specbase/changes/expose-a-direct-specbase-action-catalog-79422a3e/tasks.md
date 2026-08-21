## 1. Publish the direct action boundary

- [x] 1.1 Project the predecessor lifecycle snapshot and stack-aware gate APIs into a normalized immutable target-fact record for ideas, active changes, and archives, reading repository facts once per catalog or validation request.
- [x] 1.2 Define and export the versioned catalog, closed action IDs, stable labels, availability, blocker/remediation, diagnostics, discriminated dispatch contexts, minimal exact intents, and validation-result types from the package root; encode the exact `specbase-explore`, `specbase-propose`, `specbase-explore-enforce`, `specbase-propose-enforce`, `specbase-apply-change`, `specbase-review-panel`, and `specbase-archive-change` skill identities plus the transport-neutral `specbase.local-delivery` and `specbase.draft-pr-delivery` capability identities with typed target/store arguments.
- [x] 1.3 Implement pure deterministic policy for `explore`, `propose-feature`, `explore-enforcement`, `propose-enforcement`, `apply`, `review`, and `archive`, including one highest-priority blocker per known action and stack predecessor ordering.
- [x] 1.4 Implement catalog lookup by immutable work-item ID with stable store/target identity, deterministic descriptor and diagnostic ordering, no timestamps or absolute paths, and no board-card or display-label authority.
- [x] 1.5 Implement exact-intent validation that re-resolves fresh state, rebuilds the canonical catalog, requires exact store/target/version/action/dispatch-kind equality, and returns only the current canonical descriptor or stable rejection diagnostics.
- [x] 1.6 Keep command, Git, Pi skill, RPIV workflow, queue, approval, mutation, authorization, confirmation, and result handling outside the boundary; reject arbitrary executable fields before an external adapter can run.
- [x] 1.7 Build the package and inspect root exports and generated declarations for clean installed-consumer use without CLI, renderer, Pi, RPIV, Git, or shell dependencies.

## 2. Deliver policy and execution-boundary evidence

- [x] 2.1 Extend `test/commands/work-item-lifecycle.test.ts` through Vitest with a complete action-policy matrix across idea/change/archive identity, lifecycle, artifacts/tasks, strict-validation, and stack-predecessor facts for bindings `authoritative-action-policy-tests` and `direct-action-policy-tests`.
- [x] 2.2 Add planning-revision retry assertions proving one coherent fresh fact record per request, stale client lanes/labels/availability are ignored, action and blocker ordering is deterministic, and each blocked action carries one stable code and concrete remediation.
- [x] 2.3 Add exact-intent and side-effect-sentinel cases proving current acceptance, fresh-state stale rejection, exact identity/version/action/kind matching, arbitrary executable-field rejection, canonical structured descriptors, and zero command/Git/skill/workflow/mutation invocations for binding `validated-dispatch-boundary-tests`.
- [x] 2.4 Confirm all architecture and unit-policy bindings contain exactly `type`, requirement-level `covers`, and `source` and resolve to `test/commands/work-item-lifecycle.test.ts`.
- [x] 2.5 Execute `pnpm exec vitest run test/commands/work-item-lifecycle.test.ts` through the native Vitest harness.
- [x] 2.6 Record the command, policy matrix, pass/fail result, and any limitation or remediation in the change `notes.md` evidence log.

## 3. Deliver installed-package diagnostics evidence

- [x] 3.1 Extend `test/cli-e2e/store-lifecycle.test.ts` through its cross-machine harness to build/pack/install the action catalog root exports and list canonical direct actions for representative idea, active, and archived immutable targets, with stack-aware ordering exercised by the focused policy matrix, for binding `direct-action-package-journey`.
- [x] 3.2 Add combined focused and clean-package fresh-state validation cases for current, newly blocked, missing, ambiguous, unsupported-version, unknown-action, tampered store/work-item/action/kind, and malformed intents; assert stable ordered diagnostics, affected identity, remediation, no rejected descriptor, and unchanged store snapshots.
- [x] 3.3 Confirm the package-journey binding contains exactly `type`, requirement-level `covers`, and `source` and resolves to `test/cli-e2e/store-lifecycle.test.ts`.
- [x] 3.4 Run `pnpm run build`, then execute `pnpm exec vitest run test/cli-e2e/store-lifecycle.test.ts` through the native CLI-E2E harness.
- [x] 3.5 Record the build/test commands, clean-package fixture details, pass/fail results, and any limitation or remediation in the change `notes.md` evidence log.

## 4. Verify the completed slice and operator experience

- [x] 4.1 Run `pnpm run lint`, `pnpm test`, and `node bin/specbase.js validate expose-a-direct-specbase-action-catalog-79422a3e --type change --strict --no-interactive`; record every result and resolve regressions attributable to this change.
- [x] 4.2 After functional checks pass, have a human operator use a clean package consumer to list available/blocked actions, inspect blocker remediation, select an exact intent, change store state, and validate again; append a dated UX journal to `notes.md` covering simplicity, user-centered design, visibility, consistency, feedback, clarity, accessibility and keyboard operation (or explicit non-applicability for the headless calls), usability, efficiency, delight, observed defects, and optional unfixed improvements.
- [x] 4.3 Triage every journal defect: fix in-scope functional or accessibility defects and rerun affected native harnesses, or record an explicit rationale and follow-up for optional unfixed improvements.
