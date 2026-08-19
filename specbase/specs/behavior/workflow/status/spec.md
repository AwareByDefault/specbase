---
id: behavior.workflow.status
---

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

### Requirement: Artifact completion is read from files on disk
**ID:** completion-read-from-disk
The system SHALL decide whether an artifact is complete by looking for the files
its output pattern names, treating a pattern that matches at least one file as
complete and one that matches none as incomplete.

#### Scenario: A single named file
**ID:** single-file-completion
- **WHEN** an artifact writes one named file and that file exists
- **THEN** the artifact counts as complete
- **AND** when the file is absent, the artifact does not

#### Scenario: A pattern matching many files
**ID:** glob-completion
- **WHEN** an artifact writes a pattern such as a directory of specs and at least
  one matching file exists
- **THEN** the artifact counts as complete
- **AND** when the directory is empty, missing, or holds only non-matching files,
  the artifact does not

#### Scenario: The change directory does not exist
**ID:** missing-change-dir-state
- **WHEN** the change directory is absent
- **THEN** no artifact counts as complete

### Requirement: Status is the surface that says what to do next
**ID:** next-work-from-status
The system SHALL let a user or an agent determine the next artifact to create
from the status report alone, without a separate next-artifact command.

#### Scenario: Ready artifacts are the next work
**ID:** ready-artifacts-are-next
- **WHEN** a user or agent needs to know which artifact to create next
- **THEN** the artifacts the status report marks ready are that answer
- **AND** no other command is needed to continue the workflow

### Requirement: Machine-readable status carries enough context to act
**ID:** status-machine-context
The system SHALL emit, alongside the change name, resolved schema, completion
flag, artifact list, and the artifact IDs that gate implementation, plain-language
next steps and an action context that tells an agent where the change lives —
so no consumer needs to guess at filesystem layout. For a governed project it
SHALL also carry the resolved spec model.

#### Scenario: Core planning fields
**ID:** status-core-fields
- **WHEN** machine-readable status is requested for a change
- **THEN** it carries the change name, the resolved schema name, whether the
  change is complete, the artifact list, and the artifact IDs required before
  implementation

#### Scenario: Next steps in plain language
**ID:** status-next-steps
- **WHEN** machine-readable status is requested
- **THEN** it carries next-step guidance written as plain actions

#### Scenario: Action context replaces filesystem guesswork
**ID:** status-action-context
- **WHEN** machine-readable status is requested for a change held in the repository
- **THEN** it reports the planning home and change root the agent should act
  against, and the artifact statuses are unchanged by carrying them

#### Scenario: Governed projects carry the resolved spec model
**ID:** status-spec-model
- **WHEN** machine-readable status is requested under a governed schema
- **THEN** it also carries the resolved spec model
- **AND** under a non-governed schema the output is unchanged

### Requirement: Status treats "no changes yet" as a normal state
**ID:** status-empty-is-not-an-error
The system SHALL, when no change is named and the project holds no changes at
all, report that plainly and succeed, rather than failing.

#### Scenario: Nothing to report, human output
**ID:** empty-status-human
- **WHEN** a user asks for status without naming a change and the project holds
  no changes
- **THEN** the output says there are no active changes and tells the user how to
  create one, and the command succeeds

#### Scenario: Nothing to report, machine output
**ID:** empty-status-machine
- **WHEN** machine-readable status is requested without naming a change and the
  project holds no changes
- **THEN** the output is a valid empty result carrying that message, and the
  command succeeds

### Requirement: Status still fails on genuine resolution errors
**ID:** status-errors-preserved
The system SHALL keep failing when a change cannot be resolved: when changes
exist but none was named, and when the named change does not exist. Other
commands' handling of a missing change SHALL be unaffected.

#### Scenario: Changes exist but none was named
**ID:** unnamed-change-with-changes-present
- **WHEN** a user asks for status without naming a change and the project holds
  one or more changes
- **THEN** the command fails and lists the available changes

#### Scenario: The named change does not exist
**ID:** named-change-missing
- **WHEN** a user asks for status of a change that does not exist
- **THEN** the command fails and says so, listing the available changes

#### Scenario: Other commands are untouched
**ID:** other-commands-unaffected
- **WHEN** another command that needs a change is run with none available
- **THEN** it fails exactly as it did before, with no graceful-exit behaviour

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
