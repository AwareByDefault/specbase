---
id: behavior.governed
---

### Requirement: A project becomes governed by resolving planes, not by a separate switch
**ID:** governance-from-plane-selection
The system SHALL treat a project as governed when its resolved plane set holds one
or more planes, and as a legacy flat project when it resolves none. Governed status
SHALL follow from the resolved plane set and SHALL never be a standalone setting
that can disagree with it. A project that resolves no planes SHALL keep its
existing flat spec paths, parsing, validation, and archive behavior unchanged.

#### Scenario: One or more planes means governed
**ID:** planes-mean-governed
- **WHEN** a project's resolved plane set is non-empty
- **THEN** discovery, status, instructions, validation, synchronization, and archive use the governed model

#### Scenario: Zero planes means legacy flat
**ID:** no-planes-mean-flat
- **WHEN** a project resolves no planes
- **THEN** the project operates in the legacy flat model
- **AND** its spec paths, parsing, validation, and archive behavior are unchanged

#### Scenario: Governed status cannot contradict the plane set
**ID:** governance-never-contradicts
- **WHEN** the resolved governance state is computed
- **THEN** it follows from the resolved plane count and is never set independently of it

### Requirement: The plane taxonomy is schema-declared data a project may extend or replace
**ID:** planes-as-schema-data
The system SHALL resolve its plane taxonomy from schema-declared data rather than a
closed built-in list, so a project MAY add, remove, or replace planes without a code
change. A project MAY append planes to the schema's selected set or declare a full
replacement list.

#### Scenario: Schema defaults resolve when the project declares nothing
**ID:** schema-defaults-resolve
- **WHEN** a project selects the governed schema and declares no planes of its own
- **THEN** the resolved plane set is the schema's default-selected planes

#### Scenario: Project appends a plane
**ID:** project-appends-plane
- **WHEN** a project's config appends a new plane record
- **THEN** the resolved plane set is the default-selected planes plus the appended plane
- **AND** the appended plane is addressable like any other plane

#### Scenario: Project replaces the plane set
**ID:** project-replaces-planes
- **WHEN** a project's config declares a full plane list
- **THEN** the resolved plane set is exactly that list, with no defaults implied beyond it

#### Scenario: Malformed override falls back to the defaults
**ID:** malformed-override-ignored
- **WHEN** a project's plane override cannot be read as plane records
- **THEN** the resolved plane set remains the schema defaults

### Requirement: Every plane carries a structured metadata record
**ID:** plane-metadata-record
Each declared plane SHALL carry structured metadata so classification, authoring,
and review read a plane's meaning from data rather than prose: a kebab-case `id`, a
non-empty `purpose`, an `enforcementFlavor` naming the binding mechanisms suited to
it, an optional `reviewLens`, an optional `crossCutting` flag, and a
`defaultSelected` flag. The schema SHALL expose one offer-able plane list carrying
these records rather than a split between resolved and optional collections.

#### Scenario: Required fields on every plane record
**ID:** plane-required-fields
- **WHEN** a plane record resolves
- **THEN** it carries a kebab-case `id`, a non-empty `purpose`, and an `enforcementFlavor`

#### Scenario: One offer-able list with per-plane defaults
**ID:** single-offerable-list
- **WHEN** a consumer reads the resolved schema planes
- **THEN** it finds one unified list in which each record carries `defaultSelected`
- **AND** no separate optional-plane collection exists

#### Scenario: Optional review lens
**ID:** plane-optional-lens
- **WHEN** a plane declares a `reviewLens`
- **THEN** the record carries that lens id
- **AND** a plane that declares none is still valid

#### Scenario: Cross-cutting plane has no storage home
**ID:** cross-cutting-plane
- **WHEN** a plane declares `crossCutting: true`
- **THEN** it has no spec directory beneath the spec store and contributes review only

### Requirement: Governed specs live under any declared plane at any safe depth
**ID:** open-plane-locators
The system SHALL store governed pairs at `specs/<plane>/<locator>/` for any declared
plane id, SHALL discover them recursively beneath every declared plane root, and
SHALL address them by a normalized slash-separated locator that is identical on
every supported operating system. The system SHALL reject an unsafe or
undeclared-plane locator with its native source path.

#### Scenario: Pair under a project-declared plane
**ID:** pair-under-declared-plane
- **WHEN** a project declares a `security` plane and a pair exists at `specs/security/secret-handling/`
- **THEN** list, show, validate, sync, and archive address it as `security/secret-handling`

#### Scenario: Nested locator normalizes across platforms
**ID:** nested-locator-normalized
- **WHEN** a pair exists at the native path corresponding to `ops/infrastructure/terraform`
- **THEN** every command and JSON output identifies it as `ops/infrastructure/terraform`

#### Scenario: Undeclared plane rejected
**ID:** undeclared-plane-rejected
- **WHEN** a pair sits under a directory whose name is not in the resolved plane set
- **THEN** validation reports the unknown plane with its source path
- **AND** the pair is not treated as a governed pair

#### Scenario: Unsafe locator rejected
**ID:** unsafe-locator-rejected
- **WHEN** a locator is absolute, holds an empty or dot segment, escapes through a parent segment, or enters a hidden control directory
- **THEN** validation rejects it with the native source path and the offending segment

#### Scenario: Basename collision stays addressable
**ID:** basename-collision
- **WHEN** two nested specs share a basename
- **THEN** both remain addressable by full locator or by stable spec ID

### Requirement: Identities are stable and scoped, with open plane prefixes
**ID:** stable-scoped-identities
Every governed spec SHALL carry a project-unique stable ID of the form
`<plane>.<locator>` accepting any declared plane as its prefix. Every requirement
and scenario SHALL carry a stable ID unique within its spec, and every enforcement
binding SHALL carry a stable ID unique within its paired enforcement file. An
identity SHALL survive a move or a title change.

#### Scenario: Spec moves without losing identity
**ID:** identity-survives-move
- **WHEN** a governed spec moves to a different locator without changing its meaning
- **THEN** its stable spec ID is unchanged and lookup by that ID resolves the moved pair

#### Scenario: Title changes without losing identity
**ID:** identity-survives-retitle
- **WHEN** an author rewrites a requirement or scenario title without changing its meaning
- **THEN** its stable local ID is unchanged and paired enforcement coverage still resolves

#### Scenario: Spec ID with a project-declared plane prefix
**ID:** open-plane-prefix-accepted
- **WHEN** a spec declares `id: security.secret-handling` and `security` is a declared plane
- **THEN** the spec-ID index accepts and resolves the id

#### Scenario: Unknown plane prefix reported
**ID:** unknown-plane-prefix
- **WHEN** a spec declares an id whose prefix is not a declared plane
- **THEN** validation reports the unknown plane prefix with the source path

#### Scenario: Duplicate identity reported with every location
**ID:** duplicate-identity-reported
- **WHEN** two specs share a stable spec ID, or two normative or binding IDs collide within one pair
- **THEN** validation reports every conflicting source location

### Requirement: Directory ancestry navigates and never inherits
**ID:** no-implicit-inheritance
A governed directory MAY hold both its own pair and child pairs. Directory ancestry
SHALL provide navigation only and SHALL NOT implicitly inherit, copy, or override
requirements between a parent pair and its children.

#### Scenario: Directory with no pair is a namespace
**ID:** namespace-not-incomplete
- **WHEN** a directory organizes child pairs but holds no `spec.md`
- **THEN** discovery treats it as a namespace rather than an incomplete pair

#### Scenario: Parent pair coexists with children
**ID:** parent-coexists-with-children
- **WHEN** a directory holds a complete pair and child directories
- **THEN** the parent requirements apply only as written
- **AND** the children receive no implicit copied or inherited requirements

### Requirement: A governed spec resolves to one pair record
**ID:** governed-pair-resolution
The system SHALL resolve a governed spec by plane-qualified locator or by stable
spec ID and SHALL return its specification and enforcement paths as one record.
When exactly one member of a pair exists, the system SHALL report an incomplete pair
rather than omit it.

#### Scenario: Resolve by locator
**ID:** resolve-by-locator
- **WHEN** the user requests `behavior/session-loop`
- **THEN** the system returns the native `spec.md` and `enforcement.md` paths for that locator

#### Scenario: Resolve a moved spec by stable ID
**ID:** resolve-by-stable-id
- **WHEN** the user requests a stable spec ID after its locator changed
- **THEN** the system returns the pair at its current locator

