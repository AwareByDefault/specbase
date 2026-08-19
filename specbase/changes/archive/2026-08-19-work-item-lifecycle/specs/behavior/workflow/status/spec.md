---
id: behavior.workflow.status
---

## ADDED Requirements

### Requirement: Status reports a derived lifecycle state
**ID:** lifecycle-state-reporting
The system SHALL derive and report a change's lifecycle position as one of
`proposed`, `enforcement`, `ready-to-apply`, `implementing`, `reviewing`, or
`archived`, computed on read from the change's artifacts, task completion, a
review-completion footprint, and the archive location. The system SHALL NOT
read a stored lifecycle state field: the position SHALL be derived from reality
every time it is reported, so it cannot drift from the artifacts that define it.

#### Scenario: A ready change reports ready-to-apply
**ID:** lifecycle-ready-to-apply
- **WHEN** every apply-required artifact is present and no apply has begun
- **THEN** the reported lifecycle state is `ready-to-apply`

#### Scenario: A change resting between feature and enforcement
**ID:** lifecycle-proposed
- **WHEN** the feature artifacts are present but the enforcement and testing
  sections remain TO-BE-FILLED
- **THEN** the reported lifecycle state is `proposed`

#### Scenario: The enforcement pass has begun
**ID:** lifecycle-enforcement
- **WHEN** the enforcement write has begun but does not yet meet the apply gate
- **THEN** the reported lifecycle state is `enforcement`

#### Scenario: A reviewed change is distinguished by its footprint
**ID:** lifecycle-reviewing
- **WHEN** all tasks are done and `validate --strict` is green and the review
  panel has recorded a completion footprint
- **THEN** the reported lifecycle state is `reviewing`

#### Scenario: A change whose directory lives in the archive
**ID:** lifecycle-archived
- **WHEN** the change's directory is under `changes/archive/<date>-<id>/`
- **THEN** the reported lifecycle state is `archived`

#### Scenario: The state is never read from a stored field
**ID:** lifecycle-not-stored
- **WHEN** a lifecycle state is reported
- **THEN** it is computed from the artifacts, tasks, footprint, and location on
  read, and a stored `state` value is never the source of truth

## MODIFIED Requirements

### Requirement: Status reports the state of every artifact in a change
**ID:** status-reports-artifact-states
The system SHALL report, for a named change, each artifact in build order as
done, ready, or blocked, together with its output path, the dependencies a
blocked artifact is still waiting on, and a count of how many artifacts are
complete. A change with no artifacts written yet SHALL be reported the same way.
The per-artifact view SHALL be reported alongside the derived lifecycle state, not
replaced by it.

#### Scenario: Every state is distinguished
**ID:** status-shows-three-states
- **WHEN** a user asks for the status of a change
- **THEN** completed artifacts are shown as done, artifacts whose dependencies are
  all met are shown as ready, and the rest are shown as blocked

#### Scenario: A blocked artifact names what it waits on
**ID:** status-names-missing-deps
- **WHEN** an artifact is blocked
- **THEN** the report names the dependencies that are still missing

#### Scenario: Each artifact shows where it will be written
**ID:** status-shows-output-paths
- **WHEN** status is reported
- **THEN** each artifact carries its output path

#### Scenario: Completion is summarised
**ID:** status-shows-completion-summary
- **WHEN** status is reported
- **THEN** the output states how many of the change's artifacts are complete

#### Scenario: A change with nothing written yet
**ID:** status-on-empty-change
- **WHEN** a user asks for the status of a change whose directory holds no artifacts
- **THEN** every artifact is still listed, with the dependency-free ones ready and
  the rest blocked