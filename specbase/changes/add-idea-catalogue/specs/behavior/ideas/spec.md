---
id: behavior.ideas
---

## ADDED Requirements

### Requirement: Ideas are an ungoverned capture surface, not spec truth
**ID:** ideas-not-governed
The idea catalogue SHALL be a scratchpad surface for speculative capture, not
a source of governed truth. Ideas SHALL carry no enforcement pair, no spec
deltas, and no validation, and the governed surfaces (`validate`, `coverage`,
`list --specs`) SHALL NOT enumerate idea content as though it were spec or
change truth.

#### Scenario: An idea is not a spec
**ID:** idea-has-no-enforcement-pair
- **WHEN** an idea directory exists under `specbase/ideas/`
- **THEN** it contains no `spec.md` or `enforcement.md` pair
- **AND** no governed validation or coverage surface reports its content as a
  spec or a change

#### Scenario: Governance surfaces exclude ideas
**ID:** governance-excludes-ideas
- **WHEN** `specbase validate`, `specbase coverage`, or `specbase list --specs`
  runs
- **THEN** no path under `specbase/ideas/` appears in the results

### Requirement: Adding an idea creates a named scratchpad directory
**ID:** ideas-add
The `specbase ideas add` command SHALL create a directory under
`specbase/ideas/` named `<slug>-<short-uuid>`, where the slug is derived from
the required `--title` and the short uuid is generated to guarantee uniqueness
without a central counter. The command SHALL write a `.openspec.yaml` carrying
`id`, `summary` (the title text), and `created` (the ISO date), and SHALL seed
a `notes.md`. It SHALL accept an optional `--note` that seeds the `notes.md`
body. It SHALL create the `ideas/` directory if it does not yet exist.

#### Scenario: A title and note create an idea
**ID:** add-with-title-and-note
- **WHEN** a user runs `specbase ideas add --title "dark mode" --note "toggle
  the palette"`
- **THEN** a directory `specbase/ideas/dark-mode-<short-uuid>/` exists
- **AND** its `.openspec.yaml` carries `id`, `summary: "dark mode"`, and a
  `created` date
- **AND** its `notes.md` contains the note text

#### Scenario: The slug is derived from the title
**ID:** slug-derived-from-title
- **WHEN** a user runs `specbase ideas add --title "Real-time collaboration"`
- **THEN** the created directory name begins with `real-time-collaboration-`

#### Scenario: Uniqueness does not require a counter
**ID:** uniqueness-without-counter
- **WHEN** two ideas are added with the same title
- **THEN** both succeed and their directory names differ only in the short-uuid
  suffix

### Requirement: Listing ideas shows open ideas by age
**ID:** ideas-list
The `specbase ideas list` command SHALL, by default, list only ideas currently
under `specbase/ideas/` (open ideas), ordered oldest-first by `created` so
staleness is visible. It SHALL accept `--all` to include ideas in every state
(though graduated ideas leave `ideas/` on propose, `--all` is a stable
contract). It SHALL accept `--json` for machine-readable output and SHALL
report each idea's id, summary, and derived age.

#### Scenario: Default list shows open ideas oldest-first
**ID:** list-oldest-first
- **WHEN** several ideas exist in `specbase/ideas/` with different `created`
  dates
- **THEN** `specbase ideas list` prints them ordered from oldest to newest

#### Scenario: JSON output is machine-readable
**ID:** list-json
- **WHEN** a user runs `specbase ideas list --json`
- **THEN** the output is a JSON array of objects carrying at least `id`,
  `summary`, `created`, and an `age` field

### Requirement: Showing an idea displays its metadata and scratchpad
**ID:** ideas-show
The `specbase ideas show <id>` command SHALL print the idea's `.openspec.yaml`
metadata (id, summary, created, derived age) followed by the contents of
`notes.md`, and SHALL list any other files in the idea directory. It SHALL
accept `--json`.

#### Scenario: Show prints metadata and notes
**ID:** show-metadata-and-notes
- **WHEN** a user runs `specbase ideas show <id>` for an idea with notes and a
  sketch image
- **THEN** the output names the id, summary, created date, and age
- **AND** prints the `notes.md` contents
- **AND** lists the sketch image as a member file

### Requirement: Deleting an idea removes its scratchpad
**ID:** ideas-delete
The `specbase ideas delete <id>` command SHALL remove the idea's directory from
`specbase/ideas/`. It SHALL refuse with guidance when given an id that does not
exist under `ideas/` (an idea that has already been proposed now lives under
`changes/` and is not deletable as an idea).

#### Scenario: A junk idea is deleted
**ID:** delete-junk-idea
- **WHEN** a user runs `specbase ideas delete <id>` for an open idea
- **THEN** the idea directory is removed from `specbase/ideas/`

#### Scenario: A graduated idea is not deletable as an idea
**ID:** delete-graduated-rejected
- **WHEN** a user runs `specbase ideas delete <id>` for an id that is no longer
  under `ideas/` (it was moved to `changes/` by a prior propose)
- **THEN** the command reports that the idea is not open and is not deleted as
  an idea
