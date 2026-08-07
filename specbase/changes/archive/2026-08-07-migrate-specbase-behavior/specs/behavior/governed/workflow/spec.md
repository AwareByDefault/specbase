---
id: behavior.governed.workflow
---

## ADDED Requirements

### Requirement: Generated workflows take artifact locations from the CLI, never from assumption
**ID:** cli-is-the-source-of-truth
Generated workflows SHALL derive governed planes, locators, pair paths, and lifecycle
expectations from the CLI's status and instruction output rather than assuming a
layout. A workflow SHALL query status before inspecting or creating artifacts for a
change, SHALL query instructions before writing one, and SHALL write to the resolved
path the CLI returns. A legacy project's workflows SHALL keep their existing flat
instructions.

#### Scenario: Workflow inspects status before artifact work
**ID:** status-before-artifact-work
- **WHEN** a generated workflow needs to inspect or create artifacts for a change
- **THEN** it instructs the agent to read the machine-readable status for that change
- **AND** to use the returned planning context and artifact paths rather than a guessed path

#### Scenario: Workflow reads instructions before writing
**ID:** instructions-before-writing
- **WHEN** a generated workflow is about to create or update an artifact
- **THEN** it instructs the agent to read the machine-readable instructions for that artifact
- **AND** to write to the resolved artifact path the command returns

#### Scenario: Governed workflow distinguishes plane targets
**ID:** governed-targets-distinguished
- **WHEN** a project resolves the governed model
- **THEN** each affected workflow uses the CLI-reported specification and enforcement paths and distinguishes targets by plane

#### Scenario: Legacy workflow unchanged
**ID:** legacy-workflow-unchanged
- **WHEN** a project resolves no planes
- **THEN** its generated workflows retain the existing flat-spec instructions

### Requirement: Plane awareness is baked into prompts when they are written
**ID:** plane-awareness-baked-in
The governed guidance appended to generated workflow files SHALL be produced from the
resolved plane set at the moment the files are written, so a project's plane roster
lives in its prompts without a runtime lookup. Regenerating SHALL rewrite the guidance
to the current plane set, and a legacy project's generated files SHALL be
byte-identical to the flat prompts.

#### Scenario: Generation writes plane-aware guidance
**ID:** generation-writes-plane-guidance
- **WHEN** workflow files are generated for a governed project
- **THEN** they carry awareness of each resolved plane, including its purpose and its trigger guidance

#### Scenario: Regeneration follows the current roster
**ID:** regeneration-follows-roster
- **WHEN** a project's plane set changes and its workflow files are regenerated
- **THEN** the files are rewritten to reflect the current plane set

#### Scenario: Legacy prompts stay byte-identical
**ID:** legacy-prompts-byte-identical
- **WHEN** workflow files are generated for a legacy project
- **THEN** they are byte-identical to the flat prompts and carry no plane awareness

### Requirement: Exploration classifies a durable insight before offering to capture it
**ID:** explore-classifies-insights
The explore workflow SHALL distinguish behavioral requirements, current structural
requirements, enforcement decisions, change-scoped design decisions, and historical
rationale before offering to capture an insight, and SHALL name a candidate locator
in each touched plane.

#### Scenario: Structural insight discovered
**ID:** structural-insight-classified
- **WHEN** exploration establishes a responsibility or dependency invariant that must stay true
- **THEN** the workflow identifies it as a candidate structural requirement and considers how it could be enforced

#### Scenario: Transitional rationale discovered
**ID:** rationale-classified
- **WHEN** exploration explains why one approach was chosen for a particular change
- **THEN** the workflow files it as design or proposal rationale rather than current durable truth

### Requirement: Creating artifacts classifies the change by plane and pairs every delta
**ID:** creation-classifies-by-plane
The workflows that create a change and its artifacts SHALL classify proposed specs by
plane, create the specification and then the enforcement artifact at the CLI-reported
paths, and assign stable identities as they author.

#### Scenario: Cross-plane change
**ID:** cross-plane-deltas
- **WHEN** one initiative changes user-visible behavior and structural boundaries
- **THEN** the change carries a separate delta for each durable truth
- **AND** pairs every delta with enforcement

#### Scenario: Stable identities authored
**ID:** identities-authored
- **WHEN** a governed specification or enforcement artifact is created
- **THEN** the workflow assigns a project-wide spec ID and pair-local requirement, scenario, and binding IDs

### Requirement: Updating a change keeps its pairs coherent
**ID:** updates-preserve-pair-coherence
The update workflow SHALL review a specification and its enforcement together and
SHALL identify normative additions, modifications, removals, or moves that would
leave a binding stale, hanging, or incomplete.

#### Scenario: Scenario removed
**ID:** update-handles-removal
- **WHEN** an update removes a scenario a binding covers
- **THEN** the workflow updates or removes the stale binding and reports its former targets as cleanup candidates

