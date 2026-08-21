---
id: architecture.activity-awareness
---

## Purpose

Define how local activity observations enrich the board through bounded ports without influencing governed project truth.

## ADDED Requirements

### Requirement: Time and observations enter through explicit ports
**ID:** injected-activity-inputs
The activity subsystem SHALL receive current time and file observations through injected interfaces. Evaluation SHALL be a pure transformation of those inputs and SHALL NOT read ambient time, filesystem state, terminal state, or process state directly.

#### Scenario: A fixed clock produces a fixed result
**ID:** fixed-inputs-are-deterministic
- **WHEN** tests provide the same clock and provider observations repeatedly
- **THEN** evaluation returns the same activity value without sleeps or ambient reads

### Requirement: The local provider enforces the privacy boundary
**ID:** bounded-local-provider
The default activity provider SHALL traverse only the requested work-item root, use regular-file metadata without content reads, reject path resolution outside that root, and expose no network, identity, or process-presence dependency.

#### Scenario: Escaping paths cannot contribute
**ID:** provider-rejects-escape
- **WHEN** a candidate path or symlink resolves outside the requested work-item root
- **THEN** the provider excludes it from the observation

### Requirement: Activity enrichment cannot feed truth derivation
**ID:** advisory-enrichment-boundary
Lifecycle, artifact status, task progress, validation, readiness, and card ordering SHALL be complete before activity enrichment. Those derivations SHALL NOT import or branch on the activity value; output projections MAY read it only for display and serialization.

#### Scenario: Activity varies after truth is fixed
**ID:** activity-enriches-after-truth
- **WHEN** two activity providers return different values for the same base board
- **THEN** only activity fields and their presentation differ
- **AND** lifecycle, progress, readiness, and ordering are identical

### Requirement: Provider failures are isolated
**ID:** per-card-failure-isolation
Activity enrichment SHALL contain provider errors at the individual card boundary and return a complete board. It SHALL NOT discard or reclassify the card or abort enrichment for independent cards.

#### Scenario: One failure leaves other observations intact
**ID:** one-provider-failure-isolated
- **WHEN** observation fails for one card and succeeds for another
- **THEN** the failed card is unknown, the successful card retains its value, and both remain in the board
