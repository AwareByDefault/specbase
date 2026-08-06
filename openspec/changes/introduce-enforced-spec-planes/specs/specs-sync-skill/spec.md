## MODIFIED Requirements

### Requirement: Specs Sync Skill
The system SHALL provide an `/opsx:sync` skill that synchronizes schema-defined legacy deltas and, for governed projects, complete nested specification/enforcement delta pairs.

#### Scenario: Sync legacy delta specs
- **WHEN** the agent executes `/opsx:sync` for a legacy change
- **THEN** retain existing legacy reconciliation behavior

#### Scenario: Sync governed delta pairs
- **WHEN** the agent executes `/opsx:sync` for a governed change
- **THEN** use status output to discover every concrete nested specification and enforcement delta
- **AND** resolve corresponding current pairs by stable spec ID and locator
- **AND** reconcile each complete pair together

#### Scenario: Idempotent governed operation
- **WHEN** governed sync runs multiple times on an already-synchronized change
- **THEN** specification and enforcement files remain unchanged
- **AND** no requirement, scenario, or binding is duplicated

### Requirement: Delta Reconciliation Logic
The agent SHALL reconcile legacy requirements with legacy header identity and governed pair contents with stable scoped identity.

#### Scenario: Governed normative operation
- **WHEN** a governed delta adds, modifies, removes, or renames a requirement or scenario
- **THEN** reconcile it by pair-local stable ID
- **AND** preserve unaffected normative content

#### Scenario: Governed binding operation
- **WHEN** a governed enforcement delta adds, modifies, removes, or renames a binding
- **THEN** reconcile it by pair-local binding ID
- **AND** validate covered IDs against the prepared paired spec

#### Scenario: Moved governed spec
- **WHEN** a governed delta retains an existing stable spec ID at a new locator
- **THEN** resolve and update the moved pair without changing its identity

#### Scenario: Retired target
- **WHEN** synchronization removes a binding or its covered normative ID
- **THEN** report the binding's former targets as cleanup candidates
- **AND** indicate whether surviving bindings still share those targets

#### Scenario: Pair validation fails
- **WHEN** a prepared pair has duplicate scoped identity, stale coverage, a hanging mandatory claim, unresolved status, missing target, or a missing pair member
- **THEN** leave that current pair unchanged
- **AND** report actionable conflicts
