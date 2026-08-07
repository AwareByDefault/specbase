## ADDED Requirements

### Requirement: Governed spec validation
The validate command SHALL validate governed pairs, scoped stable identities, nested locators, normative coverage, lifecycle states, and declared target paths with actionable source locations.

#### Scenario: Validate complete governed project
- **WHEN** the user validates all specs in a governed project
- **THEN** recursively inspect both planes and every complete or incomplete pair
- **AND** report duplicate spec IDs, pair-local identity conflicts, coverage states, and target results deterministically

#### Scenario: Stale binding
- **WHEN** a binding covers a requirement or scenario ID absent from its paired spec
- **THEN** report the binding ID, stale covered ID, and both pair paths

#### Scenario: Hanging claim
- **WHEN** a normative requirement or scenario lacks complete enforcement
- **THEN** report its stable spec and pair-local normative IDs

#### Scenario: Missing enforcement target
- **WHEN** an active binding references a project-relative file or working directory that cannot be resolved
- **THEN** report the binding ID, structured field, missing target, and covered IDs

#### Scenario: Cross-platform nested validation
- **WHEN** governed specs use nested paths on Windows, macOS, or Linux
- **THEN** filesystem access uses native paths
- **AND** diagnostics and JSON use the same normalized locator

### Requirement: Governed change validation
The validate command SHALL validate governed specification and enforcement deltas against corresponding current pairs before synchronization or archive.

#### Scenario: Requirement removal leaves stale binding
- **WHEN** a governed delta removes a requirement but leaves a binding that covers its stable ID
- **THEN** change validation reports the stale binding and blocks readiness

#### Scenario: Scenario and binding removed together
- **WHEN** a delta removes a scenario and its binding
- **THEN** validate the prepared pair without the removed IDs
- **AND** report former binding targets as cleanup candidates

#### Scenario: Planned binding during authoring
- **WHEN** a change declares a planned binding whose concrete target is not yet implemented
- **THEN** report its planned state without treating planning artifacts as malformed
- **AND** allow apply-readiness
- **AND** block verification and archive-readiness until it becomes active

#### Scenario: Incomplete governed delta pair
- **WHEN** a governed locator has only a specification or enforcement delta
- **THEN** report the missing pair member and block synchronization
