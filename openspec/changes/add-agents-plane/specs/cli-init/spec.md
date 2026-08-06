## ADDED Requirements

### Requirement: Agentic tooling prompt at init

`openspec init` SHALL offer to enable the `agents` plane. When the user accepts, `init` SHALL append the `agents` plane to the project's resolved plane set via `specModel.planes+:` in `openspec/config.yaml` rather than adding it to the shipped resolved default set. When the user declines, `config.yaml` and the resolved plane set SHALL be unchanged.

#### Scenario: User enables the agents plane

- **WHEN** a user runs `openspec init` and accepts the agentic-tooling prompt
- **THEN** `openspec/config.yaml` appends the `agents` plane under `specModel.planes+:` and the resolved plane set includes `agents`

#### Scenario: User declines the agents plane

- **WHEN** a user runs `openspec init` and declines the agentic-tooling prompt
- **THEN** no `agents` plane is written to `config.yaml` and the resolved plane set is unchanged

### Requirement: Agentic review opt-in

When the `agents` plane is enabled, `openspec init` SHALL additionally prompt whether to enable agentic review. The answer SHALL control whether the `review-panel` baseline spec is planted, independently of the always-planted `spec-driven` baseline.

#### Scenario: Agentic review accepted

- **WHEN** a user enables the `agents` plane and accepts the agentic-review prompt
- **THEN** `init` plants both `specs/agents/spec-driven/` and `specs/agents/review-panel/`

#### Scenario: Agentic review declined

- **WHEN** a user enables the `agents` plane but declines the agentic-review prompt
- **THEN** `init` plants `specs/agents/spec-driven/` only, and does not plant `specs/agents/review-panel/`

### Requirement: Baseline specs planted as scaffolding

When the `agents` plane is enabled, `openspec init` SHALL write the selected baseline `agents` specs and their paired enforcement files directly into the project, as bootstrap scaffolding, without creating a change. `init` SHALL NOT overwrite an existing baseline spec that the user has already customized.

#### Scenario: Baseline written without a change

- **WHEN** `init` plants baseline `agents` specs
- **THEN** the spec and enforcement files are written under `specs/agents/` directly, with no `openspec/changes/` entry created for them

#### Scenario: Existing baseline preserved

- **WHEN** `init` runs in a project that already has a planted baseline `agents` spec
- **THEN** `init` leaves the existing spec in place and does not overwrite it
