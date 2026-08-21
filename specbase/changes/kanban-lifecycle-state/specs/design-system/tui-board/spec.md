---
id: design-system.tui-board
---

## MODIFIED Requirements

### Requirement: The board makes lifecycle lanes and detail hierarchy immediate
**ID:** board-hierarchy
The terminal board SHALL present the idea backlog lane and the six lifecycle-state lanes (`proposed`, `enforcement`, `ready-to-apply`, `implementing`, `reviewing`, `archived`) as the board's visible organization, keep specifications visibly available as reference truth, and distinguish board, lane, card, summary, and detail levels through consistent borders, labels, spacing, and headings. A card SHALL sit in the lane for its derived lifecycle state and the selected card and its owning lane SHALL be visually related.

#### Scenario: A user can orient without opening detail
**ID:** lifecycle-hierarchy-visible
- **WHEN** the board first renders
- **THEN** each lifecycle lane and the specification surface has a visible label and count
- **AND** the selected card and its owning lane are visually related

#### Scenario: Lane identity survives monochrome
**ID:** lanes-legible-without-color
- **WHEN** color is unavailable or cannot be distinguished
- **THEN** lane labels, counts, borders, and markers still identify each lifecycle lane and the selected card

### Requirement: Focus and controls are visible without color alone
**ID:** focus-and-controls
Every interactive card, pane, lane, and visible control SHALL expose its focused or selected state with a non-color cue. Mouse-operable detail, close, lane-switch, and quit controls SHALL remain labelled and visually distinct, and keyboard help SHALL identify equivalent keys.

#### Scenario: Focus survives a monochrome rendering
**ID:** focus-has-non-color-cue
- **WHEN** color is unavailable or cannot be distinguished
- **THEN** borders, markers, labels, or emphasis still identify the focused card or lane

#### Scenario: Visible controls explain their action
**ID:** controls-are-labelled
- **WHEN** a detail or narrow board is shown
- **THEN** its available mouse controls have visible action labels
- **AND** the corresponding keyboard actions are discoverable in help or control text

### Requirement: Status language separates lifecycle from progress
**ID:** status-language
Cards SHALL express their lifecycle state by lane placement and express artifact/task progress with labelled counts or bars plus text. Idea-backlog, each lifecycle state, specification, warning, and selection states SHALL use a consistent symbol vocabulary and SHALL NOT rely on hue as their only distinction.

#### Scenario: Completing tasks does not hide the lifecycle lane
**ID:** completion-distinct-from-phase
- **WHEN** a card in `implementing` reports all tasks complete
- **THEN** its progress reads complete while its lane placement continues to state the derived lifecycle
- **AND** an `archived` card remains visually and denotational distinct from a completed-but-active one

#### Scenario: Warnings remain legible without color
**ID:** warning-not-color-only
- **WHEN** a card or spec carries a parse diagnostic
- **THEN** a warning symbol or label communicates the state without color

### Requirement: Narrow layout preserves lifecycle context and action identity
**ID:** narrow-layout
When the full board cannot fit, the presentation SHALL switch to one labelled lifecycle lane (or the idea backlog) at a time, show the current lane's position among all presented lanes, and preserve selected-item identity, scroll context, and essential controls without overlapping or silently truncating action labels.

#### Scenario: One-lane mode keeps context
**ID:** narrow-mode-context
- **WHEN** the terminal width triggers one-lane mode
- **THEN** the current lifecycle lane label, lane position, selected item, and switch/detail/quit controls remain visible