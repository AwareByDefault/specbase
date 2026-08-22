---
id: behavior.api.action-catalog
---

## Purpose

The action catalog gives clients canonical delivery and human-review affordances while leaving conversations, workflows, Git, and remote review operations to external adapters.

## MODIFIED Requirements

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

## ADDED Requirements

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
