---
id: behavior.api.lifecycle-snapshots
---

### Requirement: Installed consumers can resolve an authoritative lifecycle snapshot
**ID:** `resolve-lifecycle-snapshot`
The supported package API SHALL resolve a work item by immutable ID and return its repository position, derived lifecycle, artifact progress, task progress, and diagnostics in a versioned serializable snapshot.

#### Scenario: An active change is resolved
**ID:** `active-change-resolved`
- **WHEN** an installed consumer requests a valid active-change ID from a planning store
- **THEN** the snapshot identifies the active position and derived lifecycle
- **AND** its artifact and task progress reflect the current store

#### Scenario: An archived change is resolved
**ID:** `archived-change-resolved`
- **WHEN** an installed consumer requests a valid archived work-item ID
- **THEN** the snapshot preserves that immutable ID and reports the archived position and lifecycle

### Requirement: Package and status consumers receive the same lifecycle facts
**ID:** `status-snapshot-parity`
For the same unchanged planning store and work-item ID, the supported package API and `specbase status --json` SHALL report identical lifecycle, position, progress, and diagnostic values.

#### Scenario: A clean-package consumer matches status
**ID:** `clean-package-matches-status`
- **WHEN** a consumer imports the installed package and the CLI reads the same representative fixture
- **THEN** both surfaces report the same lifecycle snapshot facts

### Requirement: Resolution failures are machine-actionable
**ID:** `lifecycle-resolution-diagnostics`
The supported package API SHALL return stable diagnostic codes with the affected immutable ID and a concrete remediation when the ID is missing, unresolved, or ambiguous.

#### Scenario: A missing identity is requested
**ID:** `missing-identity-diagnostic`
- **WHEN** a consumer requests an ID that does not resolve in the selected planning store
- **THEN** the result contains no snapshot
- **AND** its diagnostic identifies the ID and explains how to choose or restore a resolvable work item

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
