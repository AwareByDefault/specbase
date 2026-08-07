## ADDED Requirements

### Requirement: Load declared spec model planes

The config loader SHALL parse the `specModel.planes` declaration from `openspec/config.yaml` and resolve it against the selected schema's defaults with append (`planes+:`) and replace (`planes:`) semantics.

#### Scenario: Append planes to schema defaults
- **WHEN** `config.yaml` declares `specModel.planes+` with one or more plane records
- **THEN** the resolved plane set is the schema's defaults plus the appended records
- **AND** an appended record whose id duplicates a default is a validation error

#### Scenario: Replace schema default planes
- **WHEN** `config.yaml` declares `specModel.planes` with a full list
- **THEN** the resolved plane set is exactly that list
- **AND** no schema default planes are implied beyond the list

#### Scenario: No project planes declared
- **WHEN** `config.yaml` selects a governed schema and declares no `specModel.planes` or `specModel.planes+`
- **THEN** the resolved plane set is the schema's declared defaults