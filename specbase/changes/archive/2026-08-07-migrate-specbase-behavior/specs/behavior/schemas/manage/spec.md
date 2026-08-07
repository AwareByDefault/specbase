---
id: behavior.schemas.manage
---

## ADDED Requirements

### Requirement: Forking a schema copies it into the project under a new name
**ID:** fork-copies-schema
The system SHALL provide `schema fork <source> [name]`, which copies the named
source schema into the project's schemas directory, renames the copy inside its
own `schema.yaml`, and reports the source and destination paths. Omitting the
name SHALL append a `-custom` suffix to the source name.

#### Scenario: Fork with an explicit name
**ID:** fork-explicit-name
- **WHEN** a user forks `spec-driven` as `my-custom`
- **THEN** the schema is copied to the project's `schemas/my-custom/`
- **AND** the copy's `name` field reads `my-custom`

#### Scenario: Fork without a name
**ID:** fork-default-name
- **WHEN** a user forks `spec-driven` without naming the destination
- **THEN** the copy is created as `spec-driven-custom` and its `name` field matches

#### Scenario: Source schema does not exist
**ID:** fork-source-missing
- **WHEN** a user forks a name that resolves to no schema
- **THEN** the command fails and lists the schemas that are available

### Requirement: Forking never silently overwrites an existing schema
**ID:** fork-overwrite-guard
The system SHALL refuse to write over an existing destination schema unless the
user passes `--force` or confirms the overwrite when prompted.

#### Scenario: Destination exists and no force flag is given
**ID:** fork-blocked-by-existing
- **WHEN** a user forks into a destination that already exists, without `--force`
- **THEN** the command fails, says the destination exists, and points at `--force`

#### Scenario: Force replaces the destination
**ID:** fork-force-replaces
- **WHEN** a user forks into an existing destination with `--force`
- **THEN** the existing destination is removed and replaced by the fresh copy

#### Scenario: Confirmed overwrite
**ID:** fork-confirmed-overwrite
- **WHEN** a user forks into an existing destination and is prompted to confirm
- **THEN** the overwrite proceeds only on an affirmative answer

### Requirement: A fork carries the whole schema directory
**ID:** fork-preserves-files
The system SHALL copy every file in the source schema directory, including
templates and nested directories, with file contents unchanged.

#### Scenario: Template files come along
**ID:** fork-copies-templates
- **WHEN** a user forks a schema that ships template files
- **THEN** every template file is present in the copy with identical content

#### Scenario: Nested directories are preserved
**ID:** fork-copies-nested-dirs
- **WHEN** a user forks a schema whose templates live in nested directories
- **THEN** the nested directory structure and all its files are reproduced

### Requirement: Initialising a schema scaffolds a usable project-local schema
**ID:** init-creates-schema
The system SHALL provide `schema init <name>`, which creates a project-local
schema directory containing a valid `schema.yaml` with name, version,
description, and artifacts, plus a template file for every declared artifact.

#### Scenario: Valid name creates the scaffold
**ID:** init-scaffolds-files
- **WHEN** a user initialises a schema named `my-workflow`
- **THEN** the project-local `schemas/my-workflow/` directory is created with a
  parseable `schema.yaml` and one template file per declared artifact

#### Scenario: Name is not kebab-case
**ID:** init-rejects-bad-name
- **WHEN** a user initialises a schema whose name contains a space, an uppercase
  letter, or an underscore
- **THEN** the command fails and states the kebab-case requirement

#### Scenario: Name already taken
**ID:** init-rejects-existing
- **WHEN** a user initialises a schema whose project-local directory already exists
- **THEN** the command fails and points at `--force` or at forking instead

### Requirement: A newly initialised schema can become the project default
**ID:** init-sets-default
The system SHALL offer to record the new schema as the project's default, and
SHALL write that default into the project config only when the user asks for it.

#### Scenario: Default requested
**ID:** init-default-requested
- **WHEN** a user initialises a schema and asks for it to be the project default
- **THEN** the project config records that schema as the default

#### Scenario: Default declined
**ID:** init-default-declined
- **WHEN** a user initialises a schema and declines the default
- **THEN** the project config is left unmodified

### Requirement: Listing schemas shows project-local schemas and labels each source
**ID:** listing-shows-source
The system SHALL include project-local schemas when listing available schemas,
list each name exactly once even when it shadows a same-named schema elsewhere,
and label every entry with the location it resolved from — project, user, or
package.

#### Scenario: Project-local schema appears in the list
**ID:** list-includes-project-local
- **WHEN** a schema exists only in the project's schemas directory
- **THEN** it appears in the listing labelled as a project schema

#### Scenario: A shadowed name is listed once
**ID:** list-dedupes-shadowed
- **WHEN** the same schema name exists project-local and in the user directory
- **THEN** the listing contains that name exactly once, labelled as project

