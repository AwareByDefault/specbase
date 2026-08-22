## Why

The current canonical board mixes delivery work with accepted specification reference material and omits the stack relationships Specbase already knows. Installed clients need a work-focused contract that can render the complete idea-to-archive flow and show ordered delivery context without reading stack manifests themselves.

## What Changes

- Publish the current Kanban snapshot as version 4 with exactly the seven work-item lanes from Ideas through Archived.
- Remove accepted-specification cards and counts from the current board contract while retaining accepted truth in the Specbase store and legacy contract support where required.
- Attach typed stack identity and member position to idea, active-change, and archive cards.
- Keep package, JSON CLI, validation, and standalone rendering structurally aligned.

## Impact

- Affected specs: `behavior/api/kanban-board`
- Affected code: `src/core/view/`, `src/tui/view/`, public exports, and board/CLI/package tests

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| Current snapshots contain work lanes only and preserve stable cards | test | `test/core/view/model.test.ts` | Mixed stores omit accepted specs from v4 while retaining every work item once |
| Cards expose canonical stack position | test | `test/core/view/model.test.ts` | Stacked ideas, changes, and archives carry stable stack id and ordinal; unstacked cards do not |
| Validation and CLI/package parity remain versioned | test | `test/commands/view.test.ts`, `test/cli-e2e/store-lifecycle.test.ts` | Known v4 values validate and installed/CLI outputs match |
