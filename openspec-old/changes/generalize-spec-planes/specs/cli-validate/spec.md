## MODIFIED Requirements

### Requirement: Validation SHALL provide actionable remediation steps
Validation SHALL report actionable diagnostics for change deltas and, under the governed model, for plane declarations, unknown plane roots, and spec IDs whose plane prefix is not declared.

#### Scenario: Unknown plane root
- **WHEN** a governed pair exists under a directory whose name is not in the resolved plane set
- **THEN** validation reports the unknown plane with its source path and the list of declared planes

#### Scenario: Spec ID with unknown plane prefix
- **WHEN** a governed spec's frontmatter declares an id whose prefix is not a declared plane
- **THEN** validation reports the unknown plane prefix with the source path

#### Scenario: Invalid plane declaration
- **WHEN** the resolved plane set contains a non-kebab id, a duplicate id, a reserved word, or a plane missing a required `purpose`
- **THEN** validation reports each violation with the source location and the offending field