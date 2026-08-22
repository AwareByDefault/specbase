---
id: behavior.api.action-catalog
---

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

### Requirement: Consumers can record a confirmed pull-request result
**ID:** `record-draft-pr-result`
The supported package API SHALL accept only an exact canonical review-delivery action identity and schema-valid pull-request observation, preserve existing change metadata, and project Reviewing only when the observation confirms the pull request is ready for human review.

#### Scenario: Confirmed ready pull request is recorded
**ID:** `confirmed-draft-recorded`
- **WHEN** an autonomous client submits the exact repository, base, head, verified commit, pull-request number, URL, run identity, and ready state for the canonical review-delivery action
- **THEN** Specbase records the descriptor without performing a remote operation
- **AND** refreshed lifecycle and board cards present Reviewing with that link

#### Scenario: Malformed or conflicting result is rejected
**ID:** `malformed-draft-result-rejected`
- **WHEN** the action identity or pull-request observation is malformed, stale, or conflicts with an accepted observation
- **THEN** Specbase records no result and returns a stable diagnostic

### Requirement: Invalid targets and actions fail predictably
**ID:** `action-catalog-diagnostics`
The supported package API SHALL return stable machine diagnostics that identify the requested target or action and a concrete remediation when a work-item ID is unresolved or ambiguous, an action ID is unknown, or a catalog version is unsupported.

#### Scenario: Unknown action is requested
**ID:** `unknown-action-diagnostic`
- **WHEN** a consumer validates an action ID outside the supported catalog version
- **THEN** validation rejects it with the unknown action ID and the supported catalog version

### Requirement: Ready work exposes one delivery-to-review capability
**ID:** `ready-to-review-capability`
The current action catalog SHALL expose one typed autonomous capability that takes canonically Ready or in-progress work toward a pull request ready for human review and SHALL not require the client to chain local and remote workflow names.

#### Scenario: Ready change can be delivered
**ID:** `ready-change-delivery-action`
- **WHEN** a governed change has complete feature and enforcement planning and remains eligible for implementation
- **THEN** the catalog makes Deliver to human review available with immutable target arguments

#### Scenario: Delivery intent becomes stale
**ID:** `delivery-action-revalidated`
- **WHEN** planning, lifecycle, or target identity changes before dispatch
- **THEN** exact intent validation rejects the stale action with current remediation

### Requirement: Reviewing work exposes human-review actions
**ID:** `reviewing-action-set`
The current action catalog SHALL offer a Reviewing card typed actions to address pull-request feedback, explore requested rework with pull-request context, and archive by explicit human choice.

#### Scenario: Human review requests implementation fixes
**ID:** `review-feedback-capability`
- **WHEN** a Reviewing card retains a ready pull-request observation
- **THEN** the catalog exposes an autonomous feedback capability bound to that immutable change and pull request

#### Scenario: Human wants to reconsider implementation
**ID:** `review-feedback-explore-action`
- **WHEN** a Reviewing card retains a ready pull-request observation
- **THEN** the catalog exposes a conversational Explore action carrying change and pull-request identity

#### Scenario: Human chooses archive
**ID:** `reviewing-archive-remains-human`
- **WHEN** canonical archive prerequisites other than remote approval or merge are satisfied
- **THEN** Archive remains an explicit human-controlled action
