## MODIFIED Requirements

### Requirement: Project-local schema resolution

The system SHALL resolve schemas from the project-local directory (`./openspec/schemas/<name>/`) with highest priority when a `projectRoot` is provided, and SHALL resolve a selected schema's declared plane records as structured data.

#### Scenario: Project-local schema takes precedence over package built-in
- **WHEN** a schema named "spec-driven" exists at `./openspec/schemas/spec-driven/schema.yaml`
- **AND** "spec-driven" is a package built-in schema
- **AND** `getSchemaDir("spec-driven", projectRoot)` is called
- **THEN** the system SHALL return the project-local path

#### Scenario: Resolving a schema's declared planes
- **WHEN** a governed schema declares `specModel.planes` as an array of plane records
- **THEN** schema resolution returns the plane records as structured data
- **AND** the plane records are the defaults used when a project appends or replaces them