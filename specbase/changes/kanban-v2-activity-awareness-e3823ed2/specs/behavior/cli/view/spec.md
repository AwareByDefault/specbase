---
id: behavior.cli.view
---

## Purpose

Define how people and agents inspect project lifecycle, specification, activity, and queue state through consistent interactive, plain, and JSON views.

## MODIFIED Requirements

### Requirement: The dashboard shows the whole project as one lifecycle board
**ID:** dashboard-sections
The view command SHALL present open ideas, active changes, and archived changes as distinct lifecycle columns, together with a summary and an inspectable specifications surface. Every work card SHALL show its advisory local activity state and age, and its detail SHALL show the activity source and exact observation time when known. The command SHALL derive all sections in one read of the selected project and SHALL omit unreadable items while continuing to present the readable remainder.

#### Scenario: Every lifecycle surface is present
**ID:** all-sections-rendered
- **WHEN** a user opens the dashboard in an initialized project
- **THEN** it provides open ideas, active changes, and archived changes as separate lifecycle columns
- **AND** it provides a summary and a specifications summary/detail surface
- **AND** each work card shows fresh, stale, or unknown local activity

#### Scenario: Activity detail identifies its source
**ID:** activity-detail-identifies-source
- **WHEN** a user opens a work card whose activity is known
- **THEN** detail shows the `project-files` source, exact observation time, and age

#### Scenario: Unreadable items are skipped, not fatal
**ID:** unreadable-items-skipped
- **WHEN** an item cannot be read or does not parse
- **THEN** the dashboard omits that item, reports a non-fatal diagnostic, and renders the rest

### Requirement: Details preserve navigation context
**ID:** viewer-detail-navigation
The viewer SHALL let users open details for ideas, changes, archives, and specifications, close detail without losing the originating selection, and keep the focused item visible while moving through scrollable content. Work-item detail SHALL include the same activity state as its card plus source, exact observation time, and age when known.

#### Scenario: Closing detail restores its origin
**ID:** close-detail-restores-origin
- **WHEN** a user closes an item's detail
- **THEN** focus returns to that item in its originating pane

#### Scenario: Focus movement remains visible
**ID:** focused-card-remains-visible
- **WHEN** focus moves beyond the currently visible cards
- **THEN** the owning pane scrolls enough to reveal the focused card

#### Scenario: Unknown activity is explicit in detail
**ID:** unknown-activity-in-detail
- **WHEN** a user opens a work card whose activity is unknown
- **THEN** detail labels activity unknown without inventing a source, timestamp, or age

### Requirement: Plain and JSON output project the same activity-aware board model
**ID:** plain-and-json-projections
`specbase view` SHALL render deterministic plain text automatically when either standard input or standard output is not an interactive terminal. `--plain` SHALL force that output without terminal control sequences. `--json` SHALL take precedence over interactive and plain modes and emit the versioned board model used by the other projections as JSON, including summary, lifecycle columns, specifications, card identities, progress, ordering, diagnostics, and a structured `activity` value on every work card.

#### Scenario: Non-TTY output is plain automatically
**ID:** non-tty-is-plain
- **WHEN** standard input or standard output is not an interactive terminal and no format flag is supplied
- **THEN** the command writes deterministic plain output with activity labels and does not launch an interactive renderer

#### Scenario: Plain mode is explicit and clean
**ID:** plain-forces-noninteractive
- **WHEN** a user runs `specbase view --plain` in any terminal context
- **THEN** the command writes deterministic plain text with activity state and age but without ANSI or alternate-screen control sequences

#### Scenario: JSON exposes the shared model
**ID:** json-returns-board-model
- **WHEN** a user runs `specbase view --json`
- **THEN** stdout contains only the versioned shared board model as valid JSON
- **AND** every work card contains `activity.state`, `activity.source`, `activity.observedAt`, and `activity.ageMs`
- **AND** ordered cards, activity values, and metrics match the plain and interactive projections of the same unchanged store and injected time
