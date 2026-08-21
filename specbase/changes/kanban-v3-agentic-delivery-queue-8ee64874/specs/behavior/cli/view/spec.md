---
id: behavior.cli.view
---

## Purpose

Define how people and agents inspect project lifecycle, specification, activity, and queue state through consistent interactive, plain, and JSON views.

## MODIFIED Requirements

### Requirement: The dashboard shows the project lifecycle with a secondary delivery queue
**ID:** dashboard-sections
The view command SHALL present open ideas, active changes, and archived changes as distinct lifecycle columns, together with a summary and an inspectable specifications surface. Every work card SHALL show its advisory local activity state and age, and its detail SHALL show the activity source and exact observation time when known. The dashboard SHALL also provide a visually secondary, read-only Specbase workflow queue summary and item detail without treating queue lifecycle as a project lifecycle column. The command SHALL derive all sections in one read of the selected project and local queue and SHALL omit unreadable project items while continuing to present the readable remainder; an unreadable queue SHALL appear as an actionable queue diagnostic rather than removing project lifecycle content.

#### Scenario: Every lifecycle surface is present
**ID:** all-sections-rendered
- **WHEN** a user opens the dashboard in an initialized project
- **THEN** it provides open ideas, active changes, and archived changes as separate lifecycle columns
- **AND** it provides a summary and a specifications summary/detail surface
- **AND** each work card shows fresh, stale, or unknown local activity

#### Scenario: Queue is secondary and inspectable
**ID:** queue-secondary-surface
- **WHEN** local delivery queue items exist
- **THEN** the board shows queue lifecycle/readiness counts in a secondary surface
- **AND** keyboard and mouse can reach an item whose detail shows work ID, Specbase action, stage, state, readiness/blockers, local operator intent, lease/attempt summary, and latest result
- **AND** no viewer action adds, claims, approves, revokes, cancels, or finishes queue work

#### Scenario: Activity detail identifies its source
**ID:** activity-detail-identifies-source
- **WHEN** a user opens a work card whose activity is known
- **THEN** detail shows the `project-files` source, exact observation time, and age

#### Scenario: Unreadable items are skipped, not fatal
**ID:** unreadable-items-skipped
- **WHEN** a project item cannot be read or does not parse
- **THEN** the dashboard omits that item, reports a non-fatal diagnostic, and renders the rest

#### Scenario: Queue failure does not hide project state
**ID:** queue-diagnostic-isolated
- **WHEN** local queue state cannot be read or parsed
- **THEN** lifecycle columns, specifications, and activity remain available
- **AND** the queue surface reports the state target and a concrete repair action

### Requirement: Plain and JSON output project the same activity-aware board and queue model
**ID:** plain-and-json-projections
`specbase view` SHALL render deterministic plain text automatically when either standard input or standard output is not an interactive terminal. `--plain` SHALL force that output without terminal control sequences. `--json` SHALL take precedence over interactive and plain modes and emit the versioned board model used by the other projections as JSON, including summary, lifecycle columns, specifications, card identities, progress, ordering, diagnostics, a structured `activity` value on every work card, and the secondary queue summary/items. Queue items SHALL be ordered by lifecycle priority, creation time ascending, then queue ID.

#### Scenario: Non-TTY output is plain automatically
**ID:** non-tty-is-plain
- **WHEN** standard input or standard output is not an interactive terminal and no format flag is supplied
- **THEN** the command writes deterministic plain output with activity and queue labels and does not launch an interactive renderer

#### Scenario: Plain mode is explicit and clean
**ID:** plain-forces-noninteractive
- **WHEN** a user runs `specbase view --plain` in any terminal context
- **THEN** the command writes deterministic plain text with activity state, age, and queue summary but without ANSI or alternate-screen control sequences

#### Scenario: JSON exposes the shared model
**ID:** json-returns-board-model
- **WHEN** a user runs `specbase view --json`
- **THEN** stdout contains only the versioned shared board model as valid JSON
- **AND** every work card contains `activity.state`, `activity.source`, `activity.observedAt`, and `activity.ageMs`
- **AND** the model contains queue counts and ordered item summaries with IDs, work IDs, Specbase actions, stages, lifecycle, readiness, local operator intent, blockers, and latest result
- **AND** project cards, activity values, queue items, and metrics match the plain and interactive projections of the same unchanged inputs and injected time
