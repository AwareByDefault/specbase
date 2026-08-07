---
id: behavior.workflow.instructions
---

### Requirement: Instructions give an author everything needed to write one artifact
**ID:** artifact-instructions
The system SHALL emit, for a named artifact of a named change, the artifact's
metadata — change name, artifact ID, resolved schema, and output path — its
template, the completion state of each dependency, and the artifacts that this
one unlocks. A change with nothing written yet SHALL be served the same way.

#### Scenario: Metadata and template
**ID:** instructions-metadata-and-template
- **WHEN** a user requests instructions for an artifact
- **THEN** the output carries the change name, artifact ID, resolved schema name,
  and output path, together with the artifact's template content

#### Scenario: Dependency state is shown
**ID:** instructions-dependency-state
- **WHEN** the artifact has dependencies
- **THEN** each dependency is shown as done or missing
- **AND** an artifact with no dependencies is marked as a root artifact

#### Scenario: What this artifact unlocks
**ID:** instructions-unlocked
- **WHEN** instructions are generated
- **THEN** the output names the artifacts that become available once this one exists

#### Scenario: Blocked artifact still gets instructions
**ID:** instructions-when-blocked
- **WHEN** a user requests instructions for an artifact whose dependencies are unmet
- **THEN** the instructions are still emitted, carrying a warning about the
  missing dependencies

#### Scenario: Change with nothing written yet
**ID:** instructions-on-empty-change
- **WHEN** a user requests instructions for the first artifact of a change whose
  directory holds nothing
- **THEN** the template and metadata are emitted without requiring any artifact
  to already exist

### Requirement: Apply instructions gather the change's context for implementation
**ID:** apply-instructions
The system SHALL emit, when implementation is requested for a change, the
concrete paths of every artifact that exists grouped by artifact ID, the
schema's implementation instruction, the progress-tracking file when the schema
names one, and the artifact IDs that gate implementation.

#### Scenario: Required artifacts are all present
**ID:** apply-context-ready
- **WHEN** implementation instructions are requested and every gating artifact exists
- **THEN** the output carries the concrete paths of the existing artifacts keyed
  by artifact ID, the schema's instruction, and the progress file when one is named

#### Scenario: Required artifacts are missing
**ID:** apply-context-blocked
- **WHEN** implementation instructions are requested and a gating artifact is missing
- **THEN** the output says implementation is blocked and names the artifacts that
  must be created first

### Requirement: Instruction paths come from the resolved planning home
**ID:** instructions-use-resolved-paths
The system SHALL build every path it emits from the resolved planning home for
the change rather than from an assumed repository-relative location, so a change
that lives outside the repository is addressed correctly.

#### Scenario: A change held in the repository
**ID:** repo-local-paths-preserved
- **WHEN** instructions are requested for a change held in the repository
- **THEN** the emitted paths are the repository-relative ones the user expects

#### Scenario: A change held outside the repository
**ID:** external-planning-home-paths
- **WHEN** instructions are requested for a change whose planning home is not the
  repository
- **THEN** the emitted paths point into that planning home

### Requirement: Project context is injected into every artifact's instructions
**ID:** context-injection
The system SHALL inject the project config's context into the instructions for
every artifact, wrapped in an opening and closing `<project_context>` tag with
the content on its own lines, positioned before the template. Absent or empty
context SHALL produce no such block at all.

#### Scenario: Context is present
**ID:** context-present
- **WHEN** the project config carries context
- **THEN** the instructions for every artifact carry that context inside a
  `<project_context>` block, ahead of the template

#### Scenario: Context is absent
**ID:** context-absent
- **WHEN** the project config carries no context
- **THEN** no `<project_context>` block appears in any artifact's instructions

#### Scenario: Multi-line context
**ID:** context-multiline
- **WHEN** the context spans several lines
- **THEN** the line breaks are preserved inside the tags

### Requirement: Injected context and rules are reproduced verbatim
**ID:** verbatim-injection
The system SHALL inject context and rule text exactly as the project config
wrote it, without escaping, rewriting, or interpreting it.

#### Scenario: Markup characters
**ID:** verbatim-markup-characters
- **WHEN** injected text contains angle brackets, ampersands, or quotes
- **THEN** those characters appear unchanged in the instructions

#### Scenario: Markdown and links
**ID:** verbatim-markdown
- **WHEN** injected text contains Markdown formatting or a URL
- **THEN** it appears unrendered and unchanged in the instructions

#### Scenario: Line breaks inside a rule
**ID:** verbatim-multiline-rule
- **WHEN** a single rule's text contains line breaks
- **THEN** those line breaks survive into the rendered rule

### Requirement: Rules reach only the artifact they name
**ID:** rules-scoped-to-artifact
The system SHALL inject a rule set into an artifact's instructions only when the
config keys that rule set by that artifact's ID, and SHALL let different
artifacts in one project carry different rule sets.

#### Scenario: The artifact has rules
**ID:** rules-for-named-artifact
- **WHEN** the config keys a non-empty rule set by an artifact's ID
- **THEN** that artifact's instructions carry those rules

#### Scenario: The artifact has none
**ID:** rules-absent-for-others
- **WHEN** the config keys rules by some other artifact's ID, keys nothing at all,
  or keys an empty list
- **THEN** no `<rules>` block appears in this artifact's instructions

#### Scenario: Different rules per artifact
**ID:** rules-differ-per-artifact
- **WHEN** the config keys different rule sets by several artifact IDs
- **THEN** each artifact's instructions carry only its own rule set

### Requirement: Rules render as a tagged bullet list between context and template
**ID:** rules-formatting
The system SHALL wrap an artifact's rules in an opening and closing `<rules>`
tag with one bullet per rule, placed after the context section and before the
template.

#### Scenario: One bullet per rule
**ID:** rules-one-bullet-each
- **WHEN** an artifact carries several rules
- **THEN** each appears as its own bullet inside the `<rules>` block

#### Scenario: Section order
**ID:** rules-section-order
- **WHEN** instructions carry both context and rules
- **THEN** the order is context, then rules, then template

### Requirement: Rules add to the schema's guidance rather than replace it
**ID:** rules-are-additive
The system SHALL keep the schema's own guidance for an artifact intact and add
the config's rules to it, so an author sees both.

#### Scenario: Both are present
**ID:** schema-guidance-and-rules-both-shown
- **WHEN** an artifact has schema guidance and the config supplies rules for it
- **THEN** the instructions carry the schema's guidance and the config's rules together

### Requirement: Unknown artifact IDs in rules surface when instructions load
**ID:** rules-id-validation-at-load
The system SHALL NOT check rule keys against the schema while reading config,
because the schema is not yet known there. It SHALL check them when instructions
are generated, warn once per unknown ID naming the schema's valid IDs, and repeat
no warning within a session.

#### Scenario: Config with an unknown key still loads
**ID:** config-loads-despite-unknown-key
- **WHEN** the project config keys rules by an ID the schema does not declare
- **THEN** the config loads without error

#### Scenario: The warning arrives at instruction time
**ID:** warning-at-instruction-time
- **WHEN** instructions are generated and the config keys rules by an unknown ID
- **THEN** a warning names the unknown ID and lists the schema's valid artifact IDs
- **AND** a separate warning is emitted for each unknown ID

#### Scenario: No warning for valid keys
**ID:** no-warning-for-valid-keys
- **WHEN** every rule key names an artifact the schema declares
- **THEN** no warning is emitted

#### Scenario: Warnings do not repeat
**ID:** warning-once-per-session
- **WHEN** instructions are generated more than once in a session
- **THEN** each distinct warning is shown only once

### Requirement: Governed instructions carry the plane and pair context
**ID:** governed-instruction-context
The system SHALL, under a governed schema, add to instruction output the target
roots for each declared plane, the paired specification and enforcement paths
for the change, the identity requirements those artifacts must satisfy, and the
corresponding current pairs where they exist. Under a non-governed schema the
output SHALL be unchanged.

#### Scenario: Authoring a governed specification
**ID:** governed-spec-instructions
- **WHEN** instructions for a governed specification artifact are requested
- **THEN** the output identifies the target root for each declared plane
- **AND** states that the specification needs a project-unique identity plus
  pair-local requirement and scenario identities

#### Scenario: Authoring governed enforcement
**ID:** governed-enforcement-instructions
- **WHEN** instructions for a governed enforcement artifact are requested
- **THEN** the output names every enforcement path paired with an authored
  specification, and states that bindings need pair-local identities and must
  name the normative identities they cover

#### Scenario: Implementing a governed change
**ID:** governed-apply-context
- **WHEN** implementation instructions are requested under a governed schema
- **THEN** the gathered context carries every specification and enforcement
  delta of the change, plus the corresponding current pairs where they exist

#### Scenario: A non-governed schema is untouched
**ID:** non-governed-instructions-unchanged
- **WHEN** instructions are requested under a non-governed schema
- **THEN** the paths and context are exactly what they were, with no governed
  fields added
