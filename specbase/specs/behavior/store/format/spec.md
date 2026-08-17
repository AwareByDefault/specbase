---
id: behavior.store.format
---

## Purpose
This spec governs the machine-readable shape of governed truth and enforcement so parsers, validators, synchronization, and authors share one concise stable contract.

### Requirement: A spec states requirements in one parseable structure
**ID:** structured-spec-format
A specification SHALL express each requirement as a level-3 `### Requirement:`
header followed by a normative body containing SHALL or MUST, and SHALL give
each requirement at least one level-4 `#### Scenario:` section whose steps are
bullets keyed by the bold words GIVEN, WHEN, THEN, and AND. The tool SHALL
parse that structure and SHALL reject a requirement that lacks a scenario.

#### Scenario: A well-formed requirement parses
**ID:** requirement-parses
- **WHEN** a spec declares a `### Requirement:` header with a normative body and
  at least one `#### Scenario:` section
- **THEN** the tool parses the requirement, its body text, and its scenarios

#### Scenario: A requirement without a scenario is rejected
**ID:** scenario-required
- **WHEN** a requirement declares no scenario
- **THEN** validation reports the requirement as incomplete

#### Scenario: A requirement without a normative keyword is reported
**ID:** normative-keyword-required
- **WHEN** a requirement body contains neither SHALL nor MUST
- **THEN** validation reports the missing normative keyword

### Requirement: Requirements carry a stable identity that survives renaming
**ID:** requirement-identity
A governed pair SHALL carry a project-unique stable spec identifier, and each
requirement, scenario, and enforcement binding within it SHALL carry a
pair-local stable identifier; headers are mutable display names and SHALL NOT
be used as identity. A legacy flat spec SHALL keep normalized-header identity,
where the normalized header is the trimmed header compared case-sensitively.
Duplicate identity SHALL be reported with every conflicting source location.

#### Scenario: A renamed heading keeps its reference
**ID:** identity-survives-title-change
- **WHEN** a governed requirement's display title changes but its local
  identifier does not
- **THEN** references from enforcement and synchronization still resolve

#### Scenario: A moved pair keeps its identity
**ID:** identity-survives-move
- **WHEN** a governed pair moves to a different locator
- **THEN** lookup and synchronization resolve it by its stable spec identifier

#### Scenario: Duplicate identifiers are reported with their locations
**ID:** duplicate-identity-reported
- **WHEN** two pairs declare the same spec identifier, or one pair declares the
  same local identifier twice
- **THEN** validation reports each conflicting source location

#### Scenario: A legacy spec matches by normalized header
**ID:** legacy-header-identity
- **WHEN** a legacy delta is reconciled against a legacy spec
- **THEN** requirements are matched by their trimmed headers, compared
  case-sensitively
- **AND** duplicate headers within one spec are reported as errors

### Requirement: A change stores deltas, not future states
**ID:** delta-storage
A change SHALL record only what it changes about a spec, under the sections
`## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`,
and `## RENAMED Requirements`. An added or modified requirement SHALL be written
in full using the structured format rather than as a diff, a modified
requirement SHALL reuse the target's identity, and a removed requirement SHALL
state why it is removed. A governed delta SHALL live under the same
plane-qualified locator as the pair it targets and SHALL carry both the
specification and the enforcement half.

#### Scenario: An addition carries its complete text
**ID:** added-is-complete
- **WHEN** a change adds a requirement
- **THEN** the requirement appears under `## ADDED Requirements` with its full
  body and scenarios

#### Scenario: A modification restates the requirement in full
**ID:** modified-is-complete
- **WHEN** a change modifies an existing requirement
- **THEN** the complete modified requirement appears under
  `## MODIFIED Requirements`, identified as the existing requirement, with no
  diff syntax

#### Scenario: A removal records its reason
**ID:** removed-has-reason
- **WHEN** a change removes a requirement
- **THEN** it appears under `## REMOVED Requirements` with the reason for its
  removal

#### Scenario: A governed delta mirrors the target locator
**ID:** governed-delta-locator
- **WHEN** a change modifies a governed pair
- **THEN** its delta lives under the same plane-qualified locator
- **AND** carries both the specification and enforcement files for that locator

#### Scenario: Delta section headers are recognized regardless of case
**ID:** delta-headers-case-insensitive
- **WHEN** a delta section header differs from the canonical spelling only by
  letter case or spacing
- **THEN** the section is still recognized as that delta operation

### Requirement: A rename is stated explicitly, from old name to new
**ID:** rename-semantics
A change that renames a requirement SHALL declare both names under
`## RENAMED Requirements` as an explicit FROM and TO pair. When the renamed
requirement's content also changes, the modification SHALL be written under the
new name. Delta operations SHALL be applied rename-first, so that later
operations address the requirement by its new name.

#### Scenario: A rename declares both names
**ID:** rename-from-and-to
- **WHEN** a change renames a requirement
- **THEN** `## RENAMED Requirements` names the old header and the new header
  explicitly

#### Scenario: A rename plus edit uses the new name
**ID:** rename-then-modify
- **WHEN** a change both renames and modifies one requirement
- **THEN** the modified block is written under the new header
- **AND** a modified block written under the old header is reported as an error

#### Scenario: Renames are applied before other operations
**ID:** rename-applied-first
- **WHEN** a change's deltas are applied to a spec
- **THEN** renames are applied first, then removals, then modifications, then
  additions

### Requirement: A proposal states each change from its current state to its future state
**ID:** proposal-format
A change proposal SHALL explain why the change is needed and SHALL describe each
behavioral change explicitly as a move from a current state to a future state,
with its reason and its impact. The proposal compensates for the absence of
inline diffs, so a reviewer can see what changes without reading the deltas.

#### Scenario: A proposal is readable on its own
**ID:** proposal-self-contained
- **WHEN** a reviewer reads a change proposal
- **THEN** it states the motivation, and for each change the current state, the
  intended state, the reason, and who is affected

#### Scenario: A proposal missing its motivation is reported
**ID:** proposal-missing-why
- **WHEN** a proposal omits its motivation section
- **THEN** validation reports the missing section

### Requirement: The parsed form of a spec or change is schema-validated
**ID:** parsed-structure-schema
The tool SHALL validate the parsed representation of a spec, a change, and a
governed pair against a runtime schema before acting on it, SHALL reject an
unknown value of a closed set with an error naming the accepted values, and
SHALL keep the parsed shape of a legacy spec unchanged.

#### Scenario: A malformed parsed structure is rejected
**ID:** schema-rejects-malformed
- **WHEN** a parsed spec or change is missing a required field or carries an
  empty required value
- **THEN** the schema rejects it with a message naming the offending field

#### Scenario: A governed pair validates its identity fields
**ID:** schema-validates-governed-pair
- **WHEN** a governed pair is parsed
- **THEN** its stable spec identity, plane, locator, pair-local identifiers, and
  enforcement binding fields are validated
- **AND** an unknown closed-enum value is rejected with an actionable error

### Requirement: Files parse the same on every platform
**ID:** line-ending-tolerance
The parser SHALL identify sections, requirements, and scenarios identically
whether a file uses LF, CRLF, or CR line endings.

#### Scenario: A CRLF document validates
**ID:** crlf-parsed
- **WHEN** a change or spec saved with CRLF line endings is validated
- **THEN** its sections are recognized and no parsing error is raised

### Requirement: A requirement's whole body is read, not just its first line
**ID:** body-keyword-extraction
Requirement text SHALL be captured from after the `### Requirement:` header up
to the first header on a non-fenced line, skipping blank lines. Normative
keyword detection SHALL run over that whole captured body. Leading
`**metadata**:` lines SHALL be skipped only when other body text remains; a body
that is nothing but a metadata line SHALL be kept as the requirement text. A
requirement whose keyword appears only in its header SHALL NOT pass on that
basis, and SHALL instead receive a hint saying so. The delta reader and the spec
validator SHALL read bodies identically.

#### Scenario: The keyword is on a wrapped line
**ID:** keyword-on-later-line
- **WHEN** a requirement's normative keyword appears on the second or a later
  body line
