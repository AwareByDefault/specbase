---
id: behavior.cli.view
---

### Requirement: The dashboard shows the whole project as one lifecycle board
**ID:** dashboard-sections
The view command SHALL present open ideas, active changes, and archived changes as distinct lifecycle columns, together with a summary and an inspectable specifications surface. It SHALL derive all sections in one read of the selected project and SHALL omit unreadable items while continuing to present the readable remainder.

#### Scenario: Every lifecycle surface is present
**ID:** all-sections-rendered
- **WHEN** a user opens the dashboard in an initialized project
- **THEN** it provides open ideas, active changes, and archived changes as separate lifecycle columns
- **AND** it provides a summary and a specifications summary/detail surface

#### Scenario: Unreadable items are skipped, not fatal
**ID:** unreadable-items-skipped
- **WHEN** an item cannot be read or does not parse
- **THEN** the dashboard omits that item, reports a non-fatal diagnostic, and renders the rest

### Requirement: The summary counts the project's lifecycle state
**ID:** summary-metrics
The summary SHALL report the number of accepted specifications and requirements, open ideas, active changes, archived changes, and completed tasks out of total tasks across active changes. An empty project SHALL report zero for every metric.

#### Scenario: A populated project reports every metric
**ID:** populated-summary
- **WHEN** the dashboard presents a project with ideas, changes, archives, and specs
- **THEN** the summary reports each lifecycle count, specification and requirement counts, and aggregate active task progress

#### Scenario: An empty project reports zeros
**ID:** empty-summary
- **WHEN** no ideas, changes, archives, or specs exist
- **THEN** every summary metric reads zero

### Requirement: Active change cards retain artifact and task progress
**ID:** change-classification
Every directory under the active changes store SHALL appear in the active-change column regardless of whether its tasks are absent, partial, or complete. Its card SHALL distinguish planning artifact completion from tracked task completion, including zero-task and fully-complete states, without moving the change to another lifecycle column until the underlying store lifecycle changes.

#### Scenario: A planned change with no tasks stays active
**ID:** no-tasks-is-draft
- **WHEN** an active change has no task file or defines no tasks
- **THEN** its card remains in active changes and reports zero tracked tasks
- **AND** its artifact progress remains inspectable

#### Scenario: A partly complete change reports both progress dimensions
**ID:** partial-is-active
- **WHEN** an active change has incomplete planning artifacts or unchecked tasks
- **THEN** its card remains in active changes and reports artifact and task progress separately

#### Scenario: Completion does not imply archive
**ID:** all-done-is-completed
- **WHEN** an active change has all planning artifacts and tasks complete
- **THEN** its card reports completion but remains in active changes until it is archived on disk

### Requirement: Lifecycle card ordering is deterministic
**ID:** change-ordering
The dashboard SHALL order open ideas by creation date ascending then immutable ID, active changes by task-completion percentage ascending then immutable ID, and archived changes by archive date descending then immutable ID. Missing progress SHALL sort as zero, and missing dates SHALL sort after dated cards with immutable ID as the tie-breaker.

#### Scenario: Active changes rise by progress
**ID:** active-sorted-by-progress
- **WHEN** several active changes are presented
- **THEN** they are ordered by completion percentage ascending
- **AND** missing progress sorts as zero and equal progress sorts by immutable ID ascending

#### Scenario: Open ideas expose age
**ID:** drafts-alphabetical
- **WHEN** several open ideas are presented
- **THEN** the oldest created idea appears first
- **AND** equal or missing creation dates are resolved deterministically by the defined tie-breakers

#### Scenario: Recent archives appear first
**ID:** archives-newest-first
- **WHEN** several archived changes are presented
- **THEN** they are ordered by archive date descending and then immutable ID ascending

### Requirement: Specifications remain inspectable by weight
**ID:** specs-display
The dashboard SHALL provide every readable accepted specification in a summary ordered by requirement count descending then locator ascending. Selecting a specification SHALL expose its locator, stable spec ID, requirement count, and requirement titles in detail. A readable specification whose content cannot be parsed SHALL remain in the summary with a zero count and its parse diagnostic.

#### Scenario: Specs are listed largest first
**ID:** specs-by-count
- **WHEN** accepted specifications exist
- **THEN** they are ordered by requirement count descending then locator ascending and labelled with their counts
- **AND** a selected specification exposes its identity and requirement titles

#### Scenario: An unparseable spec counts zero
**ID:** unparseable-spec-counts-zero
- **WHEN** a readable accepted specification cannot be parsed
- **THEN** it remains listed with a requirement count of zero and an inspectable parse diagnostic

