## MODIFIED Requirements

### Requirement: Top-level show command
The show command SHALL resolve and display changes and specs, and under the governed model SHALL resolve plane-qualified locators and stable spec IDs for any declared plane.

#### Scenario: Direct item display
- **WHEN** user runs `openspec show <locator>` where the locator's first segment is a declared plane
- **THEN** the system resolves the governed pair at `specs/<plane>/<locator>/`
- **AND** displays the paired spec and enforcement information

#### Scenario: Resolve by stable spec ID with non-default plane
- **WHEN** user runs `openspec show <spec-id>` where the spec ID prefix is a declared plane other than `behavior` or `architecture`
- **THEN** the system resolves the pair by its stable spec ID
- **AND** reports the plane and locator of the pair