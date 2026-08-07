---
id: behavior.habits-manage
---

## ADDED Requirements

### Requirement: Adding a habit validates and stores a unique name
**ID:** `add-habit`
The CLI SHALL create a new habit when given a name that, after trimming
surrounding whitespace, is non-empty and no more than 100 characters, and that
does not already belong to an existing habit. The CLI MUST reject a name that
fails any of these checks with a clear error, and MUST NOT create a habit when
rejecting.

#### Scenario: Add a new habit succeeds
**ID:** `add-habit-succeeds`
- **WHEN** a user adds a habit with a valid, previously-unused name
- **THEN** a habit with that name exists afterward

#### Scenario: Duplicate name is rejected
**ID:** `add-duplicate-rejected`
- **WHEN** a user adds a habit whose name matches an existing habit exactly
- **THEN** the CLI reports a clear error
- **AND** no second habit is created

#### Scenario: Empty or whitespace-only name is rejected
**ID:** `add-empty-name-rejected`
- **WHEN** a user adds a habit whose name is empty or contains only whitespace
- **THEN** the CLI reports a clear error
- **AND** no habit is created

#### Scenario: Name over 100 characters is rejected
**ID:** `add-overlong-name-rejected`
- **WHEN** a user adds a habit whose trimmed name is longer than 100 characters
- **THEN** the CLI reports a clear error
- **AND** no habit is created

#### Scenario: Leading and trailing whitespace is trimmed
**ID:** `add-name-trimmed`
- **WHEN** a user adds a habit whose name has leading or trailing whitespace
- **THEN** the stored habit name has that whitespace removed

### Requirement: Listing habits reflects insertion order
**ID:** `list-habits`
The CLI SHALL list every habit that has been added, one name per line, in the
order the habits were added, with no numbering or decoration. The CLI SHALL
produce no habit lines when no habits have been added.

#### Scenario: List after adding habits preserves order
**ID:** `list-preserves-order`
- **WHEN** a user adds habits "Read" then "Stretch" then lists habits
- **THEN** the output shows "Read" before "Stretch", one name per line, with no numbering

#### Scenario: List with no habits added
**ID:** `list-empty`
- **WHEN** a user lists habits before adding any
- **THEN** the CLI produces no habit lines
- **AND** does not report an error

### Requirement: Habits persist across separate CLI invocations
**ID:** `cross-run-persistence`
A habit added in one CLI invocation SHALL appear in the output of a `list`
run in a later, separate CLI invocation, regardless of the working directory
the later invocation is run from.

#### Scenario: Add then list in a new process
**ID:** `persistence-across-processes`
- **WHEN** a user adds a habit in one CLI invocation and exits
- **AND** a later, separate CLI invocation lists habits
- **THEN** the added habit appears in that later output

#### Scenario: Persistence does not depend on working directory
**ID:** `persistence-independent-of-cwd`
- **WHEN** a habit is added while running the CLI from one working directory
- **AND** a later invocation lists habits from a different working directory
- **THEN** the added habit still appears, using the default storage location

### Requirement: Storage location is overridable via environment variable
**ID:** `storage-override`
The CLI SHALL read from and write to the file path given by the
`HABIT_TRACKER_DATA` environment variable when it is set and non-empty,
instead of the default per-user storage location.

#### Scenario: HABIT_TRACKER_DATA overrides the default path
**ID:** `env-override-used`
- **WHEN** `HABIT_TRACKER_DATA` is set to a file path
- **AND** a habit is added and then listed
- **THEN** the habit data is read from and written to that path, not the default

#### Scenario: Unset HABIT_TRACKER_DATA falls back to the default
**ID:** `env-override-absent-uses-default`
- **WHEN** `HABIT_TRACKER_DATA` is not set
- **THEN** the CLI reads from and writes to the default per-user storage location
