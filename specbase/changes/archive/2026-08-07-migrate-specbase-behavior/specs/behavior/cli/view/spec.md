---
id: behavior.cli.view
---

## ADDED Requirements

### Requirement: The dashboard shows the whole project in one screen
**ID:** dashboard-sections
The view command SHALL render a dashboard carrying a summary, the draft changes,
the active changes, the completed changes, and the specifications, each in its
own section, in one pass over the project.

#### Scenario: Every section is present
**ID:** all-sections-rendered
- **WHEN** a user runs the dashboard in an initialized project
- **THEN** the output carries a summary section, a draft changes section, an
  active changes section, a completed changes section, and a specifications
  section

#### Scenario: Unreadable items are skipped, not fatal
**ID:** unreadable-items-skipped
- **WHEN** an item cannot be read or does not parse
- **THEN** the dashboard omits that item and renders the rest

### Requirement: The summary counts the project's state
**ID:** summary-metrics
The summary SHALL report the number of specifications and the number of
requirements across them, the number of draft, active, and completed changes,
and the overall task-completion percentage. An empty project SHALL report zero
for each of these.

#### Scenario: A populated project reports every metric
**ID:** populated-summary
- **WHEN** the dashboard renders a project with specs and changes
- **THEN** the summary reports the specification count, the requirement count,
  the draft, active, and completed change counts, and the overall task progress

#### Scenario: An empty project reports zeros
**ID:** empty-summary
- **WHEN** no specs and no changes exist
- **THEN** every summary metric reads zero

### Requirement: A change's section follows from its task state
**ID:** change-classification
The dashboard SHALL place a change with at least one task, all of them checked,
in the completed section; a change with no tasks at all in the draft section;
and every other change in the active section. A change with no tasks SHALL NOT
be reported as completed.

#### Scenario: All tasks done means completed
**ID:** all-done-is-completed
- **WHEN** a change has at least one task and every task is checked
- **THEN** it appears in the completed section

#### Scenario: No tasks means draft
**ID:** no-tasks-is-draft
- **WHEN** a change has no task file, or defines no tasks
- **THEN** it appears in the draft section
- **AND** it does not appear in the completed section

#### Scenario: Partly done means active
**ID:** partial-is-active
- **WHEN** a change has tasks and some are unchecked
- **THEN** it appears in the active section

### Requirement: Section ordering is deterministic
**ID:** change-ordering
The dashboard SHALL order active changes by completion percentage ascending, so
the least advanced appear first, treating a missing progress value as zero and
breaking ties by change identifier ascending. Draft changes SHALL be ordered
alphabetically by name.

#### Scenario: Active changes rise by progress
**ID:** active-sorted-by-progress
- **WHEN** several active changes are rendered
- **THEN** they appear ordered by completion percentage ascending
- **AND** a change with no progress value sorts as zero
- **AND** changes with equal progress are ordered by identifier ascending

#### Scenario: Drafts are alphabetical
**ID:** drafts-alphabetical
- **WHEN** several draft changes are rendered
- **THEN** they appear in alphabetical order by name

### Requirement: Specifications are ranked by weight
**ID:** specs-display
The dashboard SHALL list specifications ordered by requirement count descending,
labelling each with its count. A specification whose content cannot be parsed
SHALL still be listed, with a count of zero.

#### Scenario: Specs are listed largest first
**ID:** specs-by-count
- **WHEN** specifications exist
- **THEN** they are listed by requirement count descending, each labelled with
  its count

#### Scenario: An unparseable spec counts zero
**ID:** unparseable-spec-counts-zero
- **WHEN** a specification cannot be parsed
- **THEN** it is still listed, with a requirement count of zero

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
