---
id: design-system.tui-board
---

## Purpose

Define a terminal-board presentation that keeps lifecycle, focus, status, controls, and constrained layouts legible and reachable.

## MODIFIED Requirements

### Requirement: Status language separates lifecycle, progress, and activity
**ID:** status-language
Cards SHALL express lifecycle by column placement, express artifact/task progress with labelled counts or bars plus text, and express advisory local activity with a subordinate labelled marker and age. Idea, active, archived, specification, warning, activity, and selection states SHALL use a consistent symbol vocabulary and SHALL NOT rely on hue as their only distinction. Freshness SHALL NOT visually replace or outrank lifecycle and governed progress.

#### Scenario: Complete tasks do not look archived
**ID:** completion-distinct-from-archive
- **WHEN** an active card reports all tasks complete
- **THEN** its progress reads complete while its active lifecycle placement remains clear

#### Scenario: Activity does not look like lifecycle truth
**ID:** activity-subordinate-to-lifecycle
- **WHEN** a card shows fresh or stale activity
- **THEN** lifecycle and governed progress remain the primary status cues
- **AND** activity is labelled as local and advisory

#### Scenario: Activity states survive monochrome output
**ID:** activity-not-color-only
- **WHEN** color is unavailable or cannot be distinguished
- **THEN** fresh, stale, and unknown activity remain distinguishable by text or symbols

#### Scenario: Warnings remain legible without color
**ID:** warning-not-color-only
- **WHEN** a card or spec carries a parse diagnostic
- **THEN** a warning symbol or label communicates the state without color
