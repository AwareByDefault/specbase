---
id: architecture.action-boundary
---

### Requirement: Action policy derives from authoritative work-item truth
**ID:** `authoritative-action-policy`
The direct action boundary SHALL derive target identity, availability, blockers, and remediation from freshly resolved Specbase lifecycle and gate APIs rather than from board column placement, display labels, or client-provided state.

#### Scenario: A client supplies stale presentation state
**ID:** `presentation-state-is-not-authority`
- **WHEN** a client's displayed lane or availability disagrees with freshly resolved Specbase state
- **THEN** the catalog and validator follow the freshly resolved state

### Requirement: The Specbase action boundary ends at validated dispatch context
**ID:** `validation-execution-boundary`
The direct action boundary SHALL return only canonical typed dispatch descriptors from its closed action vocabulary; an external adapter SHALL own any Pi conversation, RPIV workflow, Git operation, shell process, or other side effect.

#### Scenario: Validation accepts an action
**ID:** `accepted-action-has-no-side-effect`
- **WHEN** the action boundary accepts an exact intent
- **THEN** it returns the canonical dispatch descriptor without starting its target

#### Scenario: External adapter binds a capability
**ID:** `external-adapter-binds-capability`
- **WHEN** an accepted descriptor names a closed external capability
- **THEN** Specbase leaves capability installation, confirmation, workflow selection, credentials, Git operations, and execution to the external adapter

#### Scenario: Arbitrary executable text is supplied
**ID:** `arbitrary-execution-is-rejected`
- **WHEN** an intent supplies a command, skill, workflow, or Git operation outside the canonical descriptor
- **THEN** validation rejects the value before any external adapter is invoked
