---
id: design-system.tui-board
---

## Purpose

The terminal board expresses project lifecycle truth with a calm, accessible hierarchy that makes location, available actions, outcomes, feedback, and recovery recognizable without relying on color or memory.

## MODIFIED Requirements

### Requirement: The board makes context, lifecycle lanes, and detail hierarchy immediate
**ID:** board-hierarchy
The terminal board SHALL present project identity, lifecycle-board identity, read-only status, the idea backlog lane, and the six lifecycle-state lanes (`proposed`, `enforcement`, `ready-to-apply`, `implementing`, `reviewing`, `archived`) in a stable visual hierarchy. It SHALL keep specifications visibly available as reference truth and distinguish context, summary, lane, card, feedback, and detail levels through consistent borders, labels, spacing, and headings. A selected card and its owning lane SHALL remain visually related.

#### Scenario: A user can orient without opening detail
**ID:** lifecycle-hierarchy-visible
- **WHEN** the board first renders
- **THEN** project and board identity, read-only status, each lifecycle lane, and the specification surface have visible labels
- **AND** the selected card, its position, and its owning lane are visually related

#### Scenario: Lane identity survives monochrome
**ID:** lanes-legible-without-color
- **WHEN** color is unavailable or cannot be distinguished
- **THEN** text, counts, borders, and markers still identify each lifecycle lane and the selected card

#### Scenario: Feedback remains subordinate to project truth
**ID:** feedback-hierarchy-visible
- **WHEN** the board reports the result of an interaction or a recoverable diagnostic
- **THEN** the message is visibly associated with the board without obscuring the selected item, lane, or detail content

### Requirement: Focus, controls, and help are visible without color alone
**ID:** focus-and-controls
Every interactive card, pane, lane, and visible control SHALL expose its focused or selected state with a non-color cue. Mouse-operable details, close, lane-switch, help, and quit controls SHALL remain labelled with their outcome and visually distinct. Keyboard help SHALL identify equivalent keys and the board's read-only boundary through progressive disclosure.

#### Scenario: Focus survives a monochrome rendering
**ID:** focus-has-non-color-cue
- **WHEN** color is unavailable or cannot be distinguished
- **THEN** borders, markers, labels, or emphasis still identify the focused card or lane

#### Scenario: Visible controls explain their action
**ID:** controls-are-labelled
- **WHEN** the board or a detail surface is shown
- **THEN** available mouse controls use visible outcome labels such as `Details`, `Close`, `Help`, and `Quit`
- **AND** the corresponding keyboard actions are discoverable through visible help

#### Scenario: Help supports recognition rather than recall
**ID:** help-supports-recognition
- **WHEN** keyboard help is visible
- **THEN** controls are grouped by board navigation, detail navigation, and exit or recovery
- **AND** the help can be dismissed with the same close convention as detail

### Requirement: Constrained layouts preserve identity, focus, and recovery
**ID:** narrow-layout
When the full board cannot fit by width or height, the presentation SHALL use a constrained layout that keeps one labelled lifecycle lane or the idea backlog available at a time and preserves project identity, current-lane position, selected-item identity, visible focus, and essential details, help, close, and quit controls. Controls SHALL not be duplicated, overlapped, or silently truncated, and content SHALL take priority over decorative chrome. Below the minimum size at which selected content and recovery controls can coexist, the board SHALL replace clipped UI with explicit resize and quit guidance.

#### Scenario: One-lane mode keeps context
**ID:** narrow-mode-context
- **WHEN** terminal width triggers one-lane mode
- **THEN** project identity, the current lifecycle lane and its position, selected item, and switch/details/help/quit controls remain available

#### Scenario: A short terminal keeps a recovery path
**ID:** short-mode-context
- **WHEN** terminal height cannot show the normal header, content, feedback, and footer simultaneously
- **THEN** the layout reduces secondary summary and decoration before hiding selected content
- **AND** focus, help, close, and quit paths remain visible or immediately discoverable

#### Scenario: A terminal below the usable floor explains recovery
**ID:** below-floor-recovery
- **WHEN** the terminal is too small to present selected content and labelled recovery controls together
- **THEN** the board replaces clipped controls with a plain-language resize instruction
- **AND** the quit path remains visible
