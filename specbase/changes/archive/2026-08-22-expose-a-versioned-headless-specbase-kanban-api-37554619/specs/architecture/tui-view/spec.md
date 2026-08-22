---
id: architecture.tui-view
---

## Purpose

The view subsystem supplies one headless board snapshot to installed consumers, command projections, and the standalone terminal renderer while keeping interactive state outside project truth.

## MODIFIED Requirements

### Requirement: Board derivation is independent of output technology
**ID:** `pure-board-model`
The view subsystem SHALL derive its versioned, serializable board snapshot from headless store readers and the authoritative lifecycle snapshot boundary without importing terminal renderer modules, reading terminal dimensions, or owning input state. The supported package API, plain output, JSON output, and interactive output SHALL consume this same snapshot contract.

#### Scenario: Model tests need no terminal runtime
**ID:** `model-tests-without-renderer`
- **WHEN** the board snapshot is derived in a unit test with injected store readers
- **THEN** no terminal renderer or interactive runtime is loaded
- **AND** the result can be serialized and projected by every output mode

#### Scenario: Change cards reuse lifecycle truth
**ID:** `change-cards-use-lifecycle-snapshots`
- **WHEN** the board derives an active or archived change card
- **THEN** its identity, lifecycle, position, progress, and diagnostics come from the authoritative lifecycle snapshot boundary
