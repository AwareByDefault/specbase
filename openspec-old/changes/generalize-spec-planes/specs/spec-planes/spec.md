## ADDED Requirements

### Requirement: Planes declared as schema data

The governed spec model SHALL resolve its plane taxonomy from schema-declared data rather than a closed-source enum, so a project may add, remove, or replace planes without a code change.

#### Scenario: Default planes ship in the schema

- **WHEN** a project selects the governed schema and declares no planes of its own
- **THEN** the resolved plane set is the schema's declared defaults
- **AND** the defaults include `behavior`, `architecture`, `ops`, and `code-quality`

#### Scenario: Project appends a plane

- **WHEN** a project's `openspec/config.yaml` declares `specModel.planes+` with a new plane record
- **THEN** the resolved plane set is the schema defaults plus the appended plane
- **AND** the appended plane is addressable like any default plane

#### Scenario: Project replaces the plane set

- **WHEN** a project's `openspec/config.yaml` declares `specModel.planes` with a full list
- **THEN** the resolved plane set is exactly that list
- **AND** no schema default planes are implied beyond the list

#### Scenario: Legacy project remains unchanged

- **WHEN** a project selects a legacy (non-governed) schema
- **THEN** the resolved spec model has no planes
- **AND** legacy flat parsing, discovery, and archive behavior remain unchanged

### Requirement: Per-plane metadata record

Each declared plane SHALL carry structured metadata so classification, authoring, and review can read its meaning from data rather than prompt prose.

#### Scenario: Required fields

- **WHEN** a plane record is resolved
- **THEN** it has a kebab-case `id` and a non-empty `purpose`
- **AND** it declares an `enforcementFlavor` describing the binding mechanisms suited to it

#### Scenario: Optional review lens

- **WHEN** a plane declares a `reviewLens`
- **THEN** the lens with that id is the default reviewer for the plane's specs
- **AND** a plane without `reviewLens` is still valid and is judged by cross-cutting lenses only

#### Scenario: Cross-cutting plane

- **WHEN** a plane declares `crossCutting: true`
- **THEN** it has no storage home under `specs/<id>/`
- **AND** it participates as a review lens only

### Requirement: Arbitrary plane locators

Governed specs SHALL reside under `openspec/specs/<plane>/<locator>/spec.md` for any declared plane id, and discovery SHALL recursively find pairs beneath every declared plane root.

#### Scenario: Spec under a non-default plane

- **WHEN** a project declares a `security` plane and a pair exists at `specs/security/secret-handling/`
- **THEN** list, show, validate, sync, and archive discover and address it as `security/secret-handling`

#### Scenario: Unknown plane rejected

- **WHEN** a pair exists under a directory whose name is not in the resolved plane set
- **THEN** validation reports the unknown plane with its source path
- **AND** the pair is not treated as a governed pair

#### Scenario: Nested locator under any plane

- **WHEN** a pair exists at the native path corresponding to `ops/infrastructure/terraform`
- **THEN** it is addressed by the normalized locator `ops/infrastructure/terraform` on every supported platform

### Requirement: Stable scoped identities with open plane prefixes

Spec IDs SHALL use the `<plane>.<locator>` form with any declared plane id as the prefix, and the spec-ID index SHALL accept arbitrary declared plane prefixes.

#### Scenario: Spec ID with non-default plane

- **WHEN** a governed spec's frontmatter declares `id: security.secret-handling`
- **AND** `security` is a declared plane
- **THEN** the spec-ID index accepts and resolves the id

#### Scenario: Spec ID with unknown plane prefix

- **WHEN** a spec's frontmatter declares an id whose prefix is not a declared plane
- **THEN** validation reports the unknown plane prefix with the source path

### Requirement: Governed awareness generated from resolved planes

The governed prompt guidance appended to skill and command files SHALL be generated from the resolved plane set at `openspec init` and `openspec update` time, so a project's plane roster is baked into its generated prompts without a runtime CLI fetch.

#### Scenario: Init writes plane-aware guidance

- **WHEN** `openspec init` generates skills for a governed project
- **THEN** the generated skill files contain awareness for each resolved plane, including its `purpose` and trigger guidance

#### Scenario: Update regenerates from current config

- **WHEN** a project's `config.yaml` plane set changes and `openspec update` runs
- **THEN** the generated skill and command files are rewritten to reflect the current plane set

#### Scenario: Legacy prompt base preserved

- **WHEN** skills are generated for a legacy (non-governed) project
- **THEN** the generated skill files are byte-identical to the legacy flat prompts
- **AND** no governed plane awareness is appended

### Requirement: Plane declaration validation

The CLI SHALL validate the resolved plane set and report actionable diagnostics for malformed declarations before generating prompts or accepting specs.

#### Scenario: Non-kebab plane id

- **WHEN** a plane record's `id` is not kebab-case
- **THEN** validation reports the offending id and source location

#### Scenario: Duplicate plane id

- **WHEN** two plane records in the resolved set share an `id`
- **THEN** validation reports the collision and source locations

#### Scenario: Missing purpose

- **WHEN** a plane record omits `purpose` or declares it empty
- **THEN** validation reports the missing field and source location

#### Scenario: Reserved plane id

- **WHEN** a plane record's `id` is a reserved word (`spec`, `specs`, `enforcement`)
- **THEN** validation rejects it to avoid ambiguity with directory roles

#### Scenario: Append collides with default

- **WHEN** a project appends a plane whose `id` duplicates a schema default
- **THEN** validation reports the collision and suggests replacing or renaming