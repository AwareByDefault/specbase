## 1. Durable Specbase queue core

- [ ] 1.1 Add strict versioned queue/item/attempt/result/local-intent schemas, the fixed `explore|propose|apply|verify|archive` action-stage mapping, deterministic serialization, and global-data paths; reject arbitrary and Git-delivery actions.
- [ ] 1.2 Implement locked atomic reads/updates, append-only attempts/results, immutable idea/change work-ID resolution, corrupt-state errors, and repository scoping.
- [ ] 1.3 Implement pure readiness policies over injected idea/artifact/status/task/validation/coverage adapters, with stable blocker codes and fixes and no activity, Git, or human-output input.
- [ ] 1.4 Implement add idempotency, atomic claim/lease/heartbeat/finish, cancellation, expired-lease recovery, succeeded-item suppression, and explicit reconciliation for interrupted work without claiming exactly-once execution.
- [ ] 1.5 Expose separate control and runner capabilities: control may add/approve/revoke/cancel; runner may inspect/claim/heartbeat/finish and cannot invoke approval mutation.
- [ ] 1.6 Implement exact per-item local operator-intent records and claim/pre-action observation for every action; document local CLI/filesystem possession as the trust boundary and make no authentication, authorization, identity, or credential-security claim.

## 2. CLI contracts

- [ ] 2.1 Register `queue add|list|show|approve|cancel|claim|heartbeat|finish` in Commander and `COMMAND_REGISTRY` with stable human/JSON envelopes and separate control/runner handlers.
- [ ] 2.2 Add actionable nonzero failures for missing work, invalid action/stage, blocked readiness, absent/revoked local intent, lease conflict/expiry, cancellation, corrupt state, and recovery-required outcomes.
- [ ] 2.3 Ensure JSON mode keeps stdout machine-only and never serializes credentials, environment secrets, project file contents, or claims that approval authenticates an operator.

## 3. Delivery-runner instrument

- [ ] 3.1 Add `.pi/skills/specbase-delivery-runner/SKILL.md` and any source template/registration needed to preserve generated-surface parity.
- [ ] 3.2 Encode one-item claim, context verification, read-only local-intent observation, heartbeat, safe cancellation, named-Specbase-action-only execution, evidence capture, finish/failure, no approval mutation, no action chaining, and no commit/push/merge/deploy.
- [ ] 3.3 Implement `test/core/delivery-runner-skill.test.ts` for artifact/frontmatter/template parity and protocol transcripts; link/verify the delivery-runner bindings.
- [ ] 3.4 Run the skill source through `pnpm exec vitest run test/core/delivery-runner-skill.test.ts` and record the exact command/result in `evidence.md`.

## 4. Queue behavioral and architecture evidence

- [ ] 4.1 Implement `test/core/delivery-queue/state.test.ts` for all five action policies, transitions, durable restart, recovery, cancellation, results, and corruption; link/verify `delivery-queue-state-tests`.
- [ ] 4.2 Implement `test/core/delivery-queue/concurrency.test.ts` for lock ownership, competing claims, lease tokens/expiry, idempotent add, and no rerun after success; link/verify `delivery-queue-concurrency-tests`.
- [ ] 4.3 Implement `test/core/delivery-queue/approval.test.ts` with separately constructed control/runner capabilities for exact intent, revocation, wildcard/mismatch rejection, runner inability to approve, claim/pre-action observation, trust-boundary copy, and recovery blocking; link/verify `delivery-queue-approval-tests` and architecture approval bindings.
- [ ] 4.4 Implement `test/commands/delivery-queue.test.ts` for every human/JSON command, completion registration, immutable work resolution, control/runner separation, status/fix fields, and exit codes; link/verify `delivery-queue-cli-tests`.
- [ ] 4.5 Run all four queue sources through `pnpm exec vitest run` with explicit paths and record commands/results in `evidence.md`.

## 5. Read-only board and design-system integration

- [ ] 5.1 Add deterministic queue summary/items/detail to the shared board model after lifecycle/activity derivation, with no queue mutation command in the viewer.
- [ ] 5.2 Add secondary queue selection/detail to interactive view and matching plain/JSON fields while preserving V2 activity and V1 project hierarchy.
- [ ] 5.3 Implement `test/commands/view.queue.test.ts` for summary, order, detail, blockers/results, local-intent labels, plain/JSON parity, and byte-identical queue/project state after viewer use; link/verify view queue bindings.
- [ ] 5.4 Implement `test/tui/view-queue.test.ts` under Bun/OpenTUI headless mode with parsed mouse/keyboard reachability, equivalent detail/back outcomes, non-color focus, scroll retention, and wide/narrow queue hierarchy frames; link/verify behavior and design-system headless bindings.
- [ ] 5.5 Run the CLI source through `pnpm exec vitest run test/commands/view.queue.test.ts` and the headless source through `pnpm run test:tui -- test/tui/view-queue.test.ts`; record Bun version and results in `evidence.md`.
- [ ] 5.6 Request the `design` lens review for queue subordination/hierarchy, mouse/keyboard discoverability, focus, and narrow layouts; record the review outcome separately in `evidence.md`.

## 6. Change validation and execution record

- [ ] 6.1 Keep change-local `evidence.md` as the canonical execution record; distinguish planned/not-executed, structural linkage, native-harness execution, and review outcomes.
- [ ] 6.2 Run build, lint, focused queue/view/skill suites, and the Bun headless queue suite; record each exact command/result without Git side-effect smoke tests.
- [ ] 6.3 Run `openspec validate kanban-v3-agentic-delivery-queue-8ee64874 --strict` and `openspec stack validate add-kanban-tui-viewer-for-specs-460680a4 --json`; resolve projected-prefix failures and record outputs in `evidence.md`.
