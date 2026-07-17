---
id: architecture.domain
---

<!--
  Architectural truth: a package responsibility, dependency invariant, or
  cross-cutting structural policy that must remain true now. Lives at
  specs/architecture/<locator>/spec.md and is paired with an enforcement.md in
  the same directory. State only what must be true now - the rationale for the
  transition belongs in design/proposal and the dated archive.
-->

## ADDED Requirements

### Requirement: Domain determinism
**ID:** `domain-determinism`
The domain layer MUST obtain time and randomness through injected ports and MUST
NOT read ambient time or global randomness.

#### Scenario: Ambient time is rejected
**ID:** `ambient-time-rejected`
- **WHEN** a domain module reads ambient wall-clock time
- **THEN** architectural enforcement reports the violation

#### Scenario: Injected clock is accepted
**ID:** `injected-clock-accepted`
- **WHEN** a domain module reads time through the injected clock port
- **THEN** architectural enforcement reports no violation
