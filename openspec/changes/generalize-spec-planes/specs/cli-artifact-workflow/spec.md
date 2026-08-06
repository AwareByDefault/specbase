## MODIFIED Requirements

### Requirement: Status JSON output
The status command SHALL emit JSON describing the change and, for governed projects, the resolved spec model including the declared plane set.

#### Scenario: Status JSON output
- **WHEN** user runs `openspec status --change <id> --json`
- **THEN** the system outputs JSON with changeName, schemaName, isComplete, and artifacts array
- **AND** for a governed project, includes `specModel` with the resolved plane records (each with `id`, `purpose`, `enforcementFlavor`, and optional `reviewLens`)

#### Scenario: Status JSON includes apply requirements
- **WHEN** user runs `openspec status --change <id> --json`
- **THEN** the system outputs JSON with:
  - `changeName`, `schemaName`, `isComplete`, `artifacts` array
  - `applyRequires`: array of artifact IDs needed for apply phase
  - `specModel.planes`: the resolved plane records for governed projects