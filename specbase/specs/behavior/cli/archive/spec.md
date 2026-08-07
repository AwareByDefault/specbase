---
id: behavior.cli.archive
---

### Requirement: Unfinished work blocks archiving unless the user overrides
**ID:** task-completion-gate
Before archiving, the command SHALL determine the change's task progress through
its tracked-tasks artifact — the same resolution the dashboard uses — rather
than a single fixed file at the top of the change. When unchecked tasks remain,
the command SHALL list them and SHALL require an explicit confirmation that
defaults to declining. When no task file exists or every task is checked, the
command SHALL proceed without asking.

#### Scenario: Unchecked tasks in nested files still block
**ID:** nested-unfinished-blocks
- **GIVEN** a change whose tracked-tasks files sit below the top of the change
  directory and contain unchecked tasks
- **WHEN** the user archives that change
- **THEN** the gate reports the unfinished tasks and requires confirmation
- **AND** the change is not treated as having zero tasks

#### Scenario: Declining the warning stops the archive
**ID:** decline-incomplete-stops
- **WHEN** unchecked tasks are listed and the user does not confirm
- **THEN** the archive does not happen

#### Scenario: A complete or task-free change is not questioned
**ID:** complete-tasks-proceed
- **WHEN** every task is checked, or the change has no task file at all
- **THEN** archiving proceeds without a task confirmation

### Requirement: Archiving validates, updates current state, then moves the change
**ID:** archive-sequence
The archive operation SHALL run as an ordered sequence: validate the change,
apply its current-state updates, then move the whole change directory into the
archive under a name prefixed with the current date. The command SHALL create
the archive location when it is absent, SHALL refuse to archive when a target of
that name already exists, and SHALL report the archived name and what it updated
on success.

#### Scenario: The change lands under a dated archive name
**ID:** dated-archive-target
- **WHEN** a change is archived
- **THEN** the whole change directory is moved into the archive under a name
  carrying the current date and the change's own name

#### Scenario: An existing archive target is never overwritten
**ID:** existing-target-refused
- **WHEN** a target of the computed name already exists in the archive
- **THEN** the operation fails and the existing archive is left untouched

#### Scenario: Success names what was archived and updated
**ID:** archive-success-report
- **WHEN** the move succeeds
- **THEN** the command reports the archived name and the current specs it
  updated

#### Scenario: A governed change is prepared before it moves
**ID:** governed-archive-sequence
- **WHEN** a governed change is archived
- **THEN** every paired specification and enforcement delta is discovered
- **AND** each prospective current pair is built and validated before anything
  is written
- **AND** the change moves only after every prepared pair has been written

#### Scenario: A governed archive reports its effect
**ID:** governed-archive-report
- **WHEN** a governed archive succeeds
- **THEN** it reports the updated locators, the counts of claim and binding
  operations, the targets left with nothing referencing them, and whether
  enforcement was verified

### Requirement: Current-state updates apply as one all-or-nothing operation
**ID:** current-state-update
The command SHALL apply the change's deltas to current specs in a fixed order —
renames first, then removals, then modifications, then additions — and SHALL
verify before writing that every modified or removed requirement exists in the
current spec and that no added requirement is already there. Any failure SHALL
abort the whole operation with the conflict named, leaving every affected spec
and the change itself untouched. For a governed change, the specification and
enforcement members of a pair SHALL be written together or not at all.

#### Scenario: Operations apply in a fixed order
**ID:** operation-order
- **WHEN** a change's deltas contain renames, removals, modifications, and
  additions
- **THEN** they apply as renames, then removals, then modifications, then
  additions
- **AND** a modification refers to the renamed name

#### Scenario: A delta that does not match the current spec aborts
**ID:** unmatched-delta-aborts
- **WHEN** a modified or removed requirement is absent from the current spec, or
  an added requirement is already present
- **THEN** the operation aborts, names the conflict, and asks for manual
  resolution
- **AND** no spec is written

#### Scenario: Several specs succeed or fail together
**ID:** multi-spec-atomicity
- **WHEN** a change updates several specs and one of them fails
- **THEN** none of the specs are written and the change is not moved

#### Scenario: A governed pair is written whole
**ID:** governed-pair-atomicity
- **WHEN** a prepared governed pair fails validation
- **THEN** neither its specification nor its enforcement member is written

#### Scenario: Removed claims report their orphaned targets
**ID:** retired-target-candidates
- **WHEN** a governed delta removes a claim together with its binding
- **THEN** the binding's targets are reported as cleanup candidates
- **AND** no project file is deleted automatically

### Requirement: Archiving validates the change first, and says so when it does not
**ID:** pre-archive-validation
The command SHALL validate the change's structure before applying anything and
SHALL continue only when validation passes, reporting the validation errors
otherwise. A supported bypass option SHALL skip that validation, and using it
SHALL produce a warning that the change was archived without verification. For a
governed change, validation SHALL reject stale, hanging, planned, broken, or
incomplete mandatory enforcement before any current spec is written.

#### Scenario: An invalid change is not archived
**ID:** invalid-change-blocked
- **WHEN** the change fails structural validation
- **THEN** the validation errors are reported and the change is not archived

#### Scenario: The bypass warns that nothing was verified
**ID:** bypass-warns
- **WHEN** the user archives with the validation bypass
- **THEN** validation is skipped
- **AND** the output warns that enforcement was not verified

#### Scenario: Unready governed enforcement blocks the archive
**ID:** unready-enforcement-blocks
- **WHEN** a prepared governed pair contains a binding for a removed claim, a
  mandatory claim with no complete enforcement, an unresolved planned binding,
  or an unresolvable target
- **THEN** the exact identities are reported and the archive aborts before any
  current spec is written

#### Scenario: A one-sided governed delta pair aborts
**ID:** incomplete-pair-aborts
- **WHEN** a governed locator has only one member of its delta pair
- **THEN** the missing file is named and the archive aborts before writing

### Requirement: Spec updates are shown before they are applied, and declining them is not cancelling
**ID:** update-confirmation
Before writing current specs, the command SHALL show which specs it will create,
which it will update, and the source of each, then ask for confirmation that
defaults to declining. A confirmation-skipping option SHALL apply the updates
without asking. Declining SHALL skip the spec updates and continue archiving,
reporting that the specs were not updated.

#### Scenario: The confirmation names creations, updates, and sources
**ID:** confirmation-summary
- **WHEN** the command is about to write current specs
- **THEN** it lists the specs it will create, the specs it will update, and the
  source of each before asking

#### Scenario: Confirmation defaults to no
**ID:** confirmation-defaults-no
- **WHEN** the confirmation is presented and the user gives no explicit
  agreement
- **THEN** the specs are not updated

#### Scenario: Automation skips the confirmation
**ID:** yes-skips-confirmation
- **WHEN** the confirmation-skipping option is passed
- **THEN** the specs are updated without a prompt

#### Scenario: Declining still archives
**ID:** decline-still-archives
- **WHEN** the user declines the spec-update confirmation
- **THEN** the spec updates are skipped
- **AND** the change is still archived, and the output says the specs were not
  updated

### Requirement: Spec updates can be skipped outright
**ID:** skip-specs
The command SHALL accept an option that skips spec discovery, the update
confirmation, and the updates themselves, moving the change straight to the
archive and reporting that the specs were skipped.

#### Scenario: The skip option goes straight to the move
**ID:** skip-specs-moves-directly
- **WHEN** a change is archived with the skip-specs option
- **THEN** no spec is discovered, no confirmation is shown, and no spec is
  written
- **AND** the change is archived with a message saying specs were skipped
