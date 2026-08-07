---
id: behavior.schemas
---

## ADDED Requirements

### Requirement: A change's schema resolves through a fixed precedence order
**ID:** change-schema-precedence
The system SHALL resolve the schema that governs a change in this order, first
match winning: an explicit `--schema` flag, the schema recorded in the change's
own metadata, the planning home's default schema, the project config's `schema`
field, then the built-in default `spec-driven`.

#### Scenario: Explicit flag wins over everything
**ID:** flag-beats-all
- **WHEN** a workflow command runs with `--schema custom` and the change metadata
  and project config both name other schemas
- **THEN** the command uses `custom`

#### Scenario: Change metadata beats project config
**ID:** metadata-beats-config
- **WHEN** a change records `schema: bound` in its metadata and the project config
  names `tdd`
- **THEN** the command uses `bound`

#### Scenario: Project config supplies the schema when the change records none
**ID:** config-supplies-schema
- **WHEN** no flag, change metadata, or planning-home default applies and the
  project config names `tdd`
- **THEN** the command uses `tdd`

#### Scenario: Nothing declared anywhere
**ID:** builtin-default-applies
- **WHEN** no flag, change metadata, planning-home default, or project config
  names a schema
- **THEN** the command uses the built-in default `spec-driven`

### Requirement: A named schema is looked up project-local first
**ID:** schema-lookup-precedence
The system SHALL locate a named schema by searching the project-local schemas
directory, then the user data directory, then the packaged built-ins. The first
location holding that name wins and shadows the rest. With no project in scope,
only the user directory and the packaged built-ins are searched.

#### Scenario: Project-local shadows the user directory
**ID:** project-shadows-user
- **WHEN** a schema named `my-workflow` exists both project-local and in the user
  data directory
- **THEN** the project-local copy resolves

#### Scenario: Project-local shadows a packaged built-in
**ID:** project-shadows-package
- **WHEN** a schema named `spec-driven` exists project-local and also as a
  packaged built-in
- **THEN** the project-local copy resolves

#### Scenario: Falls back down the chain
**ID:** falls-back-through-chain
- **WHEN** a name has no project-local copy but exists in the user data directory
- **THEN** the user copy resolves
- **AND** when it exists in neither, the packaged built-in resolves

#### Scenario: No project in scope
**ID:** lookup-without-project
- **WHEN** a schema is looked up without a project in scope
- **THEN** only the user directory and the packaged built-ins are searched
- **AND** the project-local location is never consulted

### Requirement: A new change is bound to the resolved schema at creation
**ID:** new-change-binds-schema
The system SHALL record the resolved schema in the new change's own metadata
when the change is created, so the change keeps that schema even if the project
default later changes.

#### Scenario: Config default is recorded on the new change
**ID:** new-change-records-config-schema
- **WHEN** a user creates a change with no `--schema` flag and the project config
  names `tdd`
- **THEN** the change is created with schema `tdd` recorded in its metadata

#### Scenario: Flag overrides the project default
**ID:** new-change-flag-overrides
- **WHEN** a user creates a change with `--schema custom` and the project config
  names `tdd`
- **THEN** the change is created with schema `custom`

### Requirement: Changes created before a project declared a schema keep working
**ID:** schema-backwards-compatibility
The system SHALL keep resolving a schema for changes that predate any project
config, and SHALL NOT retroactively rebind a change once its metadata names a
schema.

#### Scenario: Existing change with no project config
**ID:** existing-change-no-config
- **WHEN** a change created before the config feature is opened and no project
  config file exists
- **THEN** the schema resolves from the change's own metadata, or the built-in
  default when it has none

#### Scenario: Config added to a project that already has changes
**ID:** config-added-later
- **WHEN** a project config naming a schema is added to a project with existing
  changes
- **THEN** each existing change continues to use the schema recorded in its own
  metadata