- **THEN** both delta and spec validation detect it and report no missing-keyword
  error

#### Scenario: Metadata lines precede the description
**ID:** metadata-lines-skipped
- **WHEN** a requirement body opens with bold metadata lines before its
  normative description
- **THEN** validation skips them, reads the description, and passes

#### Scenario: The body is nothing but a metadata line
**ID:** metadata-only-body
- **WHEN** a requirement's entire body is a single bold metadata line carrying
  the normative keyword
- **THEN** that line is kept as the requirement text and the keyword is detected

#### Scenario: The keyword appears only in the header
**ID:** header-only-keyword-hinted
- **WHEN** a requirement carries its normative keyword only in its header
- **THEN** validation does not accept the header as the body
- **AND** reports a hint telling the author to state it in the body

#### Scenario: A stray divider bounds the body
**ID:** divider-bounds-body
- **WHEN** a stray header follows a requirement and its notes contain a
  normative keyword
- **THEN** the requirement body ends at that header and the keyword in the notes
  does not satisfy the check

### Requirement: Fenced code blocks are content, not structure
**ID:** fenced-block-fidelity
The parser and the validator SHALL ignore everything inside a fenced code block
when capturing requirement text, when locating the end of a body, and when
counting scenarios. A fenced block SHALL NOT become the requirement text, and a
scenario or delta header inside a fence SHALL NOT be counted as real.

#### Scenario: A fence precedes the prose line
**ID:** fence-before-prose
- **WHEN** a requirement body opens with a fenced code block before its prose
  line
- **THEN** the captured requirement text is the prose line, not the fence

#### Scenario: A fenced scenario is not a scenario
**ID:** fenced-scenario-not-counted
- **WHEN** a requirement's only `#### Scenario:` appears inside a fenced example
- **THEN** validation reports the requirement as missing a scenario

#### Scenario: A fenced delta header is not a delta section
**ID:** fenced-delta-header-ignored
- **WHEN** a delta section header appears inside a fenced example in a spec
- **THEN** it is not treated as a delta section

### Requirement: Enforcement is a direct YAML binding map
**ID:** `enforcement-yaml-format`
A governed pair SHALL store enforcement in a sibling `enforcement.yaml` file whose top-level `bindings` map uses each pair-local binding ID as a key. Each binding value SHALL contain exactly `type`, `covers`, and `source`; `covers` SHALL accept one requirement ID or a list of requirement IDs and normalize both forms identically.

#### Scenario: Compact enforcement parses
**ID:** `compact-enforcement-parses`
- **WHEN** `enforcement.yaml` declares a binding with a configured type, an existing requirement ID, and a non-empty source
- **THEN** the parser returns the binding ID, normalized covered requirement IDs, type, and source

#### Scenario: Extra mechanism fields are rejected
**ID:** `legacy-binding-fields-rejected`
- **WHEN** a compact binding also declares an inline command, target, procedure, strength, status, or limitation
- **THEN** validation reports those fields as unsupported in the compact manifest

#### Scenario: Enforcement identity comes from the pair
**ID:** `enforcement-identity-from-pair`
- **WHEN** an enforcement manifest is resolved beside `spec.md`
- **THEN** the containing pair supplies its stable spec identity and document grammar
- **AND** the manifest does not repeat either value

### Requirement: Markdown enforcement remains readable during migration
**ID:** `legacy-enforcement-reader`
The system SHALL prefer `enforcement.yaml` for governed pairs and SHALL continue to read a lone legacy `enforcement.md` during migration. A pair containing both filenames SHALL be reported as ambiguous rather than silently choosing one.

#### Scenario: Legacy pair remains readable
**ID:** `legacy-markdown-fallback`
- **WHEN** a governed pair contains `enforcement.md` and no `enforcement.yaml`
- **THEN** the system parses the legacy fenced YAML document

#### Scenario: Both filenames conflict
**ID:** `dual-enforcement-conflict`
- **WHEN** a governed pair contains both enforcement filenames
- **THEN** validation reports the ambiguity and does not report the pair ready