#### Scenario: Spec moved
**ID:** update-handles-move
- **WHEN** an update moves a pair to a new locator without changing its meaning
- **THEN** the stable spec ID is unchanged

### Requirement: Applying a change implements its evidence, not only its code
**ID:** apply-resolves-bindings
The apply workflow SHALL implement the declared evidence alongside the product or
structural change, resolve planned bindings, and assess retired-target cleanup before
marking related work complete.

#### Scenario: New check implemented with its claim
**ID:** apply-implements-evidence
- **WHEN** a requirement needs a new rule or check as its evidence
- **THEN** apply implements the check and its conformance assertions
- **AND** the binding names concrete targets and its command

#### Scenario: Retired target candidate
**ID:** apply-assesses-retired-targets
- **WHEN** synchronization names a retired target
- **THEN** apply checks surviving bindings and project usage before removing it and never deletes a shared target automatically

#### Scenario: Planned binding remains
**ID:** apply-blocks-on-planned
- **WHEN** implementation finishes while a mandatory binding is still planned
- **THEN** apply reports the unresolved evidence and does not mark its related work complete

### Requirement: Verification starts from the declared bindings
**ID:** verify-uses-bindings-first
The verify workflow SHALL treat governed bindings as the primary coverage map, run
the affected automated commands, perform the declared review procedures, and use code
search only as supporting evidence. Stale or hanging enforcement SHALL mark the change
not ready to archive.

#### Scenario: Bindings are the coverage map
**ID:** bindings-are-the-map
- **WHEN** verify assesses a governed change
- **THEN** it reports coverage by stable spec and pair-local IDs from the declared bindings, using code search only to support what the bindings say

#### Scenario: Stale or hanging enforcement blocks
**ID:** verify-blocks-on-drift
- **WHEN** a binding references a removed ID, or a surviving claim lacks complete enforcement
- **THEN** verify reports the exact stable IDs and marks the change not ready to archive

### Requirement: Synchronization never updates half a pair
**ID:** sync-preserves-pairs
The sync workflow SHALL reconcile nested specification and enforcement deltas
idempotently and SHALL NOT intentionally update only one member of a governed pair.

#### Scenario: Governed pair sync
**ID:** sync-updates-both
- **WHEN** a complete prepared pair validates
- **THEN** sync updates both current files and reports normative, binding, and retired-target changes

#### Scenario: Pair conflict
**ID:** sync-leaves-conflict-alone
- **WHEN** stable IDs, coverage, lifecycle state, or targets conflict
- **THEN** sync leaves the affected current pair unchanged and reports actionable diagnostics

### Requirement: Archive requires governed readiness or an honest bypass
**ID:** archive-requires-readiness
The archive and bulk-archive workflows SHALL block while any required enforcement is
missing, planned, stale, broken, or failing, except through the supported explicit
validation bypass. A bypassed archive SHALL record that enforcement validation was
skipped and SHALL NOT be presented as fully verified. Interactive confirmation SHALL
NOT be presented as enforcement evidence.

#### Scenario: Governed archive is ready
**ID:** archive-proceeds-when-ready
- **WHEN** artifacts and tasks are complete, pairs validate, and mandatory enforcement passes
- **THEN** archive proceeds through the schema-aware path

#### Scenario: Governed archive is not ready
**ID:** archive-blocks-when-unready
- **WHEN** any required binding is planned, stale, broken, missing, or failing
- **THEN** ordinary archive is blocked
- **AND** interactive confirmation is not treated as enforcement evidence

#### Scenario: Explicit bypass is recorded
**ID:** archive-bypass-recorded
- **WHEN** the user deliberately invokes the supported validation bypass with its required confirmation
- **THEN** archive records that enforcement validation was skipped and does not present the archive as fully verified

### Requirement: Onboarding teaches governed truth through a real change
**ID:** onboarding-teaches-governed-truth
The onboarding workflow SHALL explain behavioral truth, structural truth, stable
scoped identity, evidence strength, and archived rationale through one small real
change when a project resolves the governed model.

#### Scenario: Governed onboarding
**ID:** onboarding-demonstrates-pairs
- **WHEN** onboarding creates governed artifacts
- **THEN** it demonstrates a pair on more than one plane
- **AND** explains how a removed normative ID or enforcement target creates actionable drift

### Requirement: Every projection of a workflow teaches the same governed semantics
**ID:** generated-workflow-parity
Every supported tool projection of an affected workflow SHALL carry the same governed
semantics from one canonical source.

#### Scenario: Projection parity is checked
**ID:** parity-checked
- **WHEN** workflow projections are generated
- **THEN** a parity check detects any projection that omits governed paths, stable identity, pair maintenance, verification, or archive guidance
