## Why

The standalone viewer already derives a serializable board internally, but external clients lack a supported package contract for the same project-wide snapshot. Building on the predecessor's stable lifecycle resolver lets Specbase publish one board truth without making consumers import renderer or CLI internals.

## What Changes

- Expose package APIs to derive and validate a versioned, serializable Specbase kanban snapshot.
- Represent stable cards in ordered idea and lifecycle columns with summary counts and machine diagnostics.
- Make `specbase view --json` serialize the same public snapshot returned by the package API.
- Build active and archived change cards from the predecessor lifecycle snapshot contract.
- Defer action availability, external activity, Pi rendering, and all mutation.

## Planes

### Behavioral truth
- `behavior.api.kanban-board`: installed consumers can derive, validate, and compare the stable board snapshot (new).

### Architectural truth
- `architecture.tui-view`: the existing shared board-model boundary becomes the supported headless board contract and consumes lifecycle snapshot truth (modified).

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| The shared headless board composes change cards from predecessor lifecycle snapshots | `test` | `test/core/view/model.test.ts` | Existing model fixtures are extended to prove active/archive cards reuse lifecycle snapshot identity, position, progress, and diagnostics while preserving deterministic aggregate ordering. |
| Installed consumers derive the complete versioned kanban snapshot | `test` | `test/core/view/model.test.ts` and `test/cli-e2e/store-lifecycle.test.ts` | Unit fixtures exhaust the mixed-store shape and diagnostics; the cross-machine clean-package journey proves the root export works from an installed package. |
| Consumers validate unknown board values against a requested version | `test` | `test/commands/view.test.ts` | Validator cases prove supported values retain their typed snapshot and unsupported versions or malformed shapes return stable machine diagnostics. |
| Package derivation and `specbase view --json` return the same board | `test` | `test/cli-e2e/store-lifecycle.test.ts` | A built, packed consumer and the CLI read one unchanged store and compare their parsed snapshot values structurally. |

## Impact

- Affected public surface: package exports and declarations for board derivation, validation, types, and version.
- Affected systems: board collection/protocol and the `view --json` adapter.
- Depends on `expose-stable-specbase-lifecycle-snapshots-e1911fd5`; no renderer protocol, planning-store schema, or execution ownership change.
