## Why

Specbase already derives authoritative work-item lifecycle state for `status`, but installed consumers must reach through CLI or board internals to reuse it. A supported headless snapshot contract gives external clients one stable source for lifecycle, progress, repository position, and actionable diagnostics.

## What Changes

- Expose a versioned package API that resolves one work item by immutable ID and returns its authoritative lifecycle snapshot.
- Include lifecycle, repository position, artifact and task progress, and stable machine diagnostics without requiring a CLI process or terminal renderer.
- Adapt `specbase status --json` to the same snapshot truth so package and CLI consumers cannot observe divergent lifecycle facts.
- Keep aggregate boards, rendering, actions, activity, mutation, and Pi/RPIV execution out of this change.

## Planes

### Behavioral truth
- `behavior.api.lifecycle-snapshots`: installed consumers can resolve stable lifecycle snapshots and actionable resolution diagnostics (new).

### Architectural truth
- `architecture.lifecycle-snapshots`: one headless resolver owns the lifecycle facts consumed by the supported package API and status (new).

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| One resolver owns the lifecycle facts used by the package API and status | `test` | `test/commands/work-item-lifecycle.test.ts` | Fixture-driven tests prove both adapters consume one normalized resolver result and cannot derive competing lifecycle values. |
| The lifecycle boundary stays importable without CLI or terminal runtime coupling | `static-analysis` | `test/core/view/architecture.test.ts` | A deterministic import-graph check fails if the public lifecycle boundary reaches command registration, renderer, or interactive-input modules. |
| Installed consumers resolve active and archived snapshots and receive actionable diagnostics | `test` | `test/cli-e2e/store-lifecycle.test.ts` | A packed-package Vitest journey imports the root API against active, archived, missing, and ambiguous fixtures and asserts the versioned serializable contract. |
| Package and `status --json` consumers receive identical lifecycle facts | `test` | `test/cli-e2e/store-lifecycle.test.ts` | A built CLI/package fixture comparison asserts exact parity for lifecycle, position, progress, and ordered diagnostics. |

## Impact

- Affected public surface: the package root becomes headless, CLI construction moves behind an explicit CLI entrypoint, and generated declarations expose the lifecycle contract.
- Affected systems: lifecycle derivation, artifact/task progress resolution, immutable work-item resolution, and the `status --json` adapter.
- No new runtime dependency and no change to standalone rendering or external workflow execution.
