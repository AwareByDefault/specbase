---
id: design-system.tui-board
---

## Purpose

Define a terminal-board presentation that keeps lifecycle, focus, status, controls, and constrained layouts legible and reachable.

## ADDED Requirements

### Requirement: The board makes lifecycle and detail hierarchy immediate
**ID:** board-hierarchy
The terminal board SHALL present open ideas, active changes, and archived changes as peer lifecycle destinations, keep specifications visibly available as reference truth, and distinguish board, card, summary, and detail levels through consistent borders, labels, spacing, and headings.

#### Scenario: A user can orient without opening detail
**ID:** lifecycle-hierarchy-visible
- **WHEN** the board first renders
- **THEN** each lifecycle destination and the specifications surface has a visible label and count
- **AND** the selected card and its owning destination are visually related

### Requirement: Focus and controls are visible without color alone
**ID:** focus-and-controls
Every interactive card, pane, and visible control SHALL expose its focused or selected state with a non-color cue. Mouse-operable detail, close, column-switch, and quit controls SHALL remain labelled and visually distinct, and keyboard help SHALL identify equivalent keys.

#### Scenario: Focus survives a monochrome rendering
**ID:** focus-has-non-color-cue
- **WHEN** color is unavailable or cannot be distinguished
- **THEN** borders, markers, labels, or emphasis still identify the focused card or pane

#### Scenario: Visible controls explain their action
**ID:** controls-are-labelled
- **WHEN** a detail or narrow board is shown
- **THEN** its available mouse controls have visible action labels
- **AND** the corresponding keyboard actions are discoverable in help or control text

### Requirement: Status language separates lifecycle from progress
**ID:** status-language
Cards SHALL express lifecycle by column placement and express artifact/task progress with labelled counts or bars plus text. Idea, active, archived, specification, warning, and selection states SHALL use a consistent symbol vocabulary and SHALL NOT rely on hue as their only distinction.

#### Scenario: Complete tasks do not look archived
**ID:** completion-distinct-from-archive
- **WHEN** an active card reports all tasks complete
- **THEN** its progress reads complete while its active lifecycle placement remains clear

#### Scenario: Warnings remain legible without color
**ID:** warning-not-color-only
- **WHEN** a card or spec carries a parse diagnostic
- **THEN** a warning symbol or label communicates the state without color

### Requirement: Narrow layout preserves identity and action context
**ID:** narrow-layout
When the full board cannot fit, the presentation SHALL switch to one labelled lifecycle destination at a time, show the current destination's position among all destinations, and preserve selected-item identity, scroll context, and essential controls without overlapping or silently truncating action labels.

#### Scenario: One-column mode keeps context
**ID:** narrow-mode-context
- **WHEN** the terminal width triggers one-column mode
- **THEN** the current lifecycle label, destination position, selected item, and switch/detail/quit controls remain visible
