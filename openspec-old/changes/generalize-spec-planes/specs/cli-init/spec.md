## MODIFIED Requirements

### Requirement: Directory Creation
The init command SHALL create the OpenSpec directory structure and, for governed schemas, write the default plane set into the project configuration.

#### Scenario: Creating OpenSpec structure
- **WHEN** a user runs `openspec init` in a new project
- **THEN** the system creates the `openspec/` directory and `openspec/config.yaml`
- **AND** for a governed schema, `config.yaml` resolves to the schema's declared default plane set

#### Scenario: Writing the default plane set
- **WHEN** `openspec init` initializes a governed project
- **THEN** the generated skills contain awareness for each default plane (`behavior`, `architecture`, `ops`, `code-quality`)
- **AND** the plane roster is sourced from the resolved schema at generation time