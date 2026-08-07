## ADDED Requirements

### Requirement: Governance emerges from plane selection

A project's governed status SHALL be determined by its resolved plane set, not by a separate binary gate. When one or more planes are resolved, the project SHALL be governed; when zero planes are resolved, the project SHALL remain a legacy flat project. `specModel.kind` SHALL be derived from the resolved plane count rather than set independently by the user.

#### Scenario: One or more planes means governed

- **WHEN** a project's resolved plane set is non-empty
- **THEN** the project operates in the governed model
- **AND** `specModel.kind` resolves to `governed`

#### Scenario: Zero planes means legacy flat

- **WHEN** a project resolves no planes
- **THEN** the project operates in the legacy flat model
- **AND** `specModel.kind` resolves to `flat`

#### Scenario: Derived kind cannot contradict the plane set

- **WHEN** config resolution computes `specModel.kind`
- **THEN** the value follows from the resolved plane count and is never a standalone user-set field that disagrees with it

### Requirement: Planes are offered as a single selectable list with per-plane defaults

The schema SHALL declare one offer-able plane list rather than a split of resolved-default and optional planes. Each plane record SHALL carry a `defaultSelected` boolean indicating whether it is pre-checked in the init picker. The core four planes (`behavior`, `architecture`, `ops`, `code-quality`) SHALL default to selected; `design-system` and `agents` SHALL default to unselected.

#### Scenario: Pre-check state comes from defaultSelected

- **WHEN** the init picker renders the offered planes
- **THEN** each plane's initial checked state equals its `defaultSelected` value
- **AND** the core four are pre-checked while `design-system` and `agents` are not

#### Scenario: Config records the resolved plane roster

- **WHEN** init writes the project config
- **THEN** the selected plane set is recorded as the authoritative governance roster, independent of any per-plane baseline specs that may or may not be planted
