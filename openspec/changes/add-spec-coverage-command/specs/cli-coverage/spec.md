## ADDED Requirements

### Requirement: Coverage SHALL report forward gaps
The `openspec coverage` command SHALL report the percentage of requirements with at least one enforcement and SHALL list every requirement that has none. Coverage SHALL be computed over requirements, not over enforcement record count.

#### Scenario: Uncovered requirement listed
- **WHEN** a spec has three requirements and one has no enforcement record
- **THEN** coverage reports 2/3 (67%) for that spec and names the uncovered requirement

### Requirement: Coverage SHALL report reverse orphan enforcers
The command SHALL enumerate enforcers discovered in the codebase and SHALL list those that bind to no stated requirement, flagging them as orphan tests (candidate bloat or missing intent).

#### Scenario: Orphan test surfaced
- **WHEN** the codebase contains a test that is not referenced by any enforcement record
- **THEN** coverage lists that test under orphan enforcers

#### Scenario: No orphans
- **WHEN** every discovered enforcer binds to at least one requirement
- **THEN** the orphan section reports none

### Requirement: Coverage SHALL report an efficiency ratio
For each spec the command SHALL report an enforcements-per-requirement ratio as a redundancy indicator, distinct from the forward coverage percentage.

#### Scenario: Ratio reported per spec
- **WHEN** a spec has 4 requirements bound by 12 enforcement records
- **THEN** coverage reports an efficiency ratio of 3.0 for that spec

### Requirement: Coverage SHALL separate verified from attested
The command SHALL report verified coverage (machine-verifiable kinds) separately from attested coverage (manual records), so that human attestations never inflate verified numbers.

#### Scenario: Manual-only requirement
- **WHEN** a requirement is enforced only by a `kind: manual` record
- **THEN** it appears in attested coverage and is excluded from verified coverage

### Requirement: Coverage SHALL support depth flags and gating
The command SHALL support `--declared`, `--resolve`, and `--run` depths, a `--json` output, and SHALL exit non-zero when coverage falls below a configurable threshold.

#### Scenario: Resolve depth catches a stale mapping
- **WHEN** running with `--resolve` and a record references a test name that no longer exists
- **THEN** that requirement is reported as not covered at resolve depth and the command notes the stale reference

#### Scenario: Threshold gating in CI
- **WHEN** running with a configured minimum threshold and verified coverage is below it
- **THEN** the command exits non-zero
