---
id: behavior.workflow.new-change
---

## ADDED Requirements

### Requirement: Creating a change scaffolds its directory and records its schema
**ID:** new-change-scaffolds
The system SHALL create the named change's directory under the planning home,
creating any missing parent directories, and SHALL record the resolved schema in
the change's own metadata file. Creating a change whose directory already exists
SHALL fail rather than overwrite it.

#### Scenario: A new change is created
**ID:** new-change-created
- **WHEN** a user creates a change with a valid name
- **THEN** the change directory exists under the planning home
- **AND** it carries a metadata file naming the resolved schema

#### Scenario: Parent directories are created as needed
**ID:** new-change-creates-parents
- **WHEN** a user creates the first change in a project whose changes directory
  does not yet exist
- **THEN** the full path is created

#### Scenario: The name is already taken
**ID:** new-change-duplicate-rejected
- **WHEN** a user creates a change whose directory already exists
- **THEN** the command fails and says the change already exists, leaving the
  existing directory untouched

#### Scenario: A description is supplied
**ID:** new-change-with-description
- **WHEN** a user creates a change and supplies a description
- **THEN** the description is written into the new change directory

### Requirement: Change names must be kebab-case
**ID:** change-name-validation
The system SHALL accept a change name only when it is lower-case alphanumeric
segments joined by single hyphens, and SHALL reject the name with guidance
before creating anything.

#### Scenario: Accepted names
**ID:** names-accepted
- **WHEN** a name is a single lower-case word, several such words joined by single
  hyphens, or such a name with a numeric segment
- **THEN** it is accepted

#### Scenario: Rejected names
**ID:** names-rejected
- **WHEN** a name contains an upper-case letter, a space, an underscore, or any
  other special character
- **THEN** it is rejected with a validation message and no directory is created

#### Scenario: Rejected hyphen placement
**ID:** names-rejected-hyphens
- **WHEN** a name starts with a hyphen, ends with a hyphen, or contains two
  consecutive hyphens
- **THEN** it is rejected
- **AND** an empty name is rejected

### Requirement: The propose workflow creates a change and all its artifacts in one step
**ID:** propose-single-step
The system SHALL ship a propose workflow that creates the change — directory and
schema metadata — and then generates every artifact the schema declares, so the
result matches creating the change and then filling it in artifact by artifact.

#### Scenario: A change is proposed from a description
**ID:** propose-from-description
- **WHEN** a user invokes the propose workflow with a description of what they
  want to build
- **THEN** a change is created under a kebab-case name with its schema metadata
- **AND** every artifact the schema declares is generated

#### Scenario: The name is already in use
**ID:** propose-name-in-use
- **WHEN** the proposed name matches an existing change
- **THEN** the workflow asks whether to continue the existing change or pick a
  new name, resuming from the last completed artifact if continuing
- **AND** with no one to ask, it fails and suggests a different name

#### Scenario: Equivalent to the step-by-step route
**ID:** propose-equals-step-by-step
- **WHEN** a user proposes a change
- **THEN** the resulting directory and artifacts are the same as creating the
  change and then generating its artifacts one at a time
- **AND** only the console narration may differ

### Requirement: The propose workflow explains itself as it runs
**ID:** propose-onboarding-narration
The system SHALL have the propose workflow state which artifacts it will create,
report each one as it is created, and name the next workflow to run.

#### Scenario: The plan is stated up front
**ID:** propose-states-plan
- **WHEN** a user invokes the propose workflow
- **THEN** the output names the artifacts that will be created and names the
  workflow to run next to begin implementation

#### Scenario: Progress is reported
**ID:** propose-reports-progress
- **WHEN** each artifact is created
- **THEN** the output reports that artifact as done
