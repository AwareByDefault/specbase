---
id: behavior.delivery-queue
---

## Purpose

Define how local operators and runners queue, approve, inspect, execute, and recover fixed Specbase-owned workflow actions.

## ADDED Requirements

### Requirement: Queue items name immutable work and one fixed Specbase action
**ID:** explicit-queue-item
`specbase queue add` SHALL require an immutable work ID, one action from `explore`, `propose`, `apply`, `verify`, or `archive`, and a caller idempotency key. The created item SHALL carry the action's fixed stage, stable queue ID, repository scope, timestamps, lifecycle, readiness, local-intent state, attempts, and latest result. Mutable directory names SHALL NOT be accepted as persisted identity when they disagree with metadata. Commit, push, merge, deploy, arbitrary commands, and user-defined workflow chains SHALL be rejected.

#### Scenario: Adding explicit governed work succeeds
**ID:** add-explicit-item
- **WHEN** a user adds a resolvable idea/change work ID with an allowed Specbase action and idempotency key
- **THEN** the queue returns a stable item whose stage matches the action and whose initial lifecycle/readiness are explicit

#### Scenario: Unknown work or action is actionable
**ID:** reject-unknown-work-action
- **WHEN** the work ID cannot be resolved or the action is outside the fixed Specbase vocabulary
- **THEN** add fails without creating an item and reports the invalid target plus a concrete fix

### Requirement: Queue commands provide stable machine contracts
**ID:** queue-json-contracts
The add, list, show, approve, cancel, claim, heartbeat, and finish commands SHALL support JSON output. Successful output SHALL use a stable result envelope carrying `queueItem` or `queueItems`, resolved root, and status entries; failed output SHALL remain valid JSON, use a nonzero exit status, and carry stable error code, message, target, and fix without mixing prose into stdout. Control commands and runner commands SHALL use separate capabilities; claim, heartbeat, and finish SHALL have no approval-mutation operation.

#### Scenario: List JSON is complete and deterministic
**ID:** list-json-deterministic
- **WHEN** an agent requests `specbase queue list --json`
- **THEN** it receives deterministically ordered queue items and the resolved root in valid JSON

#### Scenario: Mutation failure stays machine-readable
**ID:** mutation-failure-json
- **WHEN** a JSON queue mutation cannot proceed
- **THEN** stdout remains valid JSON with an actionable status entry and the command exits nonzero

### Requirement: Readiness comes from governed Specbase state
**ID:** api-derived-readiness
Every queue item SHALL report `ready` or `blocked` readiness with stable blockers and fixes. Readiness SHALL follow the fixed action policy over current idea/change identity, artifact/status/task/strict-validation/coverage APIs and durable results; it SHALL NOT be inferred from activity, queue position, path naming, Git state, or human-formatted command output.

#### Scenario: Apply waits for planning gates
**ID:** apply-readiness-from-status
- **WHEN** an `apply` item is inspected
- **THEN** it is ready only when the work's reported apply requirements are complete and implementation tasks remain

#### Scenario: Later workflow actions use current Specbase state
**ID:** delivery-readiness-from-results
- **WHEN** `verify` or `archive` readiness is inspected
- **THEN** it is derived from current typed task and governed gate results for the same immutable work
- **AND** unmet prerequisites are named with a Specbase-owned next action

#### Scenario: Archive uses strict gates
**ID:** archive-readiness-from-gates
- **WHEN** an `archive` item is inspected
- **THEN** it is ready only when tasks are complete and strict validation/coverage gates report ready

### Requirement: Queue lifecycle and results survive restart
**ID:** durable-queue-lifecycle
Items SHALL use the lifecycle states `queued`, `running`, `blocked`, `succeeded`, `failed`, and `cancelled`. Every claim SHALL create a durable attempt, and every finish SHALL append a durable structured result with outcome, summary, evidence references, and timing. Restart SHALL preserve items, attempts, cancellation, local-intent records, leases, and results without storing credentials or project file contents.

