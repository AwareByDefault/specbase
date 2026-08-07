---
id: behavior.cli.list
---

## ADDED Requirements

### Requirement: Listing covers active changes by default and specs on request
**ID:** list-scope
The list command SHALL enumerate active changes by default and specs when the
spec-scoping flag is given, and SHALL exclude archived changes. Under the
governed model it SHALL recursively discover every pair beneath every declared
plane root, including incomplete pairs, and SHALL identify each by its
plane-qualified locator and, where present, its stable spec identity. Under the
flat model it SHALL enumerate capabilities as before.

#### Scenario: Active changes are the default
**ID:** default-lists-changes
- **WHEN** a user lists without a scoping flag
- **THEN** the active changes are enumerated
- **AND** archived changes are not included

#### Scenario: Specs are listed on request
**ID:** flag-lists-specs
- **WHEN** a user lists with the spec-scoping flag
- **THEN** specs are enumerated instead of changes

#### Scenario: Governed pairs are found at any depth under any declared plane
**ID:** governed-recursive-discovery
- **GIVEN** a governed project with a pair nested beneath a declared plane
- **WHEN** the user lists specs
- **THEN** the pair is listed with its plane-qualified locator, using the
  declared plane identifier as the first segment
- **AND** a plane other than the built-in ones is discovered the same way

#### Scenario: An incomplete pair is still listed
**ID:** incomplete-pair-listed
- **WHEN** a governed locator has only one member of its pair
- **THEN** it is listed as an incomplete pair rather than omitted

### Requirement: Task progress is counted from checkbox state
**ID:** task-counting
The command SHALL count a change's completed and incomplete tasks from the
checked and unchecked checkboxes in its task files, and SHALL report the total
as the sum of the two.

#### Scenario: Checked and unchecked boxes are tallied
**ID:** checkbox-tally
- **WHEN** a change's tasks are counted
- **THEN** checked boxes count as complete, unchecked boxes count as incomplete,
  and the total is their sum

#### Scenario: A change with no tasks is shown without progress
**ID:** no-tasks-status
- **WHEN** a change has no task file
- **THEN** it is listed with a no-tasks status rather than omitted or failed

### Requirement: Each listed item carries the measure that matters for its kind
**ID:** list-output
The command SHALL show each change with its task progress, each flat spec with
its requirement count, and each governed pair with its plane-qualified locator,
stable spec identity, requirement count, and coverage summary, distinguishing
covered, planned, stale, hanging, broken, and incomplete-pair states. A
machine-readable governed record SHALL carry the normalized locator, the stable
spec identity, the plane, the paths of both pair members, and the coverage
counts.

#### Scenario: Changes show progress
**ID:** change-row-progress
- **WHEN** changes are listed
- **THEN** each row carries the change's name and its task progress, and a fully
  complete change is marked as such

#### Scenario: Flat specs show a requirement count
**ID:** flat-spec-row
- **WHEN** specs are listed in a flat project
- **THEN** each row carries the spec's identifier and its requirement count

#### Scenario: Governed pairs show coverage state
**ID:** governed-row-coverage
- **WHEN** specs are listed in a governed project
- **THEN** each row carries the locator, the stable spec identity, the
  requirement count, and a coverage summary
- **AND** covered, planned, stale, hanging, broken, and incomplete-pair states
  are distinguishable

#### Scenario: Governed records are complete in machine-readable output
**ID:** governed-record-fields
- **WHEN** a governed spec listing is requested in machine-readable form
- **THEN** each record carries the normalized locator, the stable spec identity,
  the plane, the paths of both pair members, and the coverage counts

### Requirement: An empty scope says so plainly
**ID:** empty-state
When the selected scope contains nothing, the command SHALL say that no items of
that kind were found rather than printing an empty table or failing.

#### Scenario: No active changes
**ID:** no-changes-message
- **WHEN** the changes scope holds nothing but archived changes, or nothing at
  all
- **THEN** the command reports that no active changes were found

#### Scenario: No specs
**ID:** no-specs-message
- **WHEN** the specs scope holds nothing, or no specs location exists
- **THEN** the command reports that no specs were found

### Requirement: Listing order is stable
**ID:** sorting
The command SHALL order listed items deterministically, defaulting to
alphabetical order by name, so repeated runs over unchanged content produce the
same output.

#### Scenario: Items come out in alphabetical order
**ID:** alphabetical-order
- **WHEN** several items are listed
- **THEN** they appear in alphabetical order by name
- **AND** the same input produces the same order on every run
