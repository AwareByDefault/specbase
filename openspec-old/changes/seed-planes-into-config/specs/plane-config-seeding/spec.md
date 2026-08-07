## ADDED Requirements

### Requirement: Init seeds selected planes as authoritative config records

At `openspec init`, the selected plane set SHALL be written into `openspec/config.yaml` under `specModel.planes:` as full records, so the config alone fully describes the project's governed plane set. The init output SHALL NOT rely on the schema's default planes remaining implicit; every selected plane (including the core planes) SHALL appear in the config.

#### Scenario: Core planes are written explicitly

- **WHEN** a user completes init selecting the default plane set
- **THEN** `config.yaml` lists every selected plane under `specModel.planes:`
- **AND** none of the selected planes is left implicit for the schema to supply

#### Scenario: A mixed selection is seeded verbatim

- **WHEN** a user selects a subset plus an opt-in plane (e.g. `behavior`, `ops`, `design-system`)
- **THEN** `config.yaml` lists exactly those planes under `specModel.planes:`

### Requirement: Config is the authoritative plane set

A project's resolved plane set SHALL equal the `specModel.planes:` list in its config exactly. Removing a plane from that list SHALL drop it from the resolved set even when the schema still declares that plane; adding a record SHALL add the plane; an empty list SHALL resolve to the flat model per the emergent-governance rule.

#### Scenario: Removing a plane from config drops it

- **WHEN** a seeded config lists `planes:` and the user deletes one plane's record
- **THEN** the resolved plane set no longer includes that plane
- **AND** the schema still declaring that plane does not re-add it

#### Scenario: Emptying the list goes flat

- **WHEN** a project's `specModel.planes:` list is emptied
- **THEN** the project resolves to the flat/legacy model

### Requirement: Seeded records omit picker-only fields

Seeded plane records SHALL contain `id`, `purpose`, `enforcementFlavor`, and `reviewLens` when the plane declares one, and SHALL NOT contain the picker-only `defaultSelected` field or a `crossCutting: false` default.

#### Scenario: A seeded record is clean

- **WHEN** init seeds a plane that declares a review lens
- **THEN** its config record contains `id`, `purpose`, `enforcementFlavor`, and `reviewLens`
- **AND** it contains no `defaultSelected` field and no redundant `crossCutting: false`
