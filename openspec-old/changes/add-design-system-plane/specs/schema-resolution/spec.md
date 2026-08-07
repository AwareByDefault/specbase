## ADDED Requirements

### Requirement: Resolve a single offer-able plane list with defaultSelected

Schema resolution SHALL expose the governed schema's planes as one offer-able list in which each plane record carries a `defaultSelected` boolean, replacing the previous split between resolved-default `planes` and offered `optionalPlanes`. Consumers (init picker, config loading) SHALL read `defaultSelected` to determine pre-check state; no plane is implicitly resolved except by selection.

#### Scenario: Planes expose defaultSelected

- **WHEN** the governed schema is resolved
- **THEN** each plane record includes `id`, `purpose`, `enforcementFlavor`, an optional `reviewLens`, and a `defaultSelected` flag

#### Scenario: No separate optionalPlanes list

- **WHEN** a consumer reads the resolved schema planes
- **THEN** it finds one unified list, not distinct `planes` and `optionalPlanes` collections