#### Scenario: Incomplete pair surfaces
**ID:** incomplete-pair-surfaces
- **WHEN** exactly one of `spec.md` or `enforcement.md` exists at a governed locator
- **THEN** validation reports an incomplete pair rather than silently omitting it

### Requirement: Plane declarations are validated before use
**ID:** plane-declaration-validation
The system SHALL validate the resolved plane set and SHALL report actionable
diagnostics for a malformed declaration before generating prompts or accepting
specs.

#### Scenario: Malformed plane id
**ID:** non-kebab-plane-id
- **WHEN** a plane record's `id` is not kebab-case
- **THEN** validation reports the offending id and its source location

#### Scenario: Missing purpose
**ID:** missing-plane-purpose
- **WHEN** a plane record omits `purpose` or declares it empty
- **THEN** validation reports the missing field and its source location

#### Scenario: Reserved plane id
**ID:** reserved-plane-id
- **WHEN** a plane record's `id` is a reserved directory word such as `spec`, `specs`, or `enforcement`
- **THEN** validation rejects it to avoid ambiguity with directory roles

#### Scenario: Duplicate or colliding plane id
**ID:** duplicate-plane-id
- **WHEN** two plane records share an `id`, or an appended plane duplicates a schema default
- **THEN** validation reports the collision with its source locations

### Requirement: The agents plane governs a repository's own agentic instruments
**ID:** agents-plane-membership
The `agents` plane SHALL hold durable truth about the agentic *instruments* a
repository builds and owns — its review panel, repo-specific skills, subagents, and
hooks. It SHALL NOT hold behavioral guardrails on agents, which belong to whichever
plane governs their subject, and it SHALL NOT hold imported or third-party
instruments. The plane SHALL be offered but not selected by default.

#### Scenario: Repo-owned instrument qualifies
**ID:** repo-instrument-qualifies
- **WHEN** an author classifies a repository's own review panel, skill, subagent, or hook
- **THEN** it belongs at `specs/agents/<locator>/`

#### Scenario: Agent behavior rule does not qualify
**ID:** agent-rule-excluded
- **WHEN** an author considers a rule about how an agent should behave, such as a tool preference or a safety guardrail on generated code
- **THEN** it is classified under the plane whose subject it constrains, not the `agents` plane

#### Scenario: Imported tooling does not qualify
**ID:** imported-tooling-excluded
- **WHEN** an author considers a third-party plugin, imported skill, or externally-owned agent
- **THEN** it is excluded from the `agents` plane

#### Scenario: Agents plane is opt-in
**ID:** agents-plane-opt-in
- **WHEN** a project resolves the schema's default-selected planes
- **THEN** `agents` is offered but is not selected by default

### Requirement: The design-system plane governs the product's expressed identity
**ID:** design-system-plane-membership
The `design-system` plane SHALL hold durable truth about how a product expresses
itself — visual tokens, design principles, and the voice and tone of user-facing
copy — orthogonal to `behavior`, which governs what the product does. The plane
SHALL organize its truths into two strata: token truths under
`design-system/tokens/…`, whose enforcement audits the token artifact with automated
checks, and principle and voice truths under `design-system/voice/…`, whose
enforcement is review judgment. The plane SHALL be offered but not selected by
default.

#### Scenario: Presentation truth is not behavior truth
**ID:** identity-not-behavior
- **WHEN** a change introduces a durable truth about visual tokens, design principles, or copy voice
- **THEN** it is authored under `specs/design-system/<locator>/`, not under `behavior`

#### Scenario: Token stratum binds automated audits
**ID:** token-stratum-automated
- **WHEN** a `design-system/tokens/*` spec states an invariant such as "text and background pairs meet the stated contrast floor"
- **THEN** its paired enforcement binds a lint, contrast, or accessibility check whose target is the token artifact

#### Scenario: Voice stratum binds review judgment
**ID:** voice-stratum-review
- **WHEN** a `design-system/voice/*` spec states a principle such as "error copy never blames the user"
- **THEN** its paired enforcement is a review binding rather than an automated check

#### Scenario: Design-system plane is opt-in
**ID:** design-system-opt-in
- **WHEN** a project resolves the schema's default-selected planes
- **THEN** `design-system` is offered but is not selected by default
- **AND** a project with no user-facing surface can complete setup without it