### Requirement: Task progress comes from the change's tracked-tasks artifact
**ID:** task-progress-resolution
The dashboard SHALL compute a change's task progress by resolving the change's
tracked-tasks artifact and counting checkboxes across every file that artifact
produces, rather than assuming one file at the top of the change. The
tracked-tasks artifact SHALL be the artifact the schema's apply step tracks,
falling back to the artifact named for tasks when the schema declares no apply
step. Resolution SHALL be confined to the change's own directory, SHALL
aggregate across every matching file without counting any file twice, and SHALL
fall back to a single top-level task file — without failing — when the schema
cannot be resolved, no tracked-tasks artifact exists, or nothing matches.

#### Scenario: Nested task files are aggregated
**ID:** nested-tasks-aggregated
- **GIVEN** a change whose tracked-tasks artifact matches task files nested
  below the change directory, and no file at the top of it
- **WHEN** the dashboard renders
- **THEN** the change's progress is the sum across every matching file
- **AND** the change is not called a draft merely because no top-level file
  exists

#### Scenario: Existing files with unchecked boxes are not completed
**ID:** unchecked-not-completed
- **GIVEN** a change whose matched task files contain unchecked boxes
- **WHEN** the dashboard renders
- **THEN** the change is classified active, not completed

#### Scenario: The tracked artifact is chosen by what apply tracks
**ID:** artifact-chosen-by-apply
- **GIVEN** a schema whose tracked-tasks artifact is not the one named for tasks
  but is the one the apply step tracks
- **WHEN** the dashboard renders
- **THEN** progress is resolved from that artifact's output files

#### Scenario: Resolution never leaves the change
**ID:** resolution-scoped-to-change
- **WHEN** a change's task files are resolved
- **THEN** only files inside that change's own directory are matched
- **AND** files belonging to another change or to the archive are not counted

#### Scenario: An unresolvable schema falls back quietly
**ID:** schema-fallback-no-error
- **GIVEN** a change whose configured schema cannot be resolved
- **WHEN** the dashboard renders
- **THEN** progress falls back to a single top-level task file
- **AND** the command does not fail

#### Scenario: A single top-level task file is unchanged
**ID:** single-file-unchanged
- **GIVEN** a change with exactly one task file at the top of its directory
- **WHEN** the dashboard renders
- **THEN** progress is counted from that one file

#### Scenario: No matching file means no tasks
**ID:** no-match-is-zero
- **WHEN** nothing matches a change's tracked-tasks artifact
- **THEN** the change reports zero tasks and is classified as a draft

### Requirement: Interactive terminals launch a viewer-only board
**ID:** interactive-viewer-launch
`specbase view` SHALL launch the interactive terminal board when both standard input and standard output are interactive terminals and neither plain nor JSON output was requested. The board SHALL expose no command that edits, reorders, executes, archives, or otherwise mutates project or queue state.

#### Scenario: An interactive TTY opens the board
**ID:** interactive-tty-opens-board
- **WHEN** a user runs `specbase view` with interactive standard input and output
- **THEN** the interactive board opens with a selected visible surface

#### Scenario: Inspection cannot mutate the store
**ID:** interactive-viewer-is-read-only
- **WHEN** a user selects, scrolls, or opens and closes details through any visible control or shortcut
- **THEN** no project file, lifecycle order, task state, or artifact state changes

#### Scenario: Interactive launch failure is actionable
**ID:** interactive-launch-failure
- **WHEN** the required interactive runtime cannot be found or does not meet its supported version
- **THEN** the command fails before taking over the terminal
- **AND** the error states how to install or select the required runtime and directs the user to `specbase view --plain`

### Requirement: Mouse and keyboard operate the same viewer commands
**ID:** viewer-input-parity
The interactive board SHALL support card and pane selection, focus movement, wheel scrolling, detail open and close, and visible controls with a mouse. It SHALL provide a keyboard route to every one of those outcomes through the same read-only command semantics.

#### Scenario: Mouse selects and opens a card
**ID:** mouse-selects-and-opens-card
- **WHEN** a user clicks a visible card and activates its detail control
- **THEN** that card receives focus and its detail opens

#### Scenario: Wheel scroll stays with the intended pane
**ID:** mouse-wheel-scrolls-pane
- **WHEN** a user moves the wheel over a scrollable lifecycle or detail pane
- **THEN** that pane scrolls without moving an unrelated pane

