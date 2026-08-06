## MODIFIED Requirements

### Requirement: Enforcement coverage keyed by declared planes

Paired enforcement coverage SHALL be aggregated per declared plane, and coverage rollups SHALL key on the resolved plane ids rather than a closed enum.

#### Scenario: Coverage rollup for a non-default plane
- **WHEN** a governed project declares an `ops` plane and has enforced specs under it
- **THEN** `openspec coverage` reports a rollup keyed by `ops`
- **AND** the rollup includes covered, hanging, stale, broken, and planned states for that plane

#### Scenario: Coverage with a plane that has no specs
- **WHEN** a governed project declares a plane that has no governed pairs
- **THEN** `openspec coverage` omits that plane from rollups to avoid empty noise