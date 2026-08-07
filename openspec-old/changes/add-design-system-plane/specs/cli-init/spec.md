## ADDED Requirements

### Requirement: Init presents planes as a single multi-select picker

`openspec init` SHALL present the schema's offered planes as one multi-select picker with a select-all toggle at the top, replacing the binary governed prompt and the separate agentic-review opt-in. Each plane's initial checked state SHALL follow its `defaultSelected` value. The user's selection SHALL determine governance: selecting no planes leaves the project flat; selecting one or more makes it governed.

#### Scenario: Picker replaces the governed yes/no prompt

- **WHEN** a user runs `openspec init` interactively
- **THEN** they are shown one plane multi-select (with select-all), not a governed-yes/no prompt followed by separate opt-ins

#### Scenario: Select-all toggles every plane

- **WHEN** the user activates the select-all toggle
- **THEN** every offered plane's checked state flips together

#### Scenario: Selecting no planes yields a flat project

- **WHEN** the user confirms the picker with zero planes selected
- **THEN** init produces a legacy flat project and writes no governed plane roster

### Requirement: Init writes the selected planes and derived kind

On completion `openspec init` SHALL write the selected plane set into the project config and record `specModel.kind` as derived from that set. It SHALL plant baseline specs only for selected planes; a plane left unselected (including `agents`) SHALL NOT have its baseline specs planted.

#### Scenario: Config reflects the selection

- **WHEN** the user selects `behavior`, `architecture`, and `design-system`
- **THEN** the written config lists exactly those planes and a `kind` derived as `governed`

#### Scenario: Baseline specs plant only for selected planes

- **WHEN** the user does not select the `agents` plane
- **THEN** init does not plant the `agents/spec-driven` baseline spec
- **AND** the config plane roster still records the project's governed status
