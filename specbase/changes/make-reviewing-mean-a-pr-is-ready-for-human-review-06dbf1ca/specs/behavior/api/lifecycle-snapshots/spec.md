---
id: behavior.api.lifecycle-snapshots
---

## Purpose

Lifecycle snapshots distinguish automated preparation from the human-review queue so clients can act on a card without inferring remote state.

## ADDED Requirements

### Requirement: Reviewing represents a pull request ready for human review
**ID:** `reviewing-requires-ready-pr`
The supported lifecycle API SHALL derive Reviewing only for completed active work with a canonically recorded pull request confirmed ready for human review; panel audit and draft pull-request observations SHALL remain non-transitional.

#### Scenario: Review panel finishes before remote delivery
**ID:** `panel-audit-does-not-transition`
- **WHEN** completed work has a panel review timestamp but no ready pull request
- **THEN** its lifecycle remains Implementing

#### Scenario: Draft pull request is recorded
**ID:** `draft-pr-does-not-transition`
- **WHEN** completed work has an exact open draft pull-request observation
- **THEN** the snapshot exposes that observation without assigning Reviewing

#### Scenario: Pull request is ready
**ID:** `ready-pr-transitions-reviewing`
- **WHEN** completed work has an exact pull-request observation confirmed ready for human review
- **THEN** the lifecycle is Reviewing
- **AND** the snapshot exposes the pull-request link

### Requirement: Pull-request observations remain versioned lifecycle data
**ID:** `pull-request-observation-projection`
The supported lifecycle snapshot SHALL expose a schema-valid pull-request descriptor with repository, branch, commit, number, URL, run identity, and readiness state when Specbase has accepted that observation.

#### Scenario: Archived work retains review reference
**ID:** `archive-retains-pr-reference`
- **WHEN** work with a recorded pull request is archived
- **THEN** its archived snapshot retains the confirmed pull-request descriptor
