## ADDED Requirements

### Requirement: Update offers to sync new catalog planes

`openspec update` SHALL detect planes that exist in the schema's plane catalog but are absent from the project's `specModel.planes:` list, and SHALL OFFER to add them to the config. It MUST NOT add catalog planes silently; a plane joins the resolved set only when the user accepts.

#### Scenario: A new catalog plane is offered, not forced

- **WHEN** the schema catalog contains a plane the project config does not list
- **THEN** `openspec update` reports the available plane and offers to add it
- **AND** leaves the config unchanged if the user declines

#### Scenario: Nothing to sync

- **WHEN** the project config already lists every catalog plane it wants
- **THEN** `openspec update` makes no plane changes
