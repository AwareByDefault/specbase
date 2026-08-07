## ADDED Requirements

### Requirement: Governed spec resolution and display
The top-level show command SHALL resolve governed specs by plane-qualified nested locator or stable spec ID and SHALL expose paired enforcement and coverage in structured output.

#### Scenario: Show governed spec by locator
- **WHEN** the user runs `openspec show architecture/platforms/desktop --type spec`
- **THEN** resolve the complete pair at that normalized locator
- **AND** preserve raw-first specification display in text mode

#### Scenario: Show governed spec by stable ID
- **WHEN** the user supplies a project-unique governed spec ID
- **THEN** resolve the pair at its current locator even after a move

#### Scenario: Show governed spec as JSON
- **WHEN** the user shows a governed spec with `--json`
- **THEN** output includes stable spec ID, plane, normalized locator, native pair paths, requirement and scenario IDs, bindings, and coverage states

#### Scenario: Incomplete pair
- **WHEN** a locator contains exactly one member of a governed pair
- **THEN** show reports the existing source and missing pair member

#### Scenario: Ambiguous unqualified basename
- **WHEN** an unqualified basename matches more than one governed locator
- **THEN** the command reports candidates and requires a plane-qualified locator or stable spec ID
