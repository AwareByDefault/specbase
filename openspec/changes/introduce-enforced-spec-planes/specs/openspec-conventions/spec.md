## MODIFIED Requirements

### Requirement: Behavior-First Specification Boundary
OpenSpec specifications SHALL distinguish observable behavioral contracts from current architectural contracts: behavioral specs describe externally checkable outcomes, while architectural specs describe intentional packages, responsibilities, dependency boundaries, ownership, and structural invariants.

#### Scenario: Writing behavioral requirements
- **WHEN** documenting user-visible command behavior, state transitions, outputs, or errors
- **THEN** author the requirement in the behavioral plane
- **AND** keep replaceable implementation details in design or code

#### Scenario: Writing architectural requirements
- **WHEN** documenting package responsibility, allowed dependency direction, composition ownership, or a structural invariant
- **THEN** author the requirement in the architectural plane
- **AND** state what must remain true rather than the temporary migration plan

#### Scenario: Tool behavior is itself observable
- **WHEN** a custom test or lint tool exposes durable user-visible behavior
- **THEN** specify that tool behavior in the behavioral plane
- **AND** bind the architectural requirement to the tool through enforcement rather than embedding tool implementation in the architecture spec

### Requirement: Project Structure
An OpenSpec project using the governed workflow SHALL maintain explicit behavioral and architectural planes with complete specification/enforcement pairs, while legacy workflows retain their schema-defined structure.

#### Scenario: Governed current specs
- **WHEN** a project selects governed mode
- **THEN** current pairs reside beneath `openspec/specs/behavior/` or `openspec/specs/architecture/`
- **AND** may use safe nested locators

#### Scenario: Namespace directory
- **WHEN** a directory only groups child pairs
- **THEN** it need not contain a parent pair

#### Scenario: Governed pair directory
- **WHEN** a governed directory contains `spec.md`
- **THEN** it also contains `enforcement.md`

#### Scenario: Legacy current specs
- **WHEN** a project remains on a legacy schema
- **THEN** its existing flat specification structure remains valid

### Requirement: Header-Based Requirement Identification
Governed specs SHALL use a project-unique stable spec ID plus pair-local stable requirement, scenario, and binding IDs as programmatic identity; human-readable headers remain mutable display names. Legacy flat specs SHALL retain normalized header matching.

#### Scenario: Matching governed requirements
- **WHEN** synchronization or enforcement refers to a governed requirement or scenario
- **THEN** it resolves within the pair by stable local ID
- **AND** title changes do not break the reference

#### Scenario: Matching moved governed spec
- **WHEN** a spec pair moves to a different locator
- **THEN** lookup and synchronization preserve its project-unique stable spec ID

#### Scenario: Matching legacy requirements
- **WHEN** a legacy delta is reconciled
- **THEN** existing normalized header identity remains authoritative

#### Scenario: Duplicate governed identity
- **WHEN** duplicate spec IDs exist in the project or duplicate local IDs exist in one pair
- **THEN** validation reports each conflicting source location

### Requirement: Change Storage Convention
Governed changes SHALL store specification and enforcement deltas beneath the same plane-qualified nested locator as their target current pair.

#### Scenario: Governed behavioral delta
- **WHEN** a change modifies `behavior/session-loop`
- **THEN** its governed delta paths contain both `spec.md` and `enforcement.md` for that locator

#### Scenario: Governed architectural delta
- **WHEN** a change modifies `architecture/platforms/desktop`
- **THEN** its governed delta paths preserve that complete locator and pair

#### Scenario: Legacy delta
- **WHEN** a legacy change is authored
- **THEN** it retains the existing `specs/<capability>/spec.md` convention

### Requirement: Archive Process Enhancement
The archive process SHALL prepare and validate governed specification and enforcement updates together before promoting an affected current pair.

#### Scenario: Archiving legacy changes
- **WHEN** a legacy change is archived
- **THEN** existing legacy reconciliation and archive behavior remains unchanged

#### Scenario: Preparing governed updates
- **WHEN** a governed change is archived
- **THEN** resolve target pairs by stable spec ID and locator
- **AND** validate scoped identities, coverage, lifecycle state, and active targets against the prepared pair before writing

#### Scenario: Stale or hanging enforcement
- **WHEN** a prepared pair contains a binding for a removed normative ID or a mandatory claim without complete enforcement
- **THEN** archive reports the exact stable IDs and refuses ordinary promotion

#### Scenario: Retired enforcement target
- **WHEN** a normative ID or binding is removed
- **THEN** archive reports its no-longer-referenced targets as cleanup candidates
- **AND** does not delete project code automatically