#### Scenario: User and package schemas are labelled too
**ID:** list-labels-user-and-package
- **WHEN** a schema exists only in the user directory, and another only as a
  packaged built-in
- **THEN** the listing labels them as user and package respectively

### Requirement: Validating a schema reports every structural fault it finds
**ID:** validate-schema-structure
The system SHALL provide `schema validate [name]`, which checks the resolved
schema's `schema.yaml` for parse errors and for missing or malformed required
fields, and reports each fault with the offending location. Omitting the name
SHALL validate every project-local schema and fail if any one of them is invalid.

#### Scenario: Named schema is checked
**ID:** validate-named-schema
- **WHEN** a user validates a named schema
- **THEN** the command reports either that the schema is valid or the list of faults

#### Scenario: All project schemas are checked
**ID:** validate-all-project-schemas
- **WHEN** a user validates without naming a schema
- **THEN** every project-local schema is checked and a result is reported for each
- **AND** the command fails if any of them is invalid

#### Scenario: Unparseable file
**ID:** validate-parse-error
- **WHEN** a schema's `schema.yaml` cannot be parsed
- **THEN** the command reports the parse error, with a line number where one is available

#### Scenario: Required field missing
**ID:** validate-missing-field
- **WHEN** a schema parses but omits a required field such as its name
- **THEN** the command reports the specific missing field

#### Scenario: Schema does not exist
**ID:** validate-schema-missing
- **WHEN** a user validates a name that resolves to no schema
- **THEN** the command fails and says the schema was not found

### Requirement: Validation confirms every referenced template exists
**ID:** validate-template-existence
The system SHALL check that the template file each artifact names is present in
the schema directory, and SHALL name both the missing template and the artifact
that referenced it.

#### Scenario: Referenced template is absent
**ID:** validate-missing-template
- **WHEN** an artifact names a template file that the schema directory does not contain
- **THEN** validation fails and names both the template file and the artifact

#### Scenario: All templates present
**ID:** validate-templates-present
- **WHEN** every artifact's template file exists
- **THEN** template existence is reported as passing in the validation summary

### Requirement: Validation rejects cyclic and dangling artifact dependencies
**ID:** validate-dependency-graph
The system SHALL reject a schema whose artifact dependencies contain a cycle or
reference an artifact the schema does not declare, and SHALL name the artifacts
involved.

#### Scenario: Cycle in the dependency graph
**ID:** validate-cycle
- **WHEN** two artifacts require each other
- **THEN** validation fails and names the artifacts in the cycle

#### Scenario: Dependency on an undeclared artifact
**ID:** validate-dangling-reference
- **WHEN** an artifact requires a name the schema does not declare
- **THEN** validation fails and names the unknown dependency

#### Scenario: Acyclic graph passes
**ID:** validate-valid-dag
- **WHEN** the artifact dependencies form an acyclic graph
- **THEN** validation reports the dependency graph as valid

### Requirement: Verbose validation narrates each check
**ID:** validate-verbose
The system SHALL, under `--verbose`, report each validation check as it runs
rather than only the final verdict.

#### Scenario: Verbose run
**ID:** validate-verbose-run
- **WHEN** a user validates a schema with `--verbose`
- **THEN** the output names each check performed — parsing, structure, template
  existence, and dependency graph — as it happens

### Requirement: The which command reports where a schema resolved from and what it hides
**ID:** which-reports-resolution
The system SHALL provide `schema which <name>`, which reports the location the
name resolved from, the full path to that directory, and every same-named schema
at a lower-priority location that it shadows, in priority order.

#### Scenario: Resolution location and path
**ID:** which-shows-location
- **WHEN** a user asks where a schema resolves from
- **THEN** the command names the location — project, user, or package — and the
  full path to the resolved schema directory

#### Scenario: A shadowing schema names what it hides
**ID:** which-shows-shadowed
- **WHEN** the resolved schema shadows same-named schemas at lower priority
- **THEN** the command says the resolved copy is active and lists every shadowed
  location and path in priority order

#### Scenario: Nothing shadowed
**ID:** which-no-shadowing
- **WHEN** the name exists in only one location
- **THEN** the command reports no shadowing

#### Scenario: Name resolves to nothing
**ID:** which-not-found
- **WHEN** a user asks about a name that resolves to no schema
- **THEN** the command fails and lists the schemas that are available

### Requirement: The which command can survey every schema at once
**ID:** which-list-mode
The system SHALL support a list mode on `schema which` that reports every
available schema grouped by the location it resolves from, marking which ones
shadow others.

#### Scenario: Survey all schemas
**ID:** which-all-schemas
- **WHEN** a user runs the which command in list mode
- **THEN** every available schema is reported, grouped by resolution location,
  with shadowing marked
