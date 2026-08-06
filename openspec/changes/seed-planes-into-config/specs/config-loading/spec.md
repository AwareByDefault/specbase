## ADDED Requirements

### Requirement: A declared plane list is authoritative

When a project config declares `specModel.planes:` (replace), config loading SHALL resolve the plane set to exactly that list, independent of the schema's declared planes. A plane the schema declares but the config omits SHALL NOT be resolved; an empty declared list SHALL resolve to the flat model.

#### Scenario: Config list wins over schema defaults

- **WHEN** a config declares `specModel.planes:` omitting a plane the schema declares
- **THEN** the resolved plane set excludes that plane

#### Scenario: Append and default paths are unchanged

- **WHEN** a config uses `specModel.planes+:` or omits `specModel` entirely
- **THEN** resolution applies append-onto-defaults or the schema default subset exactly as before
