## MODIFIED Requirements

### Requirement: Spec Command
The system SHALL provide a `spec` command with subcommands for displaying, listing, and validating legacy and governed specifications.

#### Scenario: Show legacy spec as JSON
- **WHEN** executing `openspec spec show <legacy-id> --json`
- **THEN** retain existing legacy JSON compatibility

#### Scenario: Show governed pair as JSON
- **WHEN** executing `openspec spec show <locator-or-stable-id> --json` in governed mode
- **THEN** parse the specification and enforcement pair
- **AND** return stable spec ID, plane, locator, pair-local normative IDs, bindings, targets, and coverage states

#### Scenario: List governed specs
- **WHEN** executing `openspec spec list` in a governed project
- **THEN** recursively list plane-qualified locators with stable spec IDs and coverage summaries

#### Scenario: Validate governed spec
- **WHEN** executing `openspec spec validate <locator-or-stable-id>`
- **THEN** validate the selected pair, scoped identities, coverage, lifecycle state, and declared paths

#### Scenario: Legacy command compatibility
- **WHEN** executing spec subcommands in a legacy project
- **THEN** preserve existing paths, filters, and output

### Requirement: JSON Schema Definition
The system SHALL define runtime schemas that accurately represent both legacy specs and governed specification-enforcement pairs.

#### Scenario: Governed schema validation
- **WHEN** parsing a governed pair into JSON
- **THEN** validate stable spec identity, plane, locator, pair-local requirement/scenario/binding IDs, enforcement mechanism, lifecycle, target, and coverage fields
- **AND** reject unknown closed-enum values with actionable errors

#### Scenario: Legacy schema validation
- **WHEN** parsing a legacy spec into JSON
- **THEN** retain the existing legacy schema and output compatibility
