## MODIFIED Requirements

### Requirement: Command Execution
The command SHALL scan and analyze active changes or current specs according to the selected mode and resolved project workflow.

#### Scenario: Scanning for changes by default
- **WHEN** `openspec list` is executed without noun flags
- **THEN** scan the selected changes directory for active change directories
- **AND** retain existing progress behavior

#### Scenario: Scanning legacy specs
- **WHEN** `openspec list --specs` is executed for a legacy project
- **THEN** discover flat capabilities according to the legacy workflow
- **AND** parse requirements to compute existing counts

#### Scenario: Scanning governed specs
- **WHEN** `openspec list --specs` is executed for a governed project
- **THEN** recursively discover complete and incomplete pairs beneath both planes
- **AND** identify each result by normalized plane-qualified locator and stable spec ID when available
- **AND** behave consistently on Windows, macOS, and Linux

### Requirement: Output Format
The command SHALL display items in a clear mode-appropriate format with progress, requirement counts, and governed enforcement status where applicable.

#### Scenario: Displaying change list
- **WHEN** displaying active changes
- **THEN** retain the existing change progress output

#### Scenario: Displaying legacy specs
- **WHEN** displaying specs for a legacy project
- **THEN** show the legacy spec ID and requirement count

#### Scenario: Displaying governed specs
- **WHEN** displaying specs for a governed project
- **THEN** show plane-qualified locator, stable spec ID, requirement count, and coverage summary
- **AND** distinguish complete, planned, stale, hanging, broken, and incomplete-pair states

#### Scenario: Governed JSON output
- **WHEN** governed spec list JSON is requested
- **THEN** each record includes normalized locator, stable spec ID, plane, native pair paths, and coverage counts
