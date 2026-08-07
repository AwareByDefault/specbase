---
id: behavior.config.global
---

## ADDED Requirements

### Requirement: User-level preferences live in one editable JSON file
**ID:** global-config-store
The system SHALL keep every user-level preference in a single JSON file in the
user's configuration directory. The file SHALL stay valid JSON that a user can
read and edit by hand, and every write SHALL preserve the fields the system did
not change.

#### Scenario: Stored form is user-readable
**ID:** readable-json
- **WHEN** the system stores user-level preferences
- **THEN** the file holds valid JSON that a user can read and modify

#### Scenario: Unrelated fields survive a write
**ID:** existing-fields-preserved
- **WHEN** the system writes one preference into an existing configuration file
- **THEN** every other field in that file is preserved

### Requirement: The configuration directory follows the platform's convention
**ID:** global-config-location
The system SHALL resolve the user-level configuration directory from
`XDG_CONFIG_HOME` when it is set, from the user's home configuration directory
on Unix-like platforms otherwise, and from the platform's roaming application
data directory on Windows.

#### Scenario: Explicit configuration home
**ID:** xdg-config-home-honoured
- **WHEN** `XDG_CONFIG_HOME` is set
- **THEN** the configuration directory resolves beneath that path

#### Scenario: Unix-like default
**ID:** unix-default-location
- **WHEN** `XDG_CONFIG_HOME` is unset on a Unix-like platform
- **THEN** the configuration directory resolves beneath the user's home configuration directory

#### Scenario: Windows default
**ID:** windows-default-location
- **WHEN** the platform is Windows and `XDG_CONFIG_HOME` is unset
- **THEN** the configuration directory resolves beneath the roaming application data directory

### Requirement: Reading preferences never fails and never writes
**ID:** global-config-load-defaults
The system SHALL return a complete default configuration when the configuration
file is absent or unreadable, SHALL warn on unreadable content, and SHALL create
no directory and no file while reading.

#### Scenario: No configuration file yet
**ID:** absent-file-defaults
- **WHEN** no configuration file exists
- **THEN** the system returns the default configuration
- **AND** creates neither the directory nor the file

#### Scenario: Unreadable configuration file
**ID:** invalid-json-defaults-with-warning
- **WHEN** the configuration file holds content that is not valid JSON
- **THEN** the system returns the default configuration and warns on the error stream

#### Scenario: Defaults are complete
**ID:** default-shape
- **WHEN** the system returns the default configuration
- **THEN** every field the current preference model defines carries its default value

### Requirement: Saving preferences creates whatever the write needs
**ID:** global-config-save
The system SHALL write the configuration file on save, creating the
configuration directory first when it does not exist, and SHALL replace the
previous file contents with the supplied configuration.

#### Scenario: First save
**ID:** save-creates-directory
- **WHEN** preferences are saved and the configuration directory does not exist
- **THEN** the directory is created and the configuration file is written

#### Scenario: Later save
**ID:** save-overwrites
- **WHEN** preferences are saved and a configuration file already exists
- **THEN** the file is replaced with the supplied configuration

### Requirement: Older configuration files keep working as the model grows
**ID:** schema-evolution-merge
The system SHALL merge a loaded configuration over the current defaults, so a
field added after the file was written resolves to its default while every
stored value wins over the default. The system SHALL preserve fields it does not
recognise and SHALL raise no error for them.

#### Scenario: File predates a new field
**ID:** missing-new-field-gets-default
- **WHEN** the stored configuration omits a field the current model defines
- **THEN** the returned configuration carries that field's default value

#### Scenario: Stored value wins
**ID:** stored-value-wins
- **WHEN** the stored configuration sets a field the defaults also define
- **THEN** the returned configuration carries the stored value

#### Scenario: Unrecognised fields survive
**ID:** unknown-fields-preserved
- **WHEN** the stored configuration holds fields the current model does not define
- **THEN** those fields are returned unchanged and no error or warning is raised

### Requirement: The configuration schema is the authority on every write
**ID:** config-schema-is-authority
The system SHALL validate every preference write against the configuration
schema. A write to a key the schema does not declare SHALL be refused unless the
caller explicitly asks to allow unknown keys. A write of a value the schema
rejects SHALL be refused. A refused write SHALL leave the stored configuration
unchanged.

#### Scenario: Undeclared key
**ID:** unknown-key-rejected
- **WHEN** a write targets a key the schema does not declare
- **THEN** the write is refused with a message naming the invalid key
- **AND** the stored configuration is unchanged

#### Scenario: Undeclared key allowed on purpose
**ID:** unknown-key-allowed-with-override
- **WHEN** the caller explicitly asks to allow unknown keys
- **THEN** the value is stored

#### Scenario: Value the schema rejects
**ID:** invalid-value-rejected
- **WHEN** a write supplies a value of a type the schema does not accept for that key
- **THEN** the write is refused with a descriptive message
- **AND** the stored configuration is unchanged
