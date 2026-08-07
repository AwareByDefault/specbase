---
id: architecture.persistence-port
---

## ADDED Requirements

### Requirement: A Store port abstracts habit persistence for the domain
**ID:** `store-port-exists`
The domain core MUST define a `Store`-shaped port for habit persistence and
MUST interact with persisted habit data only through that port, never through
direct filesystem calls.

#### Scenario: Domain reads or writes habits through the Store port
**ID:** `domain-uses-store-port`
- **WHEN** a domain operation needs to read or write habit data
- **THEN** it does so by calling the injected `Store` port
- **AND** architectural enforcement reports no violation

#### Scenario: Domain bypassing the Store port is rejected
**ID:** `domain-bypasses-store-port-rejected`
- **WHEN** a domain module reads or writes habit data by calling a filesystem API directly instead of the `Store` port
- **THEN** architectural enforcement reports the violation

### Requirement: A JSON-file adapter is the sole filesystem access point for habit data
**ID:** `json-adapter-sole-access`
Exactly one adapter, a JSON-file adapter, MUST implement the `Store` port for
the CLI. That adapter MUST be the only code path in the application that reads
or writes the habit data file.

#### Scenario: The JSON-file adapter satisfies the Store contract
**ID:** `json-adapter-satisfies-contract`
- **WHEN** the JSON-file adapter is exercised through the `Store` port's operations (add a habit, then list habits)
- **THEN** the habits added are returned by list, proving the adapter round-trips through the port contract

#### Scenario: No other module touches the habit data file directly
**ID:** `no-other-fs-access-to-habit-data`
- **WHEN** any module other than the JSON-file adapter attempts to read or write the habit data file
- **THEN** architectural enforcement reports the violation
