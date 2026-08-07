---
id: behavior.store.layout
---

### Requirement: A project's planning store has one predictable shape
**ID:** planning-store-shape
Every project SHALL keep its planning store under a single planning root that
holds the project configuration file, a `specs/` tree of current truth, and a
`changes/` tree of proposed work. The tool SHALL recognize a store by that
shape alone, so a project can be read without being told anything beyond its
planning root.

#### Scenario: A healthy store is recognized
**ID:** healthy-store-recognized
- **WHEN** the tool inspects a planning root that holds the configuration file
  and the `specs/` and `changes/` trees
- **THEN** it reports the store as healthy and resolves the paths beneath it

#### Scenario: A young store is still a store
**ID:** young-store-recognized
- **WHEN** the tool inspects a planning root before any change, applied spec, or
  archive exists
- **THEN** it still recognizes the store and reports which pieces are absent
  rather than failing

### Requirement: A change directory holds its proposal, its tasks, and its deltas
**ID:** change-directory-shape
Each proposed change SHALL live in its own directory under `changes/`, named by
a descriptive change identifier, containing the proposal, the task checklist,
an optional design document, and a `specs/` subtree holding the change's spec
deltas.

#### Scenario: A change is laid out for review
**ID:** change-layout
- **WHEN** a change directory is created
- **THEN** it contains the proposal and task documents at its root
- **AND** its spec deltas live under its own `specs/` subtree
- **AND** a design document is present only when the change needs one

### Requirement: Archived changes are dated and kept
**ID:** archive-layout
Completed changes SHALL move under `changes/archive/` into a directory named
`YYYY-MM-DD-<change-name>`, and SHALL be retained there as history. An archived
change SHALL NOT be read as current truth.

#### Scenario: A completed change is dated on archive
**ID:** archive-dated-directory
- **WHEN** a change is archived
- **THEN** its directory moves under `changes/archive/` with the completion date
  prefixed to its name

#### Scenario: Archived changes are excluded from current listings
**ID:** archive-excluded-from-current
- **WHEN** the tool lists or resolves current changes
- **THEN** directories under `changes/archive/` are excluded

### Requirement: Governed spec roots follow the declared plane set
**ID:** governed-plane-roots
Under the governed model, the `specs/` tree SHALL have one root directory per
declared plane, named by that plane's identifier. Adding or removing a plane
record SHALL add or remove exactly that root. A declared plane SHALL NOT need
its directory to exist on disk before it holds specs.

#### Scenario: Roots match the resolved plane set
**ID:** roots-match-planes
- **WHEN** a governed project's plane set is resolved
- **THEN** the governed spec tree has exactly the roots named by that set

#### Scenario: An empty plane needs no directory
**ID:** empty-plane-no-directory
- **WHEN** a project declares a plane it has written no specs under
- **THEN** discovery still treats the plane as declared
- **AND** no directory is created for it eagerly

#### Scenario: A legacy flat store stays valid
**ID:** legacy-flat-store
- **WHEN** a project has not adopted the governed model
- **THEN** its flat `specs/<capability>/` structure remains valid and readable
