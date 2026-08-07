## MODIFIED Requirements

### Requirement: Spec Command
The spec command SHALL support showing, listing, and validating governed pairs for any declared plane through the existing spec command surface.

#### Scenario: List all specs
- **WHEN** user runs `openspec spec list` on a governed project
- **THEN** the system lists governed pairs under every declared plane root
- **AND** each pair is shown with its plane-qualified locator

#### Scenario: Validate spec structure
- **WHEN** user runs `openspec spec validate` on a governed project
- **THEN** the system validates pairs, scoped identities, and plane prefixes against the resolved plane set

#### Scenario: Show spec as JSON
- **WHEN** user runs `openspec spec show <locator> --json` where the locator's first segment is a declared plane
- **THEN** the system emits JSON with the pair's plane, normalized locator, stable spec ID, and paired enforcement paths