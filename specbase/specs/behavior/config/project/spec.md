---
id: behavior.config.project
---

### Requirement: A project declares its settings in one config file at the planning root
**ID:** project-config-file
The system SHALL read the project configuration file named `config.yaml` at the
root of the resolved planning directory. A missing file SHALL yield no
configuration and no error. A file that is not a YAML object, or that cannot be
parsed as YAML, SHALL yield no configuration plus a single-line warning that
names the file.

#### Scenario: Valid config file
**ID:** config-file-parsed
- **WHEN** the project config file holds a valid YAML object
- **THEN** the system returns the parsed project configuration

#### Scenario: No config file
**ID:** config-file-absent
- **WHEN** no project config file exists at the planning root
- **THEN** the system returns no configuration and reports no error

#### Scenario: Unparseable or non-object config
**ID:** config-file-malformed
- **WHEN** the project config file holds malformed YAML or a non-object value
- **THEN** the system warns once, naming the file, and returns no configuration
- **AND** the warning carries no stack trace

### Requirement: Both YAML file extensions name the project config
**ID:** yml-extension-alias
The system SHALL accept the config file under either the `.yaml` or the `.yml`
extension, and SHALL prefer `.yaml` when both exist.

#### Scenario: Only the .yml spelling exists
**ID:** yml-fallback
- **WHEN** only `config.yml` exists at the planning root
- **THEN** the system reads the configuration from that file

#### Scenario: Both spellings exist
**ID:** yaml-preferred
- **WHEN** both `config.yaml` and `config.yml` exist at the planning root
- **THEN** the system reads `config.yaml`

### Requirement: An invalid field never invalidates the whole config
**ID:** resilient-field-parsing
The system SHALL parse each configuration field independently. An invalid field
SHALL be dropped with a warning while every valid field is kept. Within a
structured field, the system SHALL keep the valid entries and drop only the
invalid ones.

#### Scenario: One invalid field among valid ones
**ID:** invalid-field-dropped
- **WHEN** the config holds a valid schema field, a valid rules field, and a
  context field of the wrong type
- **THEN** the returned configuration carries schema and rules
- **AND** a warning names the dropped context field

#### Scenario: Partly invalid structured field
**ID:** partial-entries-kept
- **WHEN** a rules entry holds a mix of valid strings and invalid values
- **THEN** the valid strings are kept and the invalid values are dropped with a warning

#### Scenario: Absent optional field
**ID:** absent-field-is-quiet
- **WHEN** the config omits an optional field
- **THEN** no warning is emitted

### Requirement: Project context is capped at a published size limit
**ID:** context-size-limit
The system SHALL reject a project context value larger than 50KB, warn with the
measured size and the limit, and return the rest of the configuration without
the context field. A value at or below the limit SHALL be kept intact.

#### Scenario: Context within the limit
**ID:** context-within-limit
- **WHEN** the config holds a context value at or below 50KB
- **THEN** the context is included in the returned configuration

#### Scenario: Context over the limit
**ID:** context-over-limit
- **WHEN** the config holds a context value larger than 50KB
- **THEN** the system warns with the size and the limit
- **AND** the returned configuration omits the context field

### Requirement: A broken config degrades to defaults instead of halting
**ID:** config-errors-never-halt
The system SHALL continue the requested operation with default values when
configuration loading or parsing fails, and SHALL write the explanatory warning
to the error stream so it never contaminates machine-readable output.

#### Scenario: Command runs against a broken config
**ID:** command-continues-on-bad-config
- **WHEN** a user runs a command in a project whose config file is malformed
- **THEN** the command completes using the default schema

#### Scenario: Warning reaches the user
**ID:** warning-on-stderr
- **WHEN** configuration loading fails
- **THEN** the warning is written to the error stream with the cause

### Requirement: The config declares the project's resolved plane set
**ID:** declared-plane-set
The system SHALL resolve the project's plane set from the config's spec-model
declaration against the schema's offered planes: a replace declaration resolves
to exactly the declared list, an append declaration adds to the schema's default
selection, and no declaration resolves to the schema's default selection. The
declared list SHALL be authoritative — a plane the schema offers but the config
omits SHALL NOT be resolved.

#### Scenario: Appended planes
**ID:** planes-append
- **WHEN** the config appends one or more plane records
- **THEN** the resolved plane set is the schema's default selection plus the appended records

#### Scenario: Replacing planes
**ID:** planes-replace-exact
- **WHEN** the config declares a full replacement plane list
- **THEN** the resolved plane set is exactly that list

#### Scenario: No declaration
**ID:** planes-default
- **WHEN** the config declares no planes
- **THEN** the resolved plane set is the schema's default selection

#### Scenario: A plane the config omits stays out
**ID:** omitted-plane-not-resolved
- **WHEN** a replacement list omits a plane that the schema offers
- **THEN** the resolved plane set excludes that plane
- **AND** the schema does not add it back

### Requirement: The spec-model kind follows the resolved plane set
**ID:** spec-model-kind-derived
The system SHALL derive the spec-model kind from the resolved plane set: a
non-empty set resolves to the governed model and an empty set resolves to the
flat model. A declared kind that disagrees with the resolved plane count SHALL
NOT override the derivation.

#### Scenario: Planes present
**ID:** non-empty-set-governed
- **WHEN** the resolved plane set is non-empty
- **THEN** the project resolves to the governed spec model

#### Scenario: Planes emptied
**ID:** empty-set-flat
- **WHEN** the resolved plane set is empty
- **THEN** the project resolves to the flat spec model

#### Scenario: Declared kind disagrees with the plane set
**ID:** declared-kind-not-authoritative
- **WHEN** a declared kind disagrees with the resolved plane count
- **THEN** the derived kind wins over the declared kind
