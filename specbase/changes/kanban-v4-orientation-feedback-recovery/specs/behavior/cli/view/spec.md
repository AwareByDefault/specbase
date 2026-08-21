---
id: behavior.cli.view
---

## Purpose

The viewer helps an operator understand the selected project's lifecycle state, inspect the right work item, and recover from incomplete information without changing project state.

## ADDED Requirements

### Requirement: The viewer identifies the operator's current context
**ID:** viewer-location-context
The interactive viewer SHALL keep the selected project identity, lifecycle-board identity, read-only status, focused lane, and selected-item position visible whenever those values are available.

#### Scenario: A populated board is immediately locatable
**ID:** populated-board-location-visible
- **WHEN** the interactive board opens with a selected work item
- **THEN** the user can identify the selected project, the lifecycle board, the focused lane, and the item's position without opening detail
- **AND** the board states that inspection is read-only

#### Scenario: Context survives constrained layout
**ID:** constrained-location-visible
- **WHEN** terminal width or height forces a constrained layout
- **THEN** project identity, focused-lane identity, selected-item identity, and read-only status remain available

### Requirement: Visible controls state their outcome before activation
**ID:** viewer-action-signifiers
The interactive viewer SHALL label its visible controls with the outcome they produce and SHALL provide an on-screen keyboard-help route that identifies equivalent keys without requiring the user to recall undocumented shortcuts.

#### Scenario: Detail inspection is named precisely
**ID:** detail-control-is-precise
- **WHEN** an item can be inspected without leaving or mutating the board
- **THEN** its visible control is labelled as viewing details rather than opening or executing the item

#### Scenario: Help exposes complete keyboard routes
**ID:** help-exposes-keyboard-routes
- **WHEN** a user activates the visible help route
- **THEN** the viewer identifies the keys for lane movement, item movement, paging, detail inspection, detail close, help close, and quit
- **AND** help reiterates that the board does not modify project state

### Requirement: Navigation acts on the focused surface
**ID:** viewer-navigation-semantics
The interactive viewer SHALL apply item movement and page movement to the focused lane, apply detail scrolling to the visible detail content, and preserve logical selection while moving between board and detail surfaces.

#### Scenario: Page movement stays in the focused lane
**ID:** page-movement-stays-focused
- **WHEN** a user invokes page movement while a lifecycle lane is focused
- **THEN** selection moves within that lane without switching to another lane
- **AND** the resulting selection remains visible

#### Scenario: Detail movement scrolls visible detail
**ID:** detail-movement-is-visible
- **WHEN** detail content exceeds the available viewport and the user scrolls it
- **THEN** the visible detail content moves in the requested direction
- **AND** closing detail restores the originating item selection

### Requirement: Every completed interaction has visible feedback
**ID:** viewer-immediate-feedback
The interactive viewer SHALL visibly acknowledge lane changes, item changes, detail transitions, empty-lane actions, and attempts to move beyond an available boundary while keeping feedback concise and non-blocking.

#### Scenario: Successful navigation is acknowledged
**ID:** navigation-feedback-visible
- **WHEN** a user changes lane, changes item, opens detail, or closes detail
- **THEN** the viewer states the resulting location or transition

#### Scenario: A no-op explains why nothing moved
**ID:** no-op-feedback-visible
- **WHEN** a user activates item movement in an empty lane or beyond the first or last available item
- **THEN** the viewer explains that no item is available in that direction
- **AND** focus remains in a predictable location

### Requirement: Partial and failed states offer an actionable recovery
**ID:** viewer-actionable-recovery
The viewer SHALL preserve readable project information when some items are unavailable and SHALL present each visible diagnostic with the problem, its consequence for the board, and a concrete next step. A fatal interactive launch failure SHALL preserve the caller's terminal and offer a non-interactive fallback.

#### Scenario: Partial data remains usable
**ID:** partial-data-remains-usable
- **WHEN** one or more project items cannot be read or parsed
- **THEN** the viewer presents the readable remainder
- **AND** it states what information is missing, how the board may be affected, and how to inspect or remediate the diagnostic

#### Scenario: Interactive startup fails safely
**ID:** startup-failure-offers-recovery
- **WHEN** the interactive viewer cannot start or accept its validated snapshot
- **THEN** the caller's terminal remains usable
- **AND** the error identifies the problem, its consequence, and a concrete retry, validation, or `--plain` fallback step
