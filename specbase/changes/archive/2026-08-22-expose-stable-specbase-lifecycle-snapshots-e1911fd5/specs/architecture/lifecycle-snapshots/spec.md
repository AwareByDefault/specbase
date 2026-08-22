---
id: architecture.lifecycle-snapshots
---

## Purpose

A single headless lifecycle boundary keeps package consumers and Specbase commands aligned on work-item identity, position, progress, lifecycle, and diagnostics.

## ADDED Requirements

### Requirement: One resolver owns lifecycle snapshot truth
**ID:** `authoritative-lifecycle-resolver`
The lifecycle snapshot boundary SHALL be the single source of work-item resolution, repository position, lifecycle derivation, progress, and diagnostics for both the supported package API and status projection.

#### Scenario: Two adapters inspect one fixture
**ID:** `adapters-share-resolver`
- **WHEN** the package API and status projection inspect the same unchanged fixture
- **THEN** both consume the same resolved lifecycle snapshot rather than deriving parallel values

### Requirement: Lifecycle snapshots remain headless
**ID:** `headless-lifecycle-boundary`
The lifecycle snapshot boundary SHALL be importable through the supported package entrypoint without loading command registration, terminal rendering, or interactive input modules.

#### Scenario: A package-only process imports the API
**ID:** `package-import-needs-no-cli`
- **WHEN** a Node process imports and calls the lifecycle snapshot API from the installed package
- **THEN** it resolves the snapshot without initializing a CLI or terminal runtime
