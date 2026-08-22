## Why

The V1 board shows lifecycle and progress but cannot tell whether local work changed recently. An advisory activity signal helps humans and agents prioritize inspection without redefining governed status or claiming remote presence.

## What Changes

- Derive a local activity observation for each board work card from privacy-bounded project metadata.
- Show `fresh`, `stale`, or `unknown` activity with source and age in cards/details and plain output.
- Add the same structured `activity` field to the shared JSON board model.
- Use injected clock and provider semantics so freshness and failures are deterministic and testable.
- Keep activity advisory: it never changes lifecycle, artifact state, task progress, readiness, or spec truth.
- Defer delivery execution, remote presence, identity/auth, chat, and collaboration.

## Planes

### Behavioral truth

- `behavior.activity-awareness`: local activity fields, freshness semantics, advisory boundary, and privacy/failure behavior (new).
- `behavior.cli.view`: activity presentation in the projected V1 board and outputs (modified).

### Architectural truth

- `architecture.activity-awareness`: injected provider/time ports and separation from governed truth (new).

### Design-system truth

- `design-system.tui-board`: activity expression that remains subordinate to lifecycle/progress (modified).

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| Activity fields, thresholds, unknown handling, and privacy | `test` | `test/core/activity-awareness.test.ts` | Injected clocks/providers prove deterministic advisory observations and bounded reads. |
| View card/detail/plain/JSON projection | `test` | `test/commands/view.activity.test.ts` | CLI fixtures prove every projection carries matching activity fields. |
| TUI activity presentation | `test` / `review` | `test/tui/view-activity.test.ts` / `design` | Headless frames and review prove visible, non-color, subordinate status. |
| Provider and truth boundaries | `test` | `test/core/activity-awareness.architecture.test.ts` | Structural/state tests prove dependency injection, no network, and no status mutation. |

## Impact

- Affected specs: `behavior.activity-awareness`, `architecture.activity-awareness`, `behavior.cli.view`, `design-system.tui-board`.
- Affected code: a new core activity provider/model and V1 board model/plain/JSON/OpenTUI projections.
- No new remote service, persistent project data, runtime dependency, or queue surface.
