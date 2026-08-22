## 1. Deliver lifecycle and action evidence

- [x] 1.1 Implement PR-ready lifecycle, exact result, action-policy, idempotency, and no-side-effect coverage in `test/commands/work-item-lifecycle.test.ts`; run it through Vitest and record the result.
- [x] 1.2 Implement packed lifecycle/board/action parity in `test/cli-e2e/store-lifecycle.test.ts`; run it through Vitest and record the result.

## 2. Publish human-review semantics

- [x] 2.1 Generalize change metadata to a versioned pull-request observation with legacy draft compatibility and exact conflict rejection.
- [x] 2.2 Advance lifecycle snapshots so panel audit and draft state are non-transitional and ready state is Reviewing.
- [x] 2.3 Advance the direct-action catalog with Ready-to-review, PR-feedback, comment-aware Explore, and human Archive policy.
- [x] 2.4 Preserve pull-request descriptors on active and archived board cards and validate the complete shape.
- [x] 2.5 Preserve the external execution boundary: no Git, network, comment, merge, or branch operation in Specbase.

## 3. Verify

- [x] 3.1 Run focused lifecycle/action/board tests, TypeScript, build, strict change validation, and stack validation.
- [x] 3.2 Record linkage, native-harness execution, semantic correspondence, compatibility behavior, and boundaries.
