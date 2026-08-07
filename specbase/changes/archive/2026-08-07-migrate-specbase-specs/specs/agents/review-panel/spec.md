## MODIFIED Requirements

### Requirement: The review panel judges every governed plane
**ID:** panel-covers-planes
The review panel SHALL provide one non-cross-cutting lens per governed plane the
project resolves, plus the cross-cutting `enforcement` lens, and each lens SHALL
carry the question it asks of the code. The resolved lens set is the operational
artifact this spec describes and MUST conform to the lenses declared here.

#### Scenario: A lens exists for each governed plane
**ID:** lens-per-plane
- **WHEN** the resolved lens set is checked against the resolved plane roster
- **THEN** every non-cross-cutting plane has exactly one lens scoped to it

#### Scenario: Resolved lenses conform to the spec
**ID:** lenses-conform
- **WHEN** the resolved lens set is compared to the lenses declared in this spec
- **THEN** enforcement reports any lens present in one and absent in the other
