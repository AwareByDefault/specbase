## MODIFIED Requirements

### Requirement: Archive Process
The archive operation SHALL validate and apply schema-appropriate current-state updates before moving the complete change to archive.

#### Scenario: Performing legacy archive
- **WHEN** archiving a legacy change
- **THEN** retain existing legacy validation, spec-update, and move behavior

#### Scenario: Performing governed archive
- **WHEN** archiving a governed change
- **THEN** discover every explicit nested specification/enforcement delta pair
- **AND** build and validate each prospective current pair before writing
- **AND** validate project-unique spec IDs plus pair-local normative and binding identities
- **AND** reject stale, hanging, planned, broken, or incomplete mandatory enforcement
- **AND** move the change only after all prepared pair updates succeed

#### Scenario: Incomplete governed pair
- **WHEN** only one member of a governed delta pair exists
- **THEN** archive reports the missing file and aborts before current-spec writes

#### Scenario: Governed archive output
- **WHEN** governed archive succeeds
- **THEN** report updated locators, normative and binding operation counts, retired-target candidates, and verification status

### Requirement: Spec Update Process
Before moving a change to archive, the command SHALL apply schema-defined deltas and SHALL prepare each governed specification and enforcement update as one coherent pair.

#### Scenario: Applying governed deltas
- **WHEN** a governed change contains complete paired deltas
- **THEN** resolve current pairs by stable spec ID and plane-qualified locator
- **AND** apply normative operations before checking enforcement coverage against the prepared spec
- **AND** write neither member of an affected pair when pair validation fails

#### Scenario: Removed normative ID
- **WHEN** a requirement or scenario and its binding are removed
- **THEN** report former binding targets as cleanup candidates
- **AND** do not delete project code automatically

#### Scenario: Existing validation bypass
- **WHEN** the supported validation-bypass option is used with required confirmation
- **THEN** preserve the existing bypass behavior
- **AND** report that governed enforcement was not fully verified