#### Scenario: Restart preserves a finished result
**ID:** restart-preserves-result
- **WHEN** the process restarts after an item finishes
- **THEN** show/list return the same lifecycle, attempts, local-intent state, and latest result

#### Scenario: Invalid durable state is actionable
**ID:** corrupt-state-fails-safely
- **WHEN** the local queue state does not match its strict versioned schema
- **THEN** queue commands refuse mutation and identify the state file and repair/removal action

### Requirement: Leases and idempotency prevent duplicate ownership
**ID:** lease-and-idempotency
Claim SHALL atomically grant at most one unexpired lease for an item, and only its runner/token may heartbeat or finish it. A repeated add with the same repository, work ID, action, and caller idempotency key SHALL return the original item. A succeeded item SHALL NOT be claimed again.

#### Scenario: Competing claims have one winner
**ID:** one-claim-wins
- **WHEN** two runners concurrently claim the same ready approved item
- **THEN** exactly one receives the lease and the other receives an actionable conflict

#### Scenario: Duplicate add returns the original
**ID:** duplicate-add-is-idempotent
- **WHEN** add is repeated with the same idempotency scope
- **THEN** no second item is created and the original stable item is returned

### Requirement: Cancellation and interruption recover explicitly
**ID:** cancellation-and-recovery
Cancelling queued or blocked work SHALL durably cancel it. Cancelling running work SHALL durably request cancellation for the lease holder to honor at a safe boundary. An expired lease SHALL append an interrupted attempt and block the item with action-specific inspection/recovery guidance unless a durable result already determines the outcome. Reconciliation SHALL be a control-lane mutation and SHALL NOT promise exactly-once agent or filesystem effects.

#### Scenario: Running cancellation is cooperative
**ID:** running-cancel-request
- **WHEN** a user cancels a running item
- **THEN** the item records a cancellation request
- **AND** the lease holder reports cancelled at its next safe boundary

#### Scenario: Safe interruption can return to queue
**ID:** safe-expiry-recovers
- **WHEN** an interrupted attempt is inspected and a control-lane reconciliation records that no completed action result exists
- **THEN** the interrupted attempt remains recorded and the item may return to readiness evaluation

#### Scenario: Uncertain action blocks retry
**ID:** uncertain-outcome-blocks
- **WHEN** a lease expires or runner fails without enough durable evidence to determine the named action's outcome
- **THEN** the item becomes blocked with inspection/reconciliation steps and cannot be claimed automatically

### Requirement: Execution requires exact explicit local operator intent
**ID:** explicit-consequential-approval
Every queued action SHALL require a current local-intent record that exactly matches repository, immutable work ID, queue item, and action. Intent MAY be recorded or revoked only through the control capability. Wildcards, environment credentials, prior actions, queue order, activity, and agent/session identity SHALL NOT imply intent. Claim and the runner's pre-action check SHALL observe intent, but the runner execution capability SHALL NOT create or mutate it. The product SHALL describe this as explicit local operator intent, not authentication, authorization, identity proof, credential protection, or a security boundary; local CLI possession and filesystem access are trusted.

#### Scenario: An unapproved item is blocked
**ID:** missing-approval-blocks
- **WHEN** an item lacks exact current local operator intent
- **THEN** readiness/claim is blocked and the output names the separate control command that can approve that item and action

#### Scenario: Mismatched or wildcard approval is rejected
**ID:** broad-approval-rejected
- **WHEN** a local-intent record does not exactly match all required fields or contains a wildcard
- **THEN** it grants no intent and the action does not start

#### Scenario: Approval is rechecked before action
**ID:** approval-rechecked
- **WHEN** local intent is revoked or no longer matches after claim but before the named action starts
- **THEN** the runner records a blocked/failed result without executing the action
- **AND** the runner cannot restore approval through its execution capability
