## MODIFIED Requirements

### Requirement: Completeness Verification
The agent SHALL verify task completion and schema-defined normative coverage using governed enforcement bindings when governed mode is active.

#### Scenario: Task completion check
- **WHEN** verifying completeness
- **THEN** read the schema-defined progress artifact
- **AND** report complete and incomplete tasks

#### Scenario: Legacy spec coverage check
- **WHEN** verifying a legacy change
- **THEN** retain existing requirement implementation assessment

#### Scenario: Governed coverage check
- **WHEN** verifying a governed change
- **THEN** load every affected specification/enforcement pair
- **AND** map requirements and scenarios by stable scoped ID to bindings
- **AND** report automated, review, manual, planned, stale, hanging, and broken states separately

#### Scenario: Incomplete governed coverage
- **WHEN** a normative ID lacks complete enforcement or a binding covers an absent ID
- **THEN** report a CRITICAL issue with stable spec, normative, and binding IDs

### Requirement: Correctness Verification
The agent SHALL verify governed implementation by running declared automated enforcement and declared review procedures, while retaining existing heuristic verification for legacy changes.

#### Scenario: Run automated binding
- **WHEN** an affected governed binding declares an automated command
- **THEN** resolve its project-relative targets and working directory
- **AND** execute its declared executable and argument vector
- **AND** associate the result with its covered IDs

#### Scenario: Perform review binding
- **WHEN** an affected binding declares structured review
- **THEN** follow its procedure using the required code and architecture inputs
- **AND** report the conclusion with review strength

#### Scenario: Semantic correspondence
- **WHEN** a changed automated binding resolves and passes
- **THEN** assess whether its check plausibly proves the covered claim
- **AND** report that review conclusion separately from command status

#### Scenario: Automated enforcement fails
- **WHEN** a mandatory automated command fails or cannot execute
- **THEN** report a CRITICAL issue with command output and covered stable IDs
- **AND** mark the change not ready to archive

#### Scenario: Retired enforcement candidate
- **WHEN** a normative ID or binding was removed
- **THEN** verify reports former targets and whether surviving bindings still reference them
- **AND** does not assume an unshared target was deleted without checking project usage
