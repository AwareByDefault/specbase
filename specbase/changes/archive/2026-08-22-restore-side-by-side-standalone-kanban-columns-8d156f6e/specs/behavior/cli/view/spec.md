---
id: behavior.cli.view
---

## Purpose

The view command gives operators a read-only lifecycle board that uses available terminal space without sacrificing focused navigation or recovery.

## ADDED Requirements

### Requirement: Wide terminals show adjacent lifecycle columns
**ID:** `viewer-wide-columns`
The interactive viewer SHALL present multiple lifecycle columns simultaneously when the terminal can give each visible column a usable width, while preserving one logical selection and scroll position per column.

#### Scenario: A wide board exposes adjacent work
**ID:** `wide-board-shows-adjacent-columns`
- **WHEN** the terminal is wide enough for multiple usable columns
- **THEN** adjacent lifecycle columns appear simultaneously in stable board order
- **AND** each column retains its label, item count, selection, and visible card content

#### Scenario: Visible columns scroll independently
**ID:** `wide-columns-scroll-independently`
- **WHEN** a user scrolls one visible column with the mouse or moves items in the focused column with the keyboard
- **THEN** that column's selection and scroll position change as requested
- **AND** unrelated visible columns keep their selection and scroll position

#### Scenario: Resize crosses the layout boundary
**ID:** `wide-to-narrow-preserves-focus`
- **WHEN** the terminal changes between multi-column and focused-column widths
- **THEN** the same logical lane and item remain selected and visible
- **AND** the constrained layout retains its existing lane-switch, details, help, and quit routes
