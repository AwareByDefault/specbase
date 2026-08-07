## ADDED Requirements

### Requirement: Specs SHALL support optional structured frontmatter
A `spec.md` file MAY begin with a YAML frontmatter block delimited by `---`. When present, the parser SHALL read it into `Spec.metadata` carrying at minimum `type` and `labels`. When absent, the spec SHALL parse exactly as before with default metadata, preserving full backward compatibility.

#### Scenario: Spec with frontmatter
- **WHEN** a `spec.md` begins with a `---` block containing `type: invariant` and `labels: [invariant.security]`
- **THEN** the parsed spec exposes `metadata.type = "invariant"` and `metadata.labels = ["invariant.security"]`

#### Scenario: Spec without frontmatter
- **WHEN** a `spec.md` has no frontmatter block
- **THEN** the parsed spec exposes `metadata.type = "feature"` and `metadata.labels = []` and no parse error is raised

### Requirement: Requirements SHALL carry a stable id independent of their name
Each requirement SHALL have a stable `id` that is independent of its prose name. The id SHALL be the anchor used by external mappings (enforcement, provenance). When a requirement is renamed via the `## RENAMED Requirements` operation, its id SHALL be preserved.

#### Scenario: Id surfaces in JSON output
- **WHEN** a spec is shown with `--json`
- **THEN** each requirement object includes a non-empty `id` field

#### Scenario: Id survives a rename
- **WHEN** a change applies a `## RENAMED Requirements` operation changing a requirement's name
- **THEN** the requirement's `id` after the rename is identical to its id before the rename

### Requirement: Spec type SHALL be constrained to a known taxonomy
The `type` field SHALL be `feature`, `invariant`, or a dotted sub-label of either (e.g. `invariant.architecture`). Validation SHALL reject unknown root types with an actionable message naming the allowed roots.

#### Scenario: Valid dotted sub-label
- **WHEN** a spec declares `type: invariant.architecture`
- **THEN** validation passes and the root type resolves to `invariant`

#### Scenario: Unknown root type rejected
- **WHEN** a spec declares `type: epic`
- **THEN** validation fails with an error stating the allowed roots are `feature` and `invariant`

### Requirement: Requirement ids SHALL be unique within a spec
Validation SHALL reject a spec in which two requirements resolve to the same id, identifying both offending requirements.

#### Scenario: Duplicate ids rejected
- **WHEN** two requirements in one spec resolve to the id `persistence-port`
- **THEN** validation fails with an error listing both requirement names and the duplicated id
