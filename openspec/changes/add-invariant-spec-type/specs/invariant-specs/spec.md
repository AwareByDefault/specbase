## ADDED Requirements

### Requirement: Invariant specs SHALL use a hybrid ADR body
A spec with `type: invariant` SHALL express each constraint as a Decision (a normative statement plus rationale) followed by at least one compliant example and at least one violating example. The examples SHALL be usable as lint fixtures. The parser SHALL accept this shape in addition to the feature requirement/scenario shape.

#### Scenario: Invariant with decision and examples
- **WHEN** an invariant spec declares a Decision "Persistence SHALL go through a Repository port" with a compliant and a violating example
- **THEN** the spec parses with the decision text and both examples available to enforcement tooling

#### Scenario: Invariant missing a violating example
- **WHEN** an invariant Decision provides a compliant example but no violating example
- **THEN** validation warns that a violating example strengthens the lint binding

### Requirement: Invariants SHALL default enforcement to lint
An invariant's enforcement records SHALL default `kind` to `lint` when unspecified, reflecting that durable constraints are typically machine-enforced structurally rather than per-feature tests.

#### Scenario: Default kind applied
- **WHEN** an invariant declares an enforcement record without a `kind`
- **THEN** the record is treated as `kind: lint`

### Requirement: Invariant coverage SHALL require enforcement and injection
An invariant SHALL be reported as covered only when it has an active lint binding AND is present in injected agent context. An invariant with neither SHALL be reported as aspirational.

#### Scenario: Fully realized invariant
- **WHEN** an invariant has an active lint binding and is included in injected context
- **THEN** coverage reports it as covered

#### Scenario: Aspirational invariant
- **WHEN** an invariant has no lint binding and is not injected
- **THEN** coverage reports it as aspirational, not covered
