## ADDED Requirements

### Requirement: Specs SHALL record provenance edges
An invariant spec SHALL be able to record the change it was `bornFrom`, and a feature spec SHALL be able to record invariants it `reliesOn`. These edges SHALL be surfaced by `openspec show` and `openspec doctor`.

#### Scenario: Invariant records its origin
- **WHEN** an invariant is created by forking from change `add-database`
- **THEN** the invariant records `bornFrom: add-database` and `openspec show` displays it

#### Scenario: Feature records reliance
- **WHEN** a feature depends on the persistence invariant
- **THEN** the feature records `reliesOn: [<invariant id>]` and `doctor` reports the relationship

### Requirement: Provenance edges SHALL be validated for integrity
Validation SHALL reject a provenance edge that references a non-existent change or spec, and SHALL detect cycles among `reliesOn` edges.

#### Scenario: Dangling provenance reference
- **WHEN** a `reliesOn` edge references an id that does not resolve to a spec
- **THEN** validation fails naming the unresolved reference

#### Scenario: Cyclic reliance detected
- **WHEN** `reliesOn` edges form a cycle
- **THEN** validation fails listing the spec ids in the cycle
