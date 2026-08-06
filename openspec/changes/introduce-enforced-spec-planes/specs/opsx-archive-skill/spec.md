## MODIFIED Requirements

### Requirement: Artifact Completion Check
The skill SHALL check schema-defined artifact completion and governed pair readiness before archiving.

#### Scenario: Incomplete planning artifacts
- **WHEN** required planning artifacts are incomplete
- **THEN** display them and follow the schema's existing confirmation policy

#### Scenario: Incomplete governed enforcement
- **WHEN** governed pairs contain missing, planned, stale, hanging, broken, or failing mandatory enforcement
- **THEN** block ordinary archive readiness
- **AND** direct the user to `/opsx:verify` or the explicit validation-bypass command
- **AND** do not treat interactive confirmation as enforcement evidence

#### Scenario: Governed artifacts ready
- **WHEN** planning artifacts are complete and governed verification passes
- **THEN** proceed without an enforcement warning

### Requirement: Spec Sync Prompt
The skill SHALL assess schema-defined current-spec updates before archive and treat governed specification and enforcement deltas as an inseparable pair.

#### Scenario: Legacy delta specs exist
- **WHEN** a legacy change has delta specs
- **THEN** retain the existing legacy sync choice

#### Scenario: Governed delta pairs exist
- **WHEN** a governed change has complete paired deltas
- **THEN** show one combined summary of normative, binding, and retired-target operations
- **AND** invoke pair-aware governed synchronization when proceeding

#### Scenario: Governed pair is incomplete
- **WHEN** only one member of a governed delta pair exists
- **THEN** report a blocking validation error rather than offer partial synchronization

### Requirement: Archive Process
The skill SHALL archive through the schema-aware CLI path so pair validation, current-state updates, root selection, and bypass reporting remain authoritative.

#### Scenario: Successful governed archive
- **WHEN** governed verification and synchronization succeed
- **THEN** invoke the archive command for the selected change
- **AND** report the dated archive location, updated locators, enforcement status, and cleanup candidates

#### Scenario: Explicit governed bypass
- **WHEN** the user deliberately chooses the supported validation bypass
- **THEN** invoke the CLI with required confirmation flags
- **AND** report that the archive was not fully verified