#### Scenario: Keyboard reaches the same outcome
**ID:** keyboard-command-parity
- **WHEN** a user performs selection, scrolling, detail, or close actions with documented keys
- **THEN** the resulting logical selection and view state match the equivalent mouse commands

### Requirement: Details preserve navigation context
**ID:** viewer-detail-navigation
The viewer SHALL let users open details for ideas, changes, archives, and specifications, close detail without losing the originating selection, and keep the focused item visible while moving through scrollable content.

#### Scenario: Closing detail restores its origin
**ID:** close-detail-restores-origin
- **WHEN** a user closes an item's detail
- **THEN** focus returns to that item in its originating pane

#### Scenario: Focus movement remains visible
**ID:** focused-card-remains-visible
- **WHEN** focus moves beyond the currently visible cards
- **THEN** the owning pane scrolls enough to reveal the focused card

### Requirement: Resize and every child outcome preserve terminal usability
**ID:** viewer-terminal-lifecycle
The interactive board SHALL recompute its layout on terminal resize, provide a usable single-column navigation mode when three lifecycle columns cannot fit, and restore terminal input modes, cursor, screen, and registered handlers on normal exit, SIGINT, SIGTERM, renderer failure, or any child nonzero exit. The parent command SHALL return zero only for a successful child and SHALL propagate the child's nonzero status, including 130 for SIGINT and 143 for SIGTERM after cleanup.

#### Scenario: A narrow terminal remains navigable
**ID:** narrow-terminal-remains-usable
- **WHEN** the terminal becomes too narrow for three usable lifecycle columns
- **THEN** the viewer presents one lifecycle column at a time with a visible way to switch columns
- **AND** the selected item and essential detail/quit controls remain available

#### Scenario: Resize retains logical focus
**ID:** resize-retains-focus
- **WHEN** the terminal is resized while an existing item is selected
- **THEN** the layout reflows and the same item remains selected and visible

#### Scenario: Every exit restores the terminal
**ID:** exit-restores-terminal
- **WHEN** the viewer exits normally, receives SIGINT or SIGTERM, fails after renderer creation, or the renderer child returns nonzero
- **THEN** the caller's terminal modes, cursor, screen, and handlers are restored
- **AND** the parent returns the child's defined status

### Requirement: Plain and JSON output project the same board model
**ID:** plain-and-json-projections
`specbase view` SHALL render deterministic plain text automatically when either standard input or standard output is not an interactive terminal. `--plain` SHALL force that output without terminal control sequences. `--json` SHALL take precedence over interactive and plain modes and emit the versioned board model used by the other projections as JSON, including summary, lifecycle columns, specifications, card identities, progress, ordering, and diagnostics.

#### Scenario: Non-TTY output is plain automatically
**ID:** non-tty-is-plain
- **WHEN** standard input or standard output is not an interactive terminal and no format flag is supplied
- **THEN** the command writes deterministic plain output and does not launch an interactive renderer

#### Scenario: Plain mode is explicit and clean
**ID:** plain-forces-noninteractive
- **WHEN** a user runs `specbase view --plain` in any terminal context
- **THEN** the command writes deterministic plain text without ANSI or alternate-screen control sequences

#### Scenario: JSON exposes the shared model
**ID:** json-returns-board-model
- **WHEN** a user runs `specbase view --json`
- **THEN** stdout contains only the versioned shared board model as valid JSON
- **AND** its ordered cards and metrics match the plain and interactive projections of the same unchanged store

### Requirement: Wide terminals show adjacent lifecycle columns
**ID:** `viewer-wide-columns`
The interactive viewer SHALL present multiple lifecycle columns simultaneously when the terminal can give each visible column a usable width, while preserving one logical selection and scroll position per column.

#### Scenario: A wide board exposes adjacent work
**ID:** `wide-board-shows-adjacent-columns`
- **WHEN** the terminal is wide enough for multiple usable columns
- **THEN** adjacent lifecycle columns appear simultaneously in stable board order
- **AND** each column retains its label, item count, selection, and visible card content

#### Scenario: Visible columns scroll independently
**ID:** `wide-columns-scroll-independently`
- **WHEN** a user scrolls one visible column with the mouse or moves items in the focused column with the keyboard
- **THEN** that column's selection and scroll position change as requested
- **AND** unrelated visible columns keep their selection and scroll position

#### Scenario: Resize crosses the layout boundary
**ID:** `wide-to-narrow-preserves-focus`
- **WHEN** the terminal changes between multi-column and focused-column widths
- **THEN** the same logical lane and item remain selected and visible
- **AND** the constrained layout retains its existing lane-switch, details, help, and quit routes
