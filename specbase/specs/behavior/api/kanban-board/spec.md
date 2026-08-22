---
id: behavior.api.kanban-board
---

### Requirement: Installed consumers can derive a versioned kanban snapshot
**ID:** `derive-kanban-snapshot`
The supported package API SHALL return a versioned, serializable Kanban snapshot containing summary counts, stable cards in deterministic idea and lifecycle columns, and ordered diagnostics, and the current snapshot version SHALL omit accepted-specification cards and counts.

#### Scenario: A mixed planning store is projected
**ID:** `mixed-store-projected`
- **WHEN** an installed consumer derives the current snapshot from a store containing ideas, active changes, archives, and accepted specifications
- **THEN** every readable work item appears once in its deterministic work column
- **AND** accepted specifications do not appear as cards, columns, or summary counts
- **AND** each work-item card retains its immutable ID

#### Scenario: A readable item is malformed
**ID:** `malformed-item-diagnostic`
- **WHEN** one work item cannot be projected and the rest of the store remains readable
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

### Requirement: Work cards expose canonical stack context
**ID:** `work-card-stack-context`
The current Kanban snapshot SHALL attach a stable stack identity, one-based member position, and total member count to each work card that belongs to a valid stack and SHALL leave unstacked cards unannotated.

#### Scenario: Stack members span lifecycle columns
**ID:** `stack-members-span-columns`
- **WHEN** members of one valid stack occupy different work columns
- **THEN** every member card carries the same stack identity
- **AND** each card reports its canonical position and total

#### Scenario: Work item is not stacked
**ID:** `unstacked-card-has-no-stack`
- **WHEN** a readable work item belongs to no stack
- **THEN** its card has no stack annotation

### Requirement: Current board validation recognizes the work-only contract
**ID:** `validate-work-only-kanban`
The supported package API SHALL validate current work-only snapshots, reject accepted-specification fields in that version, and return stable diagnostics for unsupported or malformed values.

#### Scenario: Accepted-specification field appears in current version
**ID:** `current-version-rejects-spec-fields`
- **WHEN** a value claiming the current version contains an accepted-specification pane or count
- **THEN** validation rejects the value with an invalid-shape diagnostic
