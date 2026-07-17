## ADDED Requirements

### Requirement: Governed spec context in artifact instructions
The artifact workflow SHALL expose governed plane, nested locator, stable spec identity, paired specification/enforcement paths, and affected current-pair context through schema-driven status and instruction output.

#### Scenario: Governed specs artifact is ready
- **WHEN** governed specification instructions are requested
- **THEN** output identifies behavioral and architectural target roots
- **AND** requires a project-unique spec ID plus pair-local requirement and scenario IDs

#### Scenario: Governed enforcement artifact is ready
- **WHEN** governed enforcement instructions are requested after specs and design
- **THEN** output identifies every concrete `enforcement.md` path paired with an authored `spec.md`
- **AND** requires pair-local binding IDs and covered normative IDs

#### Scenario: Governed apply context
- **WHEN** governed apply instructions are requested
- **THEN** `contextFiles` includes every concrete specification and enforcement delta needed for implementation
- **AND** includes corresponding current pairs when they exist

#### Scenario: Legacy artifact workflow
- **WHEN** a legacy schema is selected
- **THEN** existing artifact paths and context remain unchanged
