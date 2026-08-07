# config-loading Specification

## Purpose
Define how `openspec/config.yaml` is discovered, parsed, validated, and exposed to callers with safe fallbacks.
## Requirements
### Requirement: Load project config from openspec/config.yaml

The system SHALL read and parse the project configuration file located at `openspec/config.yaml` relative to the project root.

#### Scenario: Valid config file exists
- **WHEN** `openspec/config.yaml` exists with valid YAML content
- **THEN** system parses the file and returns a ProjectConfig object

#### Scenario: Config file does not exist
- **WHEN** `openspec/config.yaml` does not exist
- **THEN** system returns null without error

#### Scenario: Config file has invalid YAML syntax
- **WHEN** `openspec/config.yaml` contains malformed YAML
- **THEN** system logs a warning message and returns null

#### Scenario: Config file has valid YAML but invalid schema
- **WHEN** `openspec/config.yaml` contains valid YAML that fails Zod schema validation
- **THEN** system logs a warning message with validation details and returns null

### Requirement: Support .yml file extension alias

The system SHALL accept both `.yaml` and `.yml` file extensions for the config file.

#### Scenario: Config file uses .yml extension
- **WHEN** `openspec/config.yml` exists and `openspec/config.yaml` does not exist
- **THEN** system reads from `openspec/config.yml`

#### Scenario: Both .yaml and .yml exist
- **WHEN** both `openspec/config.yaml` and `openspec/config.yml` exist
- **THEN** system prefers `openspec/config.yaml`

### Requirement: Use resilient field-by-field parsing

The system SHALL parse each config field independently, collecting valid fields and warning about invalid ones without rejecting the entire config.

#### Scenario: Schema field is valid
- **WHEN** config contains `schema: "spec-driven"`
- **THEN** schema field is included in returned config

#### Scenario: Schema field is missing
- **WHEN** config lacks the `schema` field
- **THEN** no warning is logged (field is optional at parse level)

#### Scenario: Schema field is empty string
- **WHEN** config contains `schema: ""`
- **THEN** warning is logged and schema field is not included in returned config

#### Scenario: Schema field is invalid type
- **WHEN** config contains `schema: 123` (number instead of string)
- **THEN** warning is logged and schema field is not included in returned config

#### Scenario: Context field is valid
- **WHEN** config contains `context: "Tech stack: TypeScript"`
- **THEN** context field is included in returned config

#### Scenario: Context field is invalid type
- **WHEN** config contains `context: 123` (number instead of string)
- **THEN** warning is logged and context field is not included in returned config

#### Scenario: Rules field has valid structure
- **WHEN** config contains `rules: { proposal: ["Rule 1"], specs: ["Rule 2"] }`
- **THEN** rules field is included in returned config with valid rules

#### Scenario: Rules field has non-array value for artifact
- **WHEN** config contains `rules: { proposal: "not an array", specs: ["Valid"] }`
- **THEN** warning is logged for proposal, but specs rules are still included in returned config

#### Scenario: Rules array contains non-string elements
- **WHEN** config contains `rules: { proposal: ["Valid rule", 123, ""] }`
- **THEN** only "Valid rule" is included, warning logged about invalid elements

#### Scenario: Mix of valid and invalid fields
- **WHEN** config contains valid schema, invalid context type, valid rules
- **THEN** config is returned with schema and rules fields, warning logged about context

### Requirement: Enforce context size limit

The system SHALL reject context fields exceeding 50KB and log a warning.

#### Scenario: Context within size limit
- **WHEN** config contains context of 1KB
- **THEN** context is included in returned config

#### Scenario: Context at size limit
- **WHEN** config contains context of exactly 50KB
- **THEN** context is included in returned config

#### Scenario: Context exceeds size limit
- **WHEN** config contains context of 51KB
- **THEN** warning is logged with size and limit, context field is not included in returned config

### Requirement: Defer artifact ID validation to instruction loading

The system SHALL NOT validate artifact IDs in rules during config load time. Validation happens during instruction loading when schema is known.

#### Scenario: Config with rules is loaded
- **WHEN** config contains `rules: { unknownartifact: [...] }`
- **THEN** config is loaded successfully without validation errors

#### Scenario: Validation happens at instruction load time
- **WHEN** instructions are loaded for any artifact and config has unknown artifact IDs in rules
- **THEN** warnings are emitted about unknown artifact IDs (see rules-injection spec for details)

### Requirement: Gracefully handle config errors without halting

The system SHALL continue operation with default values when config loading or parsing fails.

#### Scenario: Config parse failure during command execution
- **WHEN** config file has syntax errors and user runs `openspec new change`
- **THEN** command executes using default schema "spec-driven"

#### Scenario: Warning is visible to user
- **WHEN** config loading fails
- **THEN** system outputs warning message to stderr with details about the failure

### Requirement: Derive specModel.kind from the resolved plane set

Config loading SHALL derive `specModel.kind` from the resolved plane set: non-empty resolves to `governed`, empty resolves to `flat`. A `kind` value that disagrees with the resolved plane count SHALL NOT override the derivation. The resolved plane list SHALL be loaded from the schema's single offer-able plane list combined with the project config's append (`planes+:`) or replace (`planes:`) declarations.

#### Scenario: Non-empty plane set loads as governed

- **WHEN** the resolved plane set for a project is non-empty
- **THEN** `specModel.kind` loads as `governed`

#### Scenario: Empty plane set loads as flat

- **WHEN** the resolved plane set for a project is empty
- **THEN** `specModel.kind` loads as `flat`

#### Scenario: Append and replace semantics preserved

- **WHEN** a project config declares `specModel.planes+:` or `specModel.planes:`
- **THEN** the resolved plane set applies append-vs-replace against the schema's offered planes as before

### Requirement: A declared plane list is authoritative

When a project config declares `specModel.planes:` (replace), config loading SHALL resolve the plane set to exactly that list, independent of the schema's declared planes. A plane the schema declares but the config omits SHALL NOT be resolved; an empty declared list SHALL resolve to the flat model.

#### Scenario: Config list wins over schema defaults

- **WHEN** a config declares `specModel.planes:` omitting a plane the schema declares
- **THEN** the resolved plane set excludes that plane

#### Scenario: Append and default paths are unchanged

- **WHEN** a config uses `specModel.planes+:` or omits `specModel` entirely
- **THEN** resolution applies append-onto-defaults or the schema default subset exactly as before

