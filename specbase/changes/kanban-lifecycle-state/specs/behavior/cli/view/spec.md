---
id: behavior.cli.view
---

## MODIFIED Requirements

### Requirement: The board shows the project as lifecycle lanes
**ID:** dashboard-sections
The view command SHALL present open ideas as a labelled backlog lane and changes in six lifecycle-state lanes (`proposed`, `enforcement`, `ready-to-apply`, `implementing`, `reviewing`, `archived`) as the board's primary organization, together with a summary and an inspectable specifications surface. It SHALL place each change in the lane matching its derived lifecycle state, SHALL derive every lane in one read of the selected project, and SHALL continue to present the readable remainder when an item or lane is unreadable.

#### Scenario: Every lifecycle lane is present
**ID:** all-lanes-rendered
- **WHEN** a user opens the board in an initialized project
- **THEN** it provides the idea backlog lane and each of the six lifecycle-state lanes
- **AND** it provides a summary and a specifications summary/detail surface

#### Scenario: An unreadable item is skipped, not fatal
**ID:** unreadable-items-skipped
- **WHEN** an item cannot be read or does not parse
- **THEN** the board omits that item, reports a non-fatal diagnostic, and renders the rest

### Requirement: The summary counts the lifecycle state of the project
**ID:** summary-metrics
The summary SHALL report the number of accepted specifications and requirements, the number of open ideas, the number of changes in each lifecycle lane (`proposed`, `enforcement`, `ready-to-apply`, `implementing`, `reviewing`, `archived`), and completed tasks out of total tasks across all change lanes. An empty project SHALL report zero for every metric.

#### Scenario: A populated project reports every metric
**ID:** populated-summary
- **WHEN** the board presents a project with ideas, changes in several lifecycle lanes, archives, and specs
- **THEN** the summary reports the open-idea count, a count per lifecycle lane, specification and requirement counts, and aggregate task progress

#### Scenario: An empty project reports zeros
**ID:** empty-summary
- **WHEN** no ideas, changes, archives, or specs exist
- **THEN** every summary metric reads zero

### Requirement: A change sits in the lane for its derived lifecycle state
**ID:** change-classification
Every change directory SHALL appear in the lane matching its derived lifecycle state (`proposed`, `enforcement`, `ready-to-apply`, `implementing`, `reviewing`, or `archived`), where the state is derived on read from artifacts, task completion, review-completion footprint, and archive location and is never read from a stored field. The card SHALL distinguish planning artifact completion from tracked task completion, including zero-task and fully-complete states, without moving the card to another lane until the underlying derived state changes.

#### Scenario: A ready change sits in ready-to-apply
**ID:** ready-lands-in-ready-lane
- **WHEN** a change has every apply-required artifact and no apply has begun
- **THEN** its card appears in the `ready-to-apply` lane

#### Scenario: A change under active implementation
**ID:** implementing-lands-in-implementing-lane
- **WHEN** a change's implementation has begun and its tasks are not all complete
- **THEN** its card appears in the `implementing` lane and reports task progress

#### Scenario: A reviewed-then-archived change
**ID:** archived-lands-in-archived-lane
- **WHEN** a change's directory lives under the archive
- **THEN** its card appears in the `archived` lane

#### Scenario: Completion does not move a lane by itself
**ID:** all-done-is-not-self-moving
- **WHEN** an implementing change reports all tasks complete but its review footprint or archive location has not changed
- **THEN** its card reports completion in its current lane rather than moving on its own

#### Scenario: A planned change with no tasks stays in its derived lane
**ID:** no-tasks-keeps-derived-lane
- **WHEN** a change has no task file or defines no tasks
- **THEN** its card remains in the lane for its derived state and reports zero tracked tasks

### Requirement: Lifecycle lane ordering is deterministic
**ID:** change-ordering
Within each lifecycle-state lane, the board SHALL order changes by task-completion percentage ascending then immutable ID; within the idea backlog lane it SHALL order open ideas by creation date ascending then immutable ID; and within the archived lane it SHALL order archived changes by archive date descending then immutable ID. Missing progress SHALL sort as zero, and missing dates SHALL sort after dated cards with immutable ID as the tie-breaker.

#### Scenario: Lane members rise by progress
**ID:** lane-sorted-by-progress
- **WHEN** several changes share one lifecycle lane
- **THEN** they are ordered by completion percentage ascending
- **AND** missing progress sorts as zero and equal progress sorts by immutable ID ascending

#### Scenario: The idea backlog exposes age
**ID:** idea-lane-exposes-age
- **WHEN** several open ideas are presented
- **THEN** the oldest created idea appears first
- **AND** equal or missing creation dates are resolved deterministically by the defined tie-breakers

#### Scenario: Recent archives appear first
**ID:** archives-newest-first
- **WHEN** several archived changes are presented
- **THEN** they are ordered by archive date descending and then immutable ID ascending