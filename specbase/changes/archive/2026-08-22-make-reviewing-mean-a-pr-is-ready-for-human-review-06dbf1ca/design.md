## Context

Lifecycle currently treats `lastReviewedAt` as a Reviewing footprint. The standalone panel therefore moves completed work before a pull request exists and can block the later draft-PR action. `draftPullRequest` metadata has exact identity but no readiness state. The action catalog exposes separate local-delivery and draft-PR capabilities even though the operator wants one Ready-to-review journey.

## Goals / Non-Goals

**Goals:**
- Make Reviewing mean a PR is ready for human review.
- Keep panel audit and draft recovery visible but non-transitional.
- Publish one canonical Ready-to-review capability.
- Publish feedback, comment-aware Explore, and human Archive actions in Reviewing.
- Keep every remote side effect outside Specbase.

**Non-Goals:**
- Fetch or resolve GitHub comments in Specbase.
- Require approval or merge before Archive.
- Automatically merge, delete branches, or start stack successors.
- Implement the external workflows in this repository.

## Decisions

### 1. Version lifecycle and action semantics

Advance lifecycle snapshots and direct-action catalogs at their explicit version boundaries. Older values remain rejectable or readable only according to documented compatibility; clients never infer the new semantics from an old version.

### 2. Generalize draft metadata into a pull-request observation

Store exact repository, base/head, verified SHA, number, URL, run ID, and `draft | ready` state. Preserve compatible legacy draft metadata on read. Exact replay is idempotent; conflicting identity or state regression is rejected. Archive snapshots retain the descriptor.

### 3. Derive Reviewing from ready state

Completed tasks plus `pullRequest.state === ready` yield Reviewing. `lastReviewedAt` remains panel audit only. A draft observation can be projected without moving lanes.

### 4. Replace client choreography with closed capabilities

The current catalog exposes `specbase.ready-to-review` for Ready/Implementing work and `specbase.pr-feedback` for Reviewing work. The descriptor contains target identities, not RPIV workflow names. A comment-aware Explore dispatch remains conversational. Existing legacy actions remain available only through the prior catalog version where compatibility demands it.

### 5. Keep Archive human-controlled

Archive remains available under current task, strict-validation, Reviewing, and stack-predecessor policy. Specbase does not query approval or merge. External clients may present observed remote state in confirmation without turning it into a canonical gate.

## Enforcement design

### `test/commands/work-item-lifecycle.test.ts`

Exercise panel-only, draft, ready, conflict, replay, Reviewing action, stale intent, archive, and no-side-effect cases. Assert result recording changes only metadata and uses exact compare-and-set identity. Failure is a Vitest assertion. Fake adapters are not evidence of real GitHub state.

### `test/cli-e2e/store-lifecycle.test.ts`

Consume lifecycle, board, and action APIs from a packed package against one fixture. Assert the same ready PR link and lifecycle appear in package and CLI projections. Failure is a journey command or Vitest assertion.

## Risks / Trade-offs

- Existing consumers may rely on panel timestamps causing Reviewing; explicit versioning makes the semantic break visible.
- Ready state can become stale if an external actor converts the PR to draft; external adapters must submit fresh observations before sensitive actions.
- Human-controlled Archive can precede merge by design; clients should show remote status rather than enforce it.

## Migration Plan

1. Add the generalized metadata schema and legacy reader.
2. Publish lifecycle/action version changes and new capabilities.
3. Change Reviewing derivation and preserve archive links.
4. Update board projection, validators, exports, and packed journeys.
