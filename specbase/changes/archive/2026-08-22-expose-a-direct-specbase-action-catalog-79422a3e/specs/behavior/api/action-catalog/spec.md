---
id: behavior.api.action-catalog
---

## Purpose

The direct action catalog lets installed clients present and validate canonical next actions for immutable Specbase work without inferring policy or executing the action themselves.

## ADDED Requirements

### Requirement: Consumers can request canonical direct actions
**ID:** `list-direct-actions`
The supported package API SHALL return a versioned, deterministic action catalog for an immutable work-item ID, with each entry carrying stable action identity, label, availability, blocker, remediation, and typed dispatch context.

#### Scenario: Lifecycle makes an action available
**ID:** `lifecycle-action-available`
- **WHEN** current work-item state satisfies a direct action's policy
- **THEN** the catalog marks that canonical action available with no blocker
- **AND** it provides the dispatch context an external client must preserve

#### Scenario: A prerequisite blocks an action
**ID:** `action-blocker-is-actionable`
- **WHEN** current work-item state does not satisfy a known direct action's policy
- **THEN** the catalog marks that action blocked
- **AND** it supplies a stable blocker code and concrete remediation

#### Scenario: Autonomous action names a capability
**ID:** `autonomous-action-names-capability`
- **WHEN** current work-item state allows a separately owned autonomous delivery action
- **THEN** the catalog returns a closed transport-neutral capability identity and structured target arguments
- **AND** it does not expose an RPIV workflow name, command, or executable text

### Requirement: Consumers can validate one exact action intent
**ID:** `validate-direct-action-intent`
The supported package API SHALL validate one intent that exactly identifies the selected store, immutable work item, catalog version, action, and dispatch kind against freshly resolved Specbase state, returning either the canonical dispatch descriptor or stable rejection diagnostics.

#### Scenario: A current exact intent is accepted
**ID:** `current-intent-accepted`
- **WHEN** an intent exactly matches an action that remains available for the freshly resolved target
- **THEN** validation returns that action's canonical dispatch descriptor

#### Scenario: Availability changed after selection
**ID:** `stale-intent-rejected`
- **WHEN** fresh state now blocks an action that was previously available
- **THEN** validation rejects the intent with the current blocker and remediation
- **AND** it returns no dispatch descriptor

#### Scenario: Intent identity is tampered
**ID:** `tampered-intent-rejected`
- **WHEN** the store, work-item, version, action, or dispatch kind does not exactly match the canonical catalog
- **THEN** validation returns a stable mismatch diagnostic and no dispatch descriptor

### Requirement: Consumers can record a confirmed draft result
**ID:** `record-draft-pr-result`
The supported package API SHALL accept only an exact canonical draft-PR action identity and a schema-valid confirmed draft descriptor, preserve existing change metadata, and project the authoritative Reviewing lifecycle with the confirmed pull-request link.

#### Scenario: Confirmed draft is recorded
**ID:** `confirmed-draft-recorded`
- **WHEN** an autonomous client submits the exact repository, base, head, verified commit, draft number, URL, and correlated run identity for the canonical draft-PR action
- **THEN** Specbase records the descriptor without performing a remote operation
- **AND** the refreshed lifecycle and board card present Reviewing with that link

#### Scenario: Malformed result is rejected
**ID:** `malformed-draft-result-rejected`
- **WHEN** the action identity or draft descriptor is malformed or no longer names the canonical target
- **THEN** Specbase records no result and returns a stable diagnostic

### Requirement: Invalid targets and actions fail predictably
**ID:** `action-catalog-diagnostics`
The supported package API SHALL return stable machine diagnostics that identify the requested target or action and a concrete remediation when a work-item ID is unresolved or ambiguous, an action ID is unknown, or a catalog version is unsupported.

#### Scenario: Unknown action is requested
**ID:** `unknown-action-diagnostic`
- **WHEN** a consumer validates an action ID outside the supported catalog version
- **THEN** validation rejects it with the unknown action ID and the supported catalog version
