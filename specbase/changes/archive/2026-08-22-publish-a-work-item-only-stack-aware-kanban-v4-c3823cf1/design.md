## Context

Kanban v3 is public and serializable, but it includes accepted-specification summaries and a separate specification pane. Stack manifests and member context are already public Specbase APIs, yet the board does not project them. Pi and other clients must not infer stack membership from files or maintain a second lifecycle model.

## Goals / Non-Goals

**Goals:**
- Make the current board a seven-lane work-item contract.
- Preserve stable card identity and deterministic ordering.
- Project lightweight canonical stack membership.
- Keep package, JSON CLI, validator, and TUI consumers aligned.

**Non-Goals:**
- Stop archive from applying deltas to accepted truth.
- Remove specification-listing APIs outside Kanban.
- Define Pi-specific rails, wrapping, or colors.
- Change lifecycle or action semantics in this member.

## Decisions

### 1. Advance the current contract to version 4

Version 4 removes `specs`, `acceptedSpecs`, and `requirements` from the current board shape. Version 3 remains a recognizable legacy validation target where compatibility is required, but current derivation and `specbase view --json` return v4.

### 2. Keep exactly seven work lanes

The board contains Ideas, Proposed, Enforcement, Ready to apply, Implementing, Reviewing, and Archived. Accepted specifications remain available through their existing reference surfaces but are not delivery cards.

### 3. Add lightweight stack annotations to work cards

Each valid stacked card receives `{ id, position, total }`. The board derives this through the public stack store/context functions and reports malformed stack state through ordered diagnostics rather than guessing. The snapshot does not embed projected accepted truth or duplicate the complete manifest.

### 4. Preserve one canonical model

The package API remains the model authority. CLI JSON returns the same structure; standalone and Pi renderers consume it. Presentation clients may decorate stack context but may not derive it independently.

## Enforcement design

### `test/core/view/model.test.ts`

Construct mixed stores with accepted specs, unstacked work, and valid stacks spanning ideas, changes, and archives. Assert v4 contains every work item once, no accepted-spec fields, exact stack annotations, deterministic ordering, and diagnostics for unreadable stack members. Failure is a Vitest assertion. The source does not judge terminal presentation.

### `test/commands/view.test.ts`

Validate representative v4 values and reject v4 values containing removed specification fields, invalid ordinals, totals, or versions. Failure is a Vitest assertion. Legacy compatibility is tested only where the supported validator promises it.

### `test/cli-e2e/store-lifecycle.test.ts`

Build a package consumer and invoke `specbase view --json` against the same store. Assert structural equality and version 4. Failure is a Vitest assertion or non-zero journey command.

## Risks / Trade-offs

- Existing v3 consumers may expect specification summaries; retaining explicit version handling makes the break visible.
- Resolving stack context can add filesystem work; load manifests once per snapshot and index members.
- Invalid stacks must not hide otherwise readable cards; annotate only valid context and emit diagnostics.

## Migration Plan

1. Add v4 types and derivation while retaining explicit v3 validation compatibility.
2. Project stack annotations through one indexed stack read.
3. Update CLI JSON and standalone consumers to v4.
4. Update package exports and packed-consumer tests.
