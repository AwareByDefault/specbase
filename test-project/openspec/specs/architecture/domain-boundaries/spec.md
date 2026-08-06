---
id: architecture.domain-boundaries
---

# Domain Layer Boundaries

<!-- Architectural truth: structural invariants of the hexagon. State only what
     must be true now. -->

## Requirements

### Requirement: Domain does not depend on adapters
**ID:** `domain-no-adapter-imports`
The domain layer MUST NOT import from the adapters layer. Dependencies point
inward: adapters depend on the domain, never the reverse.

#### Scenario: Adapter import is rejected
**ID:** `adapter-import-rejected`
- **WHEN** a domain module imports from `../adapters`
- **THEN** architectural enforcement reports the violation

### Requirement: Domain obtains time through the Clock port
**ID:** `domain-no-ambient-time`
The domain layer MUST obtain wall-clock time only through the injected Clock
port and MUST NOT read ambient time (`new Date()` / `Date.now()`).

#### Scenario: Ambient time read is rejected
**ID:** `ambient-time-rejected`
- **WHEN** a domain module reads ambient wall-clock time
- **THEN** architectural enforcement reports the violation

#### Scenario: Injected clock is accepted
**ID:** `injected-clock-accepted`
- **WHEN** a domain module receives time through the injected Clock port
- **THEN** architectural enforcement reports no violation
