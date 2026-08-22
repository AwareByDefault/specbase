---
id: design-system.tui-board
---

## Purpose

Define a terminal-board presentation that keeps project lifecycle primary while making the local Specbase queue reachable, focused, and usable at wide and narrow sizes.

## MODIFIED Requirements

### Requirement: The board makes project lifecycle primary and queue hierarchy secondary
**ID:** board-hierarchy
The terminal board SHALL present open ideas, active changes, and archived changes as peer lifecycle destinations, keep specifications visibly available as reference truth, and distinguish board, card, summary, and detail levels through consistent borders, labels, spacing, and headings. The Specbase workflow queue SHALL appear as a labelled secondary surface rather than a fourth project lifecycle column. Queue summary, item list, blockers, and item detail SHALL have a visible parent/child relationship and a visible route back to project lifecycle.

#### Scenario: A user can orient without opening detail
**ID:** lifecycle-hierarchy-visible
- **WHEN** the board first renders with queue items
- **THEN** each project lifecycle destination and the specifications surface has a visible label and count
- **AND** the queue summary is discoverable but visually subordinate to project lifecycle
- **AND** the selected card or queue item is visually related to its owning destination

#### Scenario: Queue detail retains hierarchy
**ID:** queue-hierarchy-visible
- **WHEN** a user opens a queue item
- **THEN** its work ID, Specbase action, state/readiness, blockers, and local-intent label are grouped under a queue heading
- **AND** a visible control returns to the same queue selection or project board

### Requirement: Focus and controls are visible and reachable without color alone
**ID:** focus-and-controls
Every interactive card, pane, queue item, and visible control SHALL expose its focused or selected state with a non-color cue. Mouse-operable detail, close/back, project/queue switch, column-switch, and quit controls SHALL remain labelled and visually distinct. Keyboard help SHALL identify equivalent keys, and keyboard traversal SHALL reach every queue outcome available by mouse through the shared command vocabulary.

#### Scenario: Focus survives a monochrome rendering
**ID:** focus-has-non-color-cue
- **WHEN** color is unavailable or cannot be distinguished
- **THEN** borders, markers, labels, or emphasis still identify the focused project card, queue item, or pane

#### Scenario: Visible controls explain their action
**ID:** controls-are-labelled
- **WHEN** queue detail or a narrow board is shown
- **THEN** its mouse controls have visible action labels
- **AND** corresponding keyboard actions are discoverable in help or control text

#### Scenario: Mouse and keyboard reach the same queue detail
**ID:** queue-input-reachability
- **WHEN** a user selects, scrolls, opens, or leaves queue content with either mouse or documented keys
- **THEN** both routes reach the same logical selection, detail, scroll owner, and return focus

### Requirement: Narrow layout preserves project and queue context
**ID:** narrow-layout
When the full board cannot fit, the presentation SHALL show one labelled primary surface at a time, expose the current project's lifecycle destination or queue position, and preserve selected-item identity, scroll context, and essential controls without overlapping or silently truncating action labels. Switching between project lifecycle and the secondary queue SHALL retain each surface's logical selection where the item still exists.

#### Scenario: One-column mode keeps context
**ID:** narrow-mode-context
- **WHEN** the terminal width triggers one-column mode
- **THEN** the current lifecycle or queue label, destination position, selected item, and switch/detail/back/quit controls remain visible

#### Scenario: Narrow queue selection is retained
**ID:** narrow-queue-focus-retained
- **WHEN** a user opens queue detail, returns, or switches to project lifecycle in a narrow layout
- **THEN** the prior queue selection and scroll context are restored when the queue surface is revisited
