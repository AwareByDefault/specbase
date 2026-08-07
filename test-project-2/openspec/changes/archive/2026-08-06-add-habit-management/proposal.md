## Why

habit-tracker currently has no capabilities at all — no domain code, no CLI, no persistence. Before "mark done" and "streaks" can exist, a user needs to be able to add a habit by name and see the habits they've added, with that state surviving between separate runs of the CLI. This is the smallest useful slice and the foundation everything else builds on.

## What Changes

- Add a CLI command to add a habit by name (trimmed, non-empty, max 100 characters, unique).
- Add a CLI command to list habits in the order they were added, one name per line.
- Persist habits to a JSON file at a per-user default path (`~/.habit-tracker/habits.json`), overridable via the `HABIT_TRACKER_DATA` environment variable.
- Reject duplicate habit names (by exact name, the stable key for now) with a clear error; no second habit is created.
- Establish the hexagonal boundary: a pure domain core, a `Store`-shaped port for persistence, and a JSON-file adapter implementing it — enforced by a fitness function at the pre-existing `tools/lint/boundaries.test.ts` path.

**Deliberate deferrals (not forgotten, tracked for later changes):**
- No habit identity beyond name yet — names are unique, so name is the stable key. A separate id will be introduced only when a later slice (e.g. rename, or a name change) forces it.
- No concurrent-write protection — two racing CLI invocations could corrupt the JSON file. Acceptable for this MVP slice; revisit if it becomes real.
- No `ops` plane spec in this change — "JSON file, no network/database, Bun runtime" stays informal project context for now. A dedicated foundations change should formalize it later so it's ungoverned by choice, not by accident.
- No `code-quality` plane spec in this change — no distinctive smell/quality rule emerged yet beyond what `architecture.boundaries` already owns.

## Planes

### Behavioral truth
- `behavior.habits-manage`: a user can add a habit by name and list their habits, with validation, duplicate rejection, and persistence across runs — including the `HABIT_TRACKER_DATA` override, which is itself a client-visible contract. (new)

### Architectural truth
- `architecture.boundaries`: the domain core depends on nothing but its own ports; adapters (including the CLI) depend inward on the domain, never the reverse. (new)
- `architecture.persistence-port`: a `Store` port abstracts persistence for the domain; a JSON-file adapter is the only code that touches the filesystem for habit data. (new)

## Spec pairs

- `behavior.habits-manage` -> paired enforcement via `bun test` (behavioral/integration tests exercising add + list + persistence + validation + duplicate rejection + env override)
- `architecture.boundaries` -> paired enforcement via a static import-boundary fitness function at `tools/lint/boundaries.test.ts`
- `architecture.persistence-port` -> paired enforcement via a conformance test asserting the JSON-file adapter satisfies the `Store` port contract, plus the same boundary fitness function for the "domain never touches fs directly" half of the claim

## Impact

- New code: domain core (habit entity/list logic + `Store` port), JSON-file adapter, CLI entry at `src/main.ts` (add/list commands), fitness function at `tools/lint/boundaries.test.ts`.
- New runtime dependency on the filesystem at a per-user path (`~/.habit-tracker/habits.json` by default); no network, no database.
- No existing code affected — this is the first capability in the project.
