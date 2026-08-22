---
id: agents.delivery-runner
---

## Purpose

Define the repo-owned runner instrument that performs one approved Specbase queue action through a durable claim and result protocol.

## ADDED Requirements

### Requirement: The delivery-runner skill follows the durable claim protocol
**ID:** runner-claim-protocol
The repo SHALL ship `.pi/skills/specbase-delivery-runner/SKILL.md` as the delivery-runner instrument. It SHALL direct an agent to claim exactly one queue item through machine-readable CLI output, retain the item/runner/lease/operation identities, heartbeat while work continues, and finish through the queue protocol with structured outcome and evidence.

#### Scenario: One invocation owns one item
**ID:** runner-claims-one-item
- **WHEN** the skill starts a queue run
- **THEN** it claims one explicit ready item and records the returned lease and operation identity
- **AND** it does not claim or enqueue a successor action during that run

#### Scenario: Every run closes its attempt
**ID:** runner-finishes-attempt
- **WHEN** the named action succeeds, fails, blocks, or is cancelled
- **THEN** the skill directs the agent to finish the active attempt with the matching outcome, summary, and evidence references

### Requirement: The runner executes only the claimed Specbase action
**ID:** runner-action-boundary
The skill SHALL direct the agent to resolve the claimed immutable work ID and execute only the item's named `explore`, `propose`, `apply`, `verify`, or `archive` action through existing Specbase CLI/workflow surfaces. It SHALL refuse mismatched roots, work IDs, actions, stages, leases, and unsupported context, and SHALL NOT invent a workflow chain, arbitrary shell workflow, commit, push, merge, or deploy action.

#### Scenario: A mismatched claim is refused
**ID:** runner-refuses-mismatch
- **WHEN** resolved repository/work context does not match the claimed item
- **THEN** the runner records an actionable blocked/failed result without executing the action

#### Scenario: Completion does not start the next stage
**ID:** runner-does-not-chain
- **WHEN** the claimed action succeeds
- **THEN** the runner records success and stops
- **AND** it does not infer or launch the next action

### Requirement: The runner observes intent and cancellation without mutating approval
**ID:** runner-safety-checks
Before starting any named action, the skill SHALL require the queue's current exact local operator-intent result. It SHALL describe intent as a local operator request rather than authentication or security approval. The runner lane SHALL NOT invoke `queue approve`, revoke intent, or receive an approval-mutation capability. It SHALL check cancellation at safe boundaries, avoid starting new work after cancellation, and report an interrupted/uncertain result for control-lane reconciliation rather than retrying automatically.

#### Scenario: Approval disappears before action
**ID:** runner-stops-on-approval-loss
- **WHEN** exact local intent is absent at the pre-action check
- **THEN** the runner does not perform the named action and records the blocker
- **AND** it does not attempt to approve the item

#### Scenario: Cancellation stops at a safe boundary
**ID:** runner-honors-cancellation
- **WHEN** the queue reports cancellation requested
- **THEN** the runner stops before starting the next unit of work and finishes the attempt as cancelled

#### Scenario: Ambiguous effect is reported
**ID:** runner-reports-uncertainty
- **WHEN** the runner cannot determine whether the named Specbase action completed
- **THEN** it reports an uncertain result with available evidence and does not retry
