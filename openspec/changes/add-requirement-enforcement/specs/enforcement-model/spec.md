## ADDED Requirements

### Requirement: Enforcement records SHALL bind to requirements by stable id
An enforcement record SHALL declare an `enforces` array of requirement ids and SHALL be considered valid only when every id resolves to a requirement in the same spec. Binding by id (not prose name) SHALL make records survive requirement renames.

#### Scenario: Record binds to an existing requirement
- **WHEN** an enforcement record declares `enforces: [persistence-port]` and the spec contains a requirement with id `persistence-port`
- **THEN** validation passes and the record is associated with that requirement

#### Scenario: Record references an unknown id
- **WHEN** an enforcement record declares `enforces: [does-not-exist]`
- **THEN** validation fails with an error naming the unresolved id

### Requirement: Enforcement records SHALL support many-to-many coverage
A single enforcement record SHALL be allowed to enforce multiple requirements, and a single requirement SHALL be allowed to be enforced by multiple records. Coverage SHALL therefore be computed over *requirements satisfied*, never over *number of records*.

#### Scenario: One test enforces several requirements
- **WHEN** a record `kind: test` declares `enforces: [a, b, c]`
- **THEN** all three requirements a, b, and c are considered to have at least one enforcement

### Requirement: Enforcement kind SHALL be a constrained tagged union
Each record SHALL declare `kind ∈ {test, lint, type, ci, manual}`. Validation SHALL require the kind-specific fields for that kind (e.g. `test` requires a locator such as file plus name/pattern; `lint` requires a rule id; `manual` requires an `owner` and a `rationale`).

#### Scenario: Test record missing locator
- **WHEN** a `kind: test` record omits any locator for the test
- **THEN** validation fails stating that a test locator is required

#### Scenario: Manual record requires attestation fields
- **WHEN** a `kind: manual` record omits `owner` or `rationale`
- **THEN** validation fails stating both fields are required for manual enforcement

### Requirement: Manual enforcement SHALL be attestable but never verifiable
A `kind: manual` record SHALL be treated as an attestation only. It SHALL never contribute to *verified* coverage and SHALL be reported separately from machine-verifiable enforcement.

#### Scenario: Manual enforcement excluded from verified coverage
- **WHEN** a requirement is enforced only by a `kind: manual` record
- **THEN** it counts toward *attested* coverage but not toward *verified* coverage

### Requirement: Validation SHALL warn on over-enforcement
When a single requirement is bound by more enforcement records than a configurable threshold, validation SHALL emit a warning identifying the requirement, surfacing potential redundant tests.

#### Scenario: Requirement exceeds enforcement threshold
- **WHEN** a requirement is bound by more records than the configured over-enforcement threshold
- **THEN** validation emits a warning naming the requirement and its record count
