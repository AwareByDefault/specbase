---
id: architecture.delivery-queue
---

## Purpose

Define durable queue identity, state, readiness, approval separation, leases, and recovery for local Specbase workflow execution.

## ADDED Requirements

### Requirement: Queue identity is independent of mutable paths
**ID:** immutable-queue-identity
The queue domain SHALL persist repository identity, immutable idea/change metadata ID, queue item ID, fixed Specbase action, and stage as identity. Path resolution SHALL occur through existing root/work resolvers at command time; directory names and current paths SHALL remain replaceable location data rather than identity.

#### Scenario: A lifecycle move keeps the reference
**ID:** work-move-keeps-reference
- **WHEN** a referenced work item moves between its allowed idea/change/archive locations without changing metadata ID
- **THEN** the queue reference still resolves as the same work and no queue item is rewritten to a directory-derived ID

### Requirement: State transitions are strict and durable
**ID:** durable-state-machine
A strict versioned state machine SHALL validate every queue mutation under one local lock and persist it atomically. Attempt and result history SHALL be append-only, illegal transitions SHALL fail without partial writes, and serialization SHALL be deterministic.

#### Scenario: Illegal finish cannot partially write
**ID:** illegal-transition-atomic
- **WHEN** a runner without the active lease attempts to finish an item
- **THEN** the mutation fails and item lifecycle, lease, attempts, and results remain byte-equivalent

#### Scenario: Reload reproduces state
**ID:** durable-reload
- **WHEN** persisted state is read after process restart
- **THEN** strict parsing reproduces the same validated queue domain or reports an actionable corrupt-state error

### Requirement: Readiness depends on typed Specbase APIs
**ID:** typed-readiness-adapter
Readiness SHALL consume typed idea/change identity, artifact status, task progress, validation/coverage gate, root, and immutable-ID resolver APIs through an adapter. Queue core SHALL NOT invoke or parse human-formatted CLI output, inspect V2 activity or Git state, or duplicate artifact-graph parsing. The fixed vocabulary SHALL be `explore`, `propose`, `apply`, `verify`, and `archive`; arbitrary and Git-delivery actions SHALL fail schema validation.

#### Scenario: Human wording cannot change readiness
**ID:** readiness-ignores-human-output
- **WHEN** human command formatting changes but typed Specbase inputs remain the same
- **THEN** queue readiness and blockers remain identical

### Requirement: Lease ownership is atomic and clock-injected
**ID:** atomic-lease-ownership
Claim, heartbeat, expiry, cancellation request, and finish SHALL be transitions under the queue lock using injected time. At most one unexpired lease token SHALL own an item, and only that token SHALL mutate its running attempt.

#### Scenario: Expiry is deterministic
**ID:** lease-expiry-injected-time
- **WHEN** a fixed clock crosses a lease expiry boundary
- **THEN** reconciliation produces the defined interrupted transition without sleeps or ambient-time races

### Requirement: Idempotency covers creation and execution identity
**ID:** layered-idempotency
The queue SHALL index caller idempotency by repository, work ID, action, and caller key, and SHALL assign a stable operation key to the item's execution. Duplicate creation SHALL resolve to one item, successful execution SHALL be terminal, and any reconciled retry SHALL retain the existing operation key and prior attempt history.

#### Scenario: Retry keeps operation identity
**ID:** retry-keeps-operation-key
- **WHEN** a control-lane reconciliation permits an interrupted item to be reclaimed
- **THEN** its new attempt receives the same stable operation key while retaining prior attempt history

### Requirement: Uncertain outcomes form an explicit recovery boundary
**ID:** uncertain-outcome-boundary
The queue SHALL NOT infer success or safe retry when an agent attempt ends without a durable result. It SHALL transition the item to blocked, retain evidence and operation identity, and require a control-capability reconciliation before any further claim. This boundary SHALL NOT claim transactionally exactly-once agent or filesystem execution.

#### Scenario: Ambiguous action is not auto-retried
**ID:** ambiguous-push-blocked
- **WHEN** an action attempt loses its lease without enough durable evidence to determine its outcome
- **THEN** reconciliation blocks the item and instructs inspection of the work state before a control-lane result is recorded

### Requirement: Local intent and runner execution use separate capabilities
**ID:** approval-policy-boundary
Exact local operator intent SHALL enter through a control capability matching repository/work/item/action. Runner handlers and the delivery-runner instrument SHALL receive a separate execution capability that can inspect intent, claim, heartbeat, observe cancellation, and finish but cannot approve, revoke, or otherwise mutate intent. Local CLI possession and queue-file access SHALL be the trust boundary; the architecture SHALL NOT present this separation as authentication, authorization, identity proof, privilege isolation, or credential security.

#### Scenario: Authority inputs are explicit
**ID:** approval-provider-only-authority
- **WHEN** a queue item has environment credentials, prior results, or an agent identity but no exact control-lane local-intent record
- **THEN** the runner capability treats it as unapproved
- **AND** exposes no operation that can create approval
