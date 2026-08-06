## MODIFIED Requirements

### Requirement: Command Structure
The config command SHALL provide subcommands for all configuration operations, including inspecting the resolved governed plane set.

#### Scenario: Available subcommands
- **WHEN** user executes `openspec config --help`
- **THEN** display available subcommands:
  - `path` - Show config file location
  - `list` - Show all current settings
  - `get <key>` - Get a specific value
  - `set <key> <value>` - Set a value
  - `unset <key> <value>` - Remove a key (revert to default)
  - `reset` - Reset configuration to defaults
  - `edit` - Open config in editor

#### Scenario: Inspect resolved planes
- **WHEN** user runs `openspec config get specModel.planes` on a governed project
- **THEN** the system prints the resolved plane records, including defaults and any appended or replaced planes