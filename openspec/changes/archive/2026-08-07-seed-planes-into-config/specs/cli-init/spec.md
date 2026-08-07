## ADDED Requirements

### Requirement: Init always writes selected planes into config

`openspec init` SHALL write the selected plane set into `config.yaml` as a `specModel.planes:` list on every governed init, rather than omitting it when the selection equals the schema defaults. The serialized records SHALL be clean (no `defaultSelected`, no redundant `crossCutting: false`).

#### Scenario: Default selection still writes an explicit plane list

- **WHEN** a user completes init accepting the default plane selection
- **THEN** the written `config.yaml` contains an explicit `specModel.planes:` list of those planes

#### Scenario: Zero selection writes a flat config

- **WHEN** a user completes init selecting no planes
- **THEN** init writes a flat project config with no `specModel.planes:` list
