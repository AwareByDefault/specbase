---
id: behavior.api.kanban-board
---

### Requirement: Installed consumers can derive a versioned kanban snapshot
**ID:** `derive-kanban-snapshot`
The supported package API SHALL return a versioned, serializable kanban snapshot containing summary counts, stable cards in deterministic idea and lifecycle columns, accepted-specification summaries, and ordered diagnostics.

#### Scenario: A mixed planning store is projected
**ID:** `mixed-store-projected`
- **WHEN** an installed consumer derives a snapshot from a store containing ideas, active changes, archives, and accepted specifications
- **THEN** every readable item appears once in its deterministic column or specification summary
- **AND** each work-item card retains its immutable ID

#### Scenario: A readable item is malformed
**ID:** `malformed-item-diagnostic`
- **WHEN** one item cannot be projected and the rest of the store remains readable
- **THEN** the snapshot omits only that item and includes an ordered machine diagnostic

### Requirement: Consumers can validate an unknown board value
**ID:** `validate-kanban-snapshot`
The supported package API SHALL validate an unknown value against a requested supported board version and return a stable machine diagnostic for an unsupported version or invalid shape.

#### Scenario: A supported snapshot validates
**ID:** `supported-snapshot-validates`
- **WHEN** a consumer validates a board snapshot produced by the same supported contract version
- **THEN** validation succeeds and preserves the typed snapshot

#### Scenario: An unsupported version is rejected
**ID:** `unsupported-version-rejected`
- **WHEN** a consumer validates a snapshot whose version is not supported
- **THEN** validation fails with a diagnostic that identifies the received and supported versions

### Requirement: Package and CLI consumers receive the same board
**ID:** `view-json-board-parity`
For the same unchanged planning store, the supported package API and `specbase view --json` SHALL return structurally identical board snapshots.

#### Scenario: Installed output matches CLI JSON
**ID:** `installed-board-matches-cli`
- **WHEN** an installed consumer derives a board and the CLI reads the same fixture
- **THEN** parsing CLI stdout produces the same value as the package API result
