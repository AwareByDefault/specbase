## MODIFIED Requirements

### Requirement: Guided Artifact Creation
The skill SHALL guide users through each schema-defined artifact and, in governed mode, explain behavioral truth, architectural truth, stable scoped identity, and paired enforcement without presenting unsettled design as current architecture.

#### Scenario: Change creation with narration
- **WHEN** creating the change directory
- **THEN** explain that a change preserves transition rationale and planned updates
- **AND** show the schema-defined artifact structure

#### Scenario: Proposal creation with narration
- **WHEN** creating the proposal
- **THEN** explain why the change exists
- **AND** classify affected governed specs as behavioral or architectural

#### Scenario: Governed specs creation with narration
- **WHEN** creating governed spec files
- **THEN** explain observable behavioral contracts and current architectural invariants
- **AND** assign a stable spec ID plus pair-local requirement and scenario IDs

#### Scenario: Governed enforcement creation with narration
- **WHEN** creating paired enforcement
- **THEN** assign pair-local binding IDs
- **AND** explain automated, review, manual, and planned evidence honestly
- **AND** demonstrate how stable IDs expose stale bindings and hanging claims

#### Scenario: Tasks creation with narration
- **WHEN** creating tasks
- **THEN** include implementation, enforcement resolution, targeted verification, and retired-target assessment

### Requirement: Guided Implementation
The skill SHALL implement tasks with narration connecting normative truth to its evidence.

#### Scenario: Governed implementation with narration
- **WHEN** implementing a governed change
- **THEN** identify the affected stable spec and pair-local normative IDs
- **AND** implement or update declared enforcement
- **AND** resolve actual targets before marking related work complete

#### Scenario: Removed normative contract
- **WHEN** implementation removes a requirement or scenario
- **THEN** update its binding and assess former targets for safe cleanup

#### Scenario: Governed implementation completion
- **WHEN** all tasks are complete
- **THEN** run governed verification before transitioning to archive

### Requirement: Archive with Explanation
The skill SHALL archive the completed change and explain how current pairs and historical rationale were preserved.

#### Scenario: Governed archive with narration
- **WHEN** archiving a verified governed change
- **THEN** explain that specification and enforcement deltas update each affected pair together
- **AND** run schema-aware archive
- **AND** show the archive location, updated locators, and cleanup candidates
- **AND** explain that archived proposal and design preserve why the transition occurred
