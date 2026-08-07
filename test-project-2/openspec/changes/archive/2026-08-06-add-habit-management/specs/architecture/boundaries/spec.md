---
id: architecture.boundaries
---

## ADDED Requirements

### Requirement: Domain core depends only on its own ports
**ID:** `domain-isolation`
The domain core MUST NOT import adapters, the CLI, or ambient I/O APIs
(filesystem, network, process, system clock) directly. It MUST interact with
the outside world only through ports it defines and that are injected into it.

#### Scenario: Ambient filesystem access from the domain is rejected
**ID:** `domain-fs-import-rejected`
- **WHEN** a domain module imports a filesystem API directly
- **THEN** architectural enforcement reports the violation

#### Scenario: Direct adapter import from the domain is rejected
**ID:** `domain-adapter-import-rejected`
- **WHEN** a domain module imports an adapter module directly
- **THEN** architectural enforcement reports the violation

#### Scenario: Injected port usage is accepted
**ID:** `domain-port-usage-accepted`
- **WHEN** a domain module depends only on a port interface it defines, supplied via injection
- **THEN** architectural enforcement reports no violation

### Requirement: Dependencies point from adapters inward to the domain, never the reverse
**ID:** `inward-dependency-direction`
Adapters, including the CLI, MAY depend on the domain core. The domain core
MUST NOT depend on any adapter or on the CLI.

#### Scenario: Adapter depending on the domain is accepted
**ID:** `adapter-imports-domain-accepted`
- **WHEN** an adapter module imports domain code
- **THEN** architectural enforcement reports no violation

#### Scenario: Domain depending on an adapter or the CLI is rejected
**ID:** `domain-imports-outward-rejected`
- **WHEN** a domain module imports an adapter module or the CLI entry point
- **THEN** architectural enforcement reports the violation
