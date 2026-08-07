## ADDED Requirements

### Requirement: Derive specModel.kind from the resolved plane set

Config loading SHALL derive `specModel.kind` from the resolved plane set: non-empty resolves to `governed`, empty resolves to `flat`. A `kind` value that disagrees with the resolved plane count SHALL NOT override the derivation. The resolved plane list SHALL be loaded from the schema's single offer-able plane list combined with the project config's append (`planes+:`) or replace (`planes:`) declarations.

#### Scenario: Non-empty plane set loads as governed

- **WHEN** the resolved plane set for a project is non-empty
- **THEN** `specModel.kind` loads as `governed`

#### Scenario: Empty plane set loads as flat

- **WHEN** the resolved plane set for a project is empty
- **THEN** `specModel.kind` loads as `flat`

#### Scenario: Append and replace semantics preserved

- **WHEN** a project config declares `specModel.planes+:` or `specModel.planes:`
- **THEN** the resolved plane set applies append-vs-replace against the schema's offered planes as before
