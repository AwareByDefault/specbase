## ADDED Requirements

### Requirement: Opt-in governed spec model
OpenSpec SHALL allow a project to select a governed spec model without changing the behavior of projects that remain on the legacy flat spec workflow.

#### Scenario: Governed project selected
- **WHEN** project configuration selects the governed schema
- **THEN** status, instructions, spec discovery, validation, synchronization, and archive use the governed model declared by resolved schema metadata

#### Scenario: Legacy project remains selected
- **WHEN** project configuration selects a legacy schema
- **THEN** legacy spec paths, parsing, validation, and archive behavior remain unchanged

### Requirement: Behavioral and architectural planes
A governed project SHALL store current normative truth under explicit `behavior` and `architecture` planes.

#### Scenario: Behavioral capability
- **WHEN** a spec defines externally observable product outcomes
- **THEN** its pair resides beneath `openspec/specs/behavior/`

#### Scenario: Architectural responsibility
- **WHEN** a spec defines intentional packages, responsibilities, ownership boundaries, dependency rules, or structural invariants
- **THEN** its pair resides beneath `openspec/specs/architecture/`

### Requirement: Stable scoped identities
Every governed spec SHALL have a project-unique stable ID; every requirement and scenario SHALL have a stable ID unique within its spec; and every enforcement binding SHALL have a stable ID unique within its paired enforcement file.

#### Scenario: Spec moves
- **WHEN** a governed spec moves to a different locator without changing its normative identity
- **THEN** its stable spec ID remains unchanged
- **AND** lookup by stable spec ID resolves the moved pair

#### Scenario: Requirement title changes
- **WHEN** an author changes a requirement or scenario title without changing its meaning
- **THEN** its stable local ID remains unchanged
- **AND** paired enforcement coverage continues to resolve

#### Scenario: Duplicate scoped identity
- **WHEN** duplicate spec IDs exist in the project or duplicate normative or binding IDs exist within one pair
- **THEN** validation reports every conflicting source location

### Requirement: Plane-qualified nested locators
OpenSpec SHALL recursively discover governed pairs at any safe directory depth beneath a plane and represent their locators as normalized slash-separated paths independent of the host operating system.

#### Scenario: Nested pair on any supported platform
- **WHEN** a pair exists at the native path corresponding to `architecture/platforms/desktop`
- **THEN** list, show, validate, sync, archive, and JSON output identify it as `architecture/platforms/desktop`

#### Scenario: Unsafe locator
- **WHEN** a governed locator is absolute, contains an empty or dot segment, escapes through a parent segment, or enters a reserved hidden control directory
- **THEN** validation rejects it with the native source path and offending segment

#### Scenario: Basename collision
- **WHEN** two nested specs share a basename
- **THEN** both remain addressable by full plane-qualified locator or stable spec ID

### Requirement: Namespace directories without implicit inheritance
A governed directory MAY contain both its own spec pair and child pairs, while directory ancestry SHALL provide navigation only and SHALL NOT implicitly inherit or override requirements.

#### Scenario: Namespace has no normative contract
- **WHEN** a directory organizes child pairs but contains no `spec.md`
- **THEN** discovery treats it as a namespace rather than an incomplete pair

#### Scenario: Parent owns a real invariant
- **WHEN** a directory contains a complete pair and child directories
- **THEN** the parent requirements apply only as written
- **AND** children do not receive implicit copied or inherited requirements

### Requirement: Governed pair resolution
OpenSpec SHALL resolve a governed spec by plane-qualified locator or stable spec ID and return its specification and enforcement paths as one record.

#### Scenario: Resolve by locator
- **WHEN** the user requests `behavior/session-loop`
- **THEN** OpenSpec resolves the native `spec.md` and `enforcement.md` paths for that locator

#### Scenario: Resolve moved spec by stable ID
- **WHEN** the user requests a stable spec ID after its locator changed
- **THEN** OpenSpec returns the pair at its current locator

#### Scenario: Incomplete current pair
- **WHEN** exactly one of `spec.md` or `enforcement.md` exists at a governed locator
- **THEN** validation reports an incomplete pair rather than silently omitting it

### Requirement: Current architecture and historical rationale
Architectural specs SHALL describe current structural truth while archived proposals and designs remain the historical rationale for architectural transitions.

#### Scenario: Package responsibility refactor
- **WHEN** a responsibility moves between packages
- **THEN** the current architectural spec and enforcement are updated to describe the new structure
- **AND** the archived proposal and design preserve why the transition occurred
