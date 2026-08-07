---
id: behavior.schemas.structure
---

## ADDED Requirements

### Requirement: A schema is one self-contained directory with its templates beside it
**ID:** self-contained-schema-directory
The system SHALL treat a schema as a directory holding a `schema.yaml` and the
template files its artifacts reference, so an artifact resolves its template
relative to its own schema directory and a schema can be moved or copied whole.
Such directories SHALL be recognised in three places: the project's planning
schemas directory, the user's data directory, and the packaged built-ins.

#### Scenario: Templates resolve against the schema directory
**ID:** templates-resolve-locally
- **WHEN** a schema directory holds a `schema.yaml` and its template files
- **THEN** each artifact's template resolves relative to that schema directory,
  with no reference to any other schema

#### Scenario: A schema directory is recognised in any of the three locations
**ID:** three-recognised-locations
- **WHEN** a directory containing a `schema.yaml` is placed in the project's
  planning schemas directory, in the user's data directory, or shipped with the
  package
- **THEN** the system recognises it as an available schema under its directory name

### Requirement: The project config may name a project-local schema
**ID:** config-names-project-local-schema
The system SHALL let the project config's `schema` field name a schema defined
in the project's own schemas directory, not only a packaged built-in, and SHALL
fail to load the schema when the name matches nothing.

#### Scenario: Config names a schema the project defines
**ID:** config-resolves-project-local
- **WHEN** the project config names `my-workflow` and the project's schemas
  directory contains `my-workflow`
- **THEN** commands governed by that config use the project-local schema

#### Scenario: Config names a schema that does not exist
**ID:** config-names-missing-schema
- **WHEN** the project config names a schema that exists in no location
- **THEN** loading the schema fails and the command does not proceed

### Requirement: A schema's apply block declares when implementation may begin
**ID:** apply-block
The system SHALL honour an optional `apply` block in a schema that names the
artifacts required before implementation starts, the file that tracks
implementation progress, and the instruction shown when implementation begins.
Absent the block, every declared artifact SHALL be required, no progress file
SHALL be tracked, and a default instruction SHALL be used.

#### Scenario: Schema declares an apply block
**ID:** apply-block-present
- **WHEN** a schema declares an `apply` block
- **THEN** only the artifacts it requires gate the start of implementation
- **AND** the progress file it names is used for tracking, or none is tracked
  when it names none
- **AND** the instruction it carries is the one shown when implementation begins

#### Scenario: Schema declares no apply block
**ID:** apply-block-absent
- **WHEN** a schema declares no `apply` block
- **THEN** every declared artifact must exist before implementation may begin
- **AND** a default instruction is shown in place of a schema-specific one
