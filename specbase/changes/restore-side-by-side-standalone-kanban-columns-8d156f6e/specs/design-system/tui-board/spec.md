---
id: design-system.tui-board
---

## Purpose

The terminal board presents lifecycle context, focus, progress, and recovery with a legible hierarchy that adapts from comparative wide layouts to constrained focused layouts.

## ADDED Requirements

### Requirement: Wide columns preserve comparison and focus hierarchy
**ID:** `wide-column-layout`
When multiple lifecycle columns fit, the terminal board SHALL compose them as aligned peer regions with distinct labels, boundaries, and scroll content, and SHALL distinguish the focused column and selected card without relying on color alone.

#### Scenario: Adjacent columns remain scannable
**ID:** `adjacent-columns-are-scannable`
- **WHEN** the board presents multiple columns
- **THEN** their headings and card regions align for comparison without overlap
- **AND** each column's boundary, label, count, and focused state remain recognizable

#### Scenario: Dense content does not erase column identity
**ID:** `dense-column-content-keeps-identity`
- **WHEN** adjacent columns contain more cards than their visible height
- **THEN** each column preserves its own heading and scroll context
- **AND** the focused column and selected card remain identifiable without color
