## ADDED Requirements

### Requirement: Schema-driven governed workflow awareness
Generated OPSX skills and command templates SHALL derive governed planes, locators, pair paths, and lifecycle expectations from CLI status and instruction output rather than hardcoding a flat capability layout.

#### Scenario: Governed workflow selected
- **WHEN** a project selects the governed schema
- **THEN** each affected workflow uses CLI-reported specification and enforcement artifact paths
- **AND** distinguishes behavioral and architectural targets

#### Scenario: Legacy workflow selected
- **WHEN** a project selects a legacy schema
- **THEN** generated workflows retain existing flat-spec instructions

### Requirement: Explore classifies durable insights
The explore workflow SHALL distinguish behavioral requirements, current architectural requirements, enforcement decisions, change design decisions, and historical rationale before offering to capture an insight.

#### Scenario: Architectural insight discovered
- **WHEN** exploration establishes a package responsibility or dependency invariant that must remain true
- **THEN** the workflow identifies it as a possible architectural requirement
- **AND** considers how it could be enforced

#### Scenario: Transitional rationale discovered
- **WHEN** exploration explains why one implementation approach was chosen for a particular change
- **THEN** the workflow identifies design or proposal as its durable home rather than current architectural truth

### Requirement: Proposal and artifact creation classify governed changes
The new, propose, fast-forward, and continue workflows SHALL classify proposed specs by plane and create specification then enforcement artifacts at CLI-reported paths.

#### Scenario: Cross-plane change
- **WHEN** one initiative changes user-visible behavior and package boundaries
- **THEN** the change contains separate deltas for each durable behavioral and architectural truth
- **AND** pairs each delta with enforcement

#### Scenario: Stable identities authored
- **WHEN** a governed spec or enforcement artifact is created
- **THEN** the workflow assigns a stable project-wide spec ID and pair-local requirement, scenario, and binding IDs

### Requirement: Change updates preserve pair coherence
The update workflow SHALL review specification and enforcement artifacts together and identify normative additions, modifications, removals, or moves that leave bindings stale, hanging, or incomplete.

#### Scenario: Scenario removed
- **WHEN** an update removes a scenario with a covered stable ID
- **THEN** the workflow updates or removes the stale binding
- **AND** reports its former targets as cleanup candidates

#### Scenario: Spec moves
- **WHEN** an update moves a spec pair to a new locator without changing its meaning
- **THEN** the stable spec ID remains unchanged

### Requirement: Apply resolves enforcement bindings
The apply workflow SHALL implement both the product or architecture change and its declared evidence, resolve planned bindings, and assess retired-target cleanup before marking related work complete.

#### Scenario: New architecture linter
- **WHEN** an architectural requirement needs a new custom lint rule
- **THEN** apply implements the rule and its conformance checks
- **AND** the binding identifies concrete targets and command
- **AND** any user-visible behavior of the linter is captured in the appropriate behavioral spec

#### Scenario: Retired target candidate
- **WHEN** synchronization identifies a retired test, rule, fixture, or review target
- **THEN** apply checks surviving bindings and project usage before removing it
- **AND** does not delete a shared target automatically

#### Scenario: Planned binding remains
- **WHEN** implementation finishes but a mandatory binding remains planned
- **THEN** apply reports the unresolved evidence and does not mark its related work complete

### Requirement: Verify uses declared enforcement first
The verify workflow SHALL use governed bindings as the primary coverage map, run affected automated commands, perform declared review procedures, and use code search only as supporting semantic evidence.

#### Scenario: Complete automated coverage
- **WHEN** affected automated bindings resolve and their commands pass
- **THEN** verify reports coverage by stable spec and pair-local normative IDs with automated strength

#### Scenario: Review binding completes
- **WHEN** verify follows a structured review procedure
- **THEN** it reports the result with review strength and required evidence inputs

#### Scenario: Stale or hanging enforcement
- **WHEN** a binding references a removed normative ID or a surviving claim lacks complete enforcement
- **THEN** verify reports the exact stable IDs and marks the change not ready to archive

#### Scenario: Semantic mismatch
- **WHEN** a changed check passes but does not plausibly prove its covered claim
- **THEN** verify reports the mismatch as review evidence separately from command execution

### Requirement: Sync preserves governed pairs
The sync workflow SHALL reconcile nested specification and enforcement deltas idempotently and SHALL NOT intentionally update only one member of a governed pair.

#### Scenario: Governed pair sync
- **WHEN** a complete prepared pair validates
- **THEN** sync updates both current files and reports normative, binding, and retired-target changes

#### Scenario: Pair conflict
- **WHEN** stable IDs, coverage, lifecycle state, or targets conflict
- **THEN** sync leaves the affected current pair unchanged and reports actionable diagnostics

### Requirement: Archive requires governed readiness
The archive and bulk-archive workflows SHALL require governed pair readiness and distinguish verified archive from an explicit validation bypass.

#### Scenario: Governed archive is ready
- **WHEN** artifacts and tasks are complete, pairs validate, and mandatory enforcement passes
- **THEN** archive proceeds through the schema-aware CLI path

#### Scenario: Governed archive is not ready
- **WHEN** any required binding is planned, stale, broken, missing, or failing
- **THEN** ordinary archive is blocked
- **AND** interactive confirmation is not presented as enforcement evidence

### Requirement: Onboarding teaches governed truth
The onboard workflow SHALL explain behavioral truth, architectural truth, stable scoped identity, evidence strength, and archived rationale through a small real change when governed mode is selected.

#### Scenario: Governed onboarding
- **WHEN** onboarding creates governed artifacts
- **THEN** it demonstrates one behavioral pair and one architectural pair
- **AND** explains how a removed normative ID or enforcement target creates actionable drift

### Requirement: Generated workflow parity
Every supported tool projection of an affected OPSX workflow SHALL contain the same governed semantics from the canonical workflow source.

#### Scenario: Skill and command generation
- **WHEN** workflow projections are generated
- **THEN** parity checks detect any projection that omits governed paths, stable identity, pair maintenance, verification, or archive guidance
