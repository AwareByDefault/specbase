---
id: behavior.cli.config
---

### Requirement: The config command exposes one subcommand per configuration operation
**ID:** config-subcommands
The `config` command SHALL expose `path`, `list`, `get`, `set`, `unset`, `reset`,
and `edit` as subcommands, and its help SHALL name each one with what it does. A
user SHALL be able to reach every read and write operation on the stored
preferences without editing the file by hand.

#### Scenario: Help names every operation
**ID:** subcommands-listed
- **WHEN** a user asks for the `config` command's help
- **THEN** `path`, `list`, `get`, `set`, `unset`, `reset`, and `edit` are listed
- **AND** each carries a one-line description of what it does

#### Scenario: A read reports the resolved governed plane set
**ID:** resolved-planes-readable
- **WHEN** a user reads the spec-model plane key on a governed project
- **THEN** the command prints the resolved plane records
- **AND** the output includes the default planes together with any plane the
  project appended or replaced

### Requirement: The config command reports where its settings are stored
**ID:** config-path-output
The `config path` subcommand SHALL print the absolute path of the configuration
file and nothing else, so the path can be consumed by another command.

#### Scenario: The stored location is printed
**ID:** path-printed
- **WHEN** a user runs `config path`
- **THEN** the absolute path of the configuration file is the only thing printed

### Requirement: The config command shows every effective setting
**ID:** config-listing
The `config list` subcommand SHALL display every effective setting, indenting
nested values under their parent key, and SHALL mark which values come from an
explicit setting and which come from a default.

#### Scenario: Settings are listed with nesting
**ID:** list-human-readable
- **WHEN** a user runs `config list`
- **THEN** every effective setting is shown
- **AND** nested values appear indented under their parent key
- **AND** each value is marked as explicit or default

### Requirement: Reading a key prints the raw value only
**ID:** config-get-raw
The `config get` subcommand SHALL print the value at the requested key with no
label or decoration, SHALL print an object or array value as JSON, and SHALL
print nothing and fail when the key holds no value.

#### Scenario: A scalar value is printed bare
**ID:** get-scalar-raw
- **WHEN** a user reads a key holding a scalar value
- **THEN** the value alone is printed, with no label and no formatting

#### Scenario: A structured value is printed as JSON
**ID:** get-object-as-json
- **WHEN** a user reads a key holding an object or an array
- **THEN** the value is printed as JSON

#### Scenario: An unset key prints nothing
**ID:** get-missing-key-empty
- **WHEN** a user reads a key that holds no value
- **THEN** nothing is printed
- **AND** the command fails

### Requirement: Writing a key infers the value's type
**ID:** config-set-coercion
The `config set` subcommand SHALL store `true` and `false` as booleans, a numeric
literal as a number, a JSON array or object literal as that structure, and any
other text as a string. `--string` SHALL force the text to be stored verbatim as
a string. Writing a nested key SHALL create the intermediate objects it needs.
The command SHALL confirm the key and the value it stored.

#### Scenario: Types are inferred from the literal
**ID:** set-coerces-types
- **WHEN** a user sets a key to `true`, to a number, or to a JSON array literal
- **THEN** the value is stored as a boolean, a number, or an array respectively
- **AND** text that matches none of those is stored as a string

#### Scenario: A literal string is forced
**ID:** set-forced-string
- **WHEN** a user sets a key with `--string`
- **THEN** the text is stored as a string even when it looks like a boolean or a
  number

#### Scenario: A nested key creates its parents
**ID:** set-nested-creates-path
- **WHEN** a user sets a nested key whose parent object does not exist
- **THEN** the intermediate objects are created
- **AND** the value is stored at the nested key
- **AND** the command confirms the key and the stored value

### Requirement: Clearing a key restores its default
**ID:** config-unset-reverts
The `config unset` subcommand SHALL delete the stored override for a key so the
key returns to its default value, and SHALL say whether the key had been set.

#### Scenario: A stored override is removed
**ID:** unset-existing
- **WHEN** a user clears a key that was set
- **THEN** the stored override is deleted
- **AND** the key reads back as its default
- **AND** the command confirms the key was cleared

#### Scenario: Clearing an unset key is reported, not an error
**ID:** unset-absent
- **WHEN** a user clears a key that was never set
- **THEN** the command reports that the key was not set

### Requirement: Resetting the configuration is guarded twice
**ID:** config-reset-guarded
The `config reset` subcommand SHALL refuse to run unless the user asked for all
settings explicitly, and SHALL then confirm before discarding them. A user who
answers no SHALL keep every stored setting. A user who asked to skip prompts
SHALL have the reset applied without a confirmation.

#### Scenario: Reset without the explicit scope is refused
**ID:** reset-requires-all
- **WHEN** a user runs `config reset` without asking for all settings
- **THEN** the command refuses and states that the all-settings flag is required
- **AND** no stored setting changes

#### Scenario: Reset asks before discarding
**ID:** reset-confirms
- **WHEN** a user runs `config reset` for all settings in an interactive session
- **THEN** the command asks for confirmation first
- **AND** answering no leaves every stored setting untouched

#### Scenario: Confirmation can be skipped deliberately
**ID:** reset-skip-confirm
- **WHEN** a user runs `config reset` for all settings and asks to skip prompts
- **THEN** the settings are reset to their defaults without a prompt

### Requirement: Editing opens the configuration in the user's editor
**ID:** config-edit-editor
The `config edit` subcommand SHALL open the configuration file in the editor the
environment names, SHALL create that file with defaults first when it does not
exist, and SHALL wait for the editor to close before returning. When the
environment names no editor, the command SHALL refuse and say which variable to
set.

#### Scenario: The editor is opened and awaited
**ID:** edit-opens-and-waits
- **GIVEN** the environment names an editor
- **WHEN** a user runs `config edit`
- **THEN** the configuration file is created with defaults if it was absent
- **AND** the file is opened in that editor
- **AND** the command returns only after the editor closes

#### Scenario: No editor is a refusal with a fix
**ID:** edit-no-editor
- **WHEN** a user runs `config edit` and the environment names no editor
- **THEN** the command refuses and names the environment variable to set

### Requirement: Configuration keys are addressed by dotted camelCase paths
**ID:** config-key-naming
Every subcommand that takes a key SHALL accept the same key vocabulary: camelCase
names matching the stored structure, joined by `.` to reach a nested value. A key
path SHALL mean the same thing to read, write, and clear.

#### Scenario: The same dotted path reads, writes, and clears
**ID:** dotted-key-path
- **WHEN** a user names a nested key such as `featureFlags.someFlag`
- **THEN** the path is traversed one camelCase segment at a time
- **AND** reading, writing, and clearing that path all address the same value
