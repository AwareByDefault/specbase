## Context

The current view subsystem already derives a serializable model and validates the renderer handoff, but its names and ownership remain tied to the standalone viewer. The predecessor introduces an authoritative per-work-item lifecycle snapshot. This slice lifts the aggregate board into an installed-package contract and turns CLI JSON into an adapter over it.

The predecessor is still in FEATURE phase, so CLI projection reports it incomplete until paired enforcement exists. This design depends on its declared lifecycle contract and does not duplicate that delta.

## Goals / Non-Goals

**Goals:**
- Publish versioned board derivation, validation, types, and version identity from the package entrypoint.
- Preserve deterministic columns, cards, summary counts, specifications, and diagnostics.
- Make package output and `view --json` structurally identical.
- Reuse lifecycle snapshots for active and archived change facts.

**Non-Goals:**
- Action availability or action validation.
- External activity or workflow execution state.
- Pi-specific rendering or changes to the standalone renderer layout.
- Board mutation, delivery queues, or persisted view state.

## Decisions

### D1. Promote the existing board DTO into a public versioned contract

Retain the current JSON-friendly board shape where compatible: a version discriminant, project identity, summary, idea plus lifecycle lanes, specification summaries, and diagnostics. Rename or alias internal view-centric symbols behind public kanban names so external clients do not depend on renderer terminology.

Export a board version constant and the full serializable types. Incompatible field or semantic changes require a new version; deterministic additive data can remain compatible when consumers ignore unknown fields.

### D2. Expose derivation and validation as separate headless operations

The package entrypoint exposes a derivation function for a selected project root and a validation function for unknown values. Derivation returns the board snapshot. Validation returns a discriminated result containing either the typed snapshot or stable diagnostics, rather than requiring consumers to depend on a renderer-frame decoder or parse exception text.

Keep protocol framing and process exit codes private to the standalone renderer adapter. The public validator checks contract version and shape only.

### D3. Compose cards from stable lifecycle snapshots

Board collection continues to enumerate ideas, active changes, archives, and accepted specs once. For each change identity it calls the predecessor lifecycle snapshot boundary and maps the returned stable facts into a card. Board-level diagnostics merge item diagnostics and collection diagnostics in source/code order.

This makes lifecycle, position, and progress parity structural rather than a duplicated implementation. Idea and specification collection remain board-owned because the predecessor deliberately exposes one change lifecycle snapshot, not an aggregate catalogue.

### D4. Make CLI JSON a zero-transformation adapter

`specbase view --json` derives the public board snapshot and serializes that value directly. It may append the existing trailing newline but must not rename, remove, or recompute fields. Plain and interactive projections remain downstream consumers of the same value.

### D5. Keep deterministic output free of ambient values

Do not include generation timestamps, absolute paths, terminal dimensions, selection, focus, scroll offsets, or renderer state. Cards use immutable metadata IDs and existing deterministic ordering. Diagnostics expose stable codes and project-relative sources with remediation.

## Enforcement design

### `test/core/view/model.test.ts`

- **Contract:** Extend the mixed-store board fixtures to assert the public kanban names/version, deterministic idea and lifecycle columns, stable immutable card IDs, accepted-specification summaries, aggregate counts, ordered diagnostics, and omission of only unreadable items. Inject or spy on the predecessor lifecycle resolver and prove active/archive card identity, position, progress, lifecycle, and diagnostics come from that boundary.
- **Fixtures and harness:** Vitest with existing temporary project builders, representative ideas/active changes/archives/specs, malformed readable members, and all paths built with Node `path` utilities.
- **Failure signal:** Any duplicate/missing card, ordering or summary drift, diagnostic loss, unstable serialization, or bypass of the lifecycle resolver fails the focused model suite.
- **Known boundary:** In-process model tests do not prove package packing or CLI JSON parity; the CLI-E2E journey covers those surfaces.

### `test/commands/view.test.ts`

- **Contract:** Exercise the public unknown-value validator directly for the supported version and valid shape, unsupported versions, malformed lane/card/summary values, and stable diagnostic code/message/remediation fields. Keep renderer-frame exit-code checks separate from the public result contract.
- **Fixtures and harness:** Vitest command/protocol fixtures using serialized board values and table-driven invalid mutations.
- **Failure signal:** Validation accepts an unsupported or malformed value, rejects a supported snapshot, mutates the accepted value, throws expected contract errors as prose, or returns unstable diagnostics.
- **Known boundary:** This source proves validation semantics in-process, not installed declaration resolution.

### `test/cli-e2e/store-lifecycle.test.ts`

- **Contract:** Extend the existing cross-machine store journey to build and pack Specbase, install it into a clean temporary consumer, import public kanban derivation/validation/types/version from the root, and derive the same unchanged store through the package API and `specbase view --json`. Require structural equality of the parsed values and confirm the package path loads no terminal renderer.
- **Fixtures and harness:** Existing Vitest CLI-E2E machine/store fixture, isolated package consumer, local packed tarball after `pnpm run build`, and cross-platform path construction.
- **Failure signal:** Build/install/import/declaration failure, terminal dependency load, invalid package result, CLI process failure, or a structural diff between package and CLI snapshots fails the journey.
- **Known boundary:** This source does not test actions, mutation, external activity, or Pi rendering.

## Risks / Trade-offs

- [Existing view-specific names leak into the public API] -> Export kanban-oriented names and retain internal aliases only for migration.
- [The published shape freezes renderer conveniences] -> Keep transient viewer state outside the snapshot and version only project truth.
- [Board collection repeats predecessor lookup work] -> Prefer correctness and composition now; later indexing can optimize beneath unchanged contracts.
- [CLI parity hides newline differences] -> Define parity on the parsed JSON value while retaining conventional CLI newline output.

## Migration Plan

1. Add public board names and validation results around the existing serializable model.
2. Replace per-change lifecycle derivation in board collection with the predecessor snapshot boundary.
3. Export the derivation, validator, types, and version from the package entrypoint.
4. Adapt `view --json`, plain, and interactive projections to consume the public snapshot.
5. Verify an installed-package fixture and CLI JSON produce equal parsed values.

Rollback restores the internal view exports and prior CLI adapter. No planning-store data changes are required.

## Open Questions

- Whether to preserve the existing numeric board version exactly or introduce a named kanban version constant with the same value. Prefer an alias when the wire shape remains compatible.
