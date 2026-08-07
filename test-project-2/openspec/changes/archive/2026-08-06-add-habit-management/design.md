## Context

habit-tracker is greenfield: no `src/` exists yet. `package.json` already commits to two paths ahead of any code — `start` runs `src/main.ts`, and `test:boundaries` runs `tools/lint/boundaries.test.ts` — so this design places the CLI entry and the architectural fitness function exactly there rather than inventing new locations. The project mandates a hexagonal shape (pure domain core, injected ports, adapters at the edges) and JSON-on-filesystem persistence with no network/database.

## Goals / Non-Goals

**Goals:**
- Let a user add a habit by name and list habits, with real persistence across separate CLI invocations (not just within one process).
- Establish the domain/port/adapter split now, since every future slice (done, streaks, a Clock port) will build on it.
- Land the import-boundary fitness function early, matching the pre-existing `test:boundaries` script.

**Non-Goals:**
- Marking habits done, streak calculation, or any date/Clock-port logic.
- Habit identity beyond name (see Decision 1).
- Concurrent-write safety for the JSON store.
- Formalizing "no database/network"/toolchain choices as an `ops` spec, or any `code-quality` spec — deliberately deferred per the approved scope.

## Decisions

1. **Identity = name.** Names are the stable key: trimmed, non-empty, ≤100 characters, unique. No separate id is introduced. This avoids modeling identity before a real requirement (rename, or two habits with the same display name) forces it.
   - *Enforcement:* `bun test` behavioral tests exercising add/list happy path, duplicate rejection, and the validation edges (empty/whitespace, over-length, trimming). A behavioral claim like this is best proven by example/integration tests, not lint.

2. **Storage path resolution.** Default to `~/.habit-tracker/habits.json`; `HABIT_TRACKER_DATA`, when set, is used as the file path instead. Defaulting to a per-user path (not cwd-relative) is what makes "persists between runs" actually true regardless of where the CLI is invoked from. The env override is promoted to a first-class behavioral scenario (not just a test convenience) because it's the only way a client can relocate storage.
   - *Enforcement:* a behavioral test asserting that when `HABIT_TRACKER_DATA` is set, that path is read/written instead of the default.

3. **`Store` port shaped for growth, not built for it.** The port carries only `add`/`list` now, but its shape (async, name-keyed) is chosen so that later operations (mark-done, streak reads) can be added as new methods without reshaping the existing two. No unused methods are added speculatively.

4. **Two architecture spec pairs, not one.** `architecture.boundaries` states the general dependency-direction rule (domain depends on nothing but its own ports); `architecture.persistence-port` states the specific `Store`/JSON-adapter contract. Splitting them means the next port (Clock) attaches to `boundaries` without touching `persistence-port`, and the general rule is protected by one reusable fitness function.
   - *Enforcement:* `architecture.boundaries` → a static import-boundary fitness function at `tools/lint/boundaries.test.ts` (one check protects the whole invariant, and matches the pre-existing `test:boundaries` script). `architecture.persistence-port` → the same fitness function covers "domain never imports fs/adapters directly," plus a small conformance test that the JSON-file adapter satisfies the `Store` port's contract (add-then-list round-trips).

5. **Mechanism matches plane.** Behavioral claims → `bun test` (example tests on the representative/edge cases: happy path, duplicate, invalid name, env override, empty list). Architectural claims → lint/static-analysis (import-boundary fitness function) plus one conformance test for the adapter/port contract. Nothing here is a good fit for `review` or `manual` — both invariants are cleanly checkable by automation.

## Risks / Trade-offs

- **[No habit identity beyond name]** -> Mitigation: uniqueness is enforced at add-time; if a future slice needs identity (e.g., rename-without-losing-history), that becomes its own migration, tracked as an open question below rather than solved now.
- **[Concurrent CLI invocations could corrupt the JSON file]** -> Mitigation: explicitly deferred (not forgotten); the adapter should still write via whole-file overwrite (not partial/append) to minimize partial-write corruption, but no file locking is implemented this round.
- **[No governed `ops` spec means "no DB/network" is only informal project context]** -> Mitigation: called out explicitly as a deferral in the proposal; a dedicated foundations change should formalize it so the gap is a choice, not an oversight.
- **[Home-directory resolution can fail in unusual environments]** -> Mitigation: if `HABIT_TRACKER_DATA` is unset and the home directory can't be resolved, fail with a clear error rather than falling back to something surprising (e.g., cwd).

## Migration Plan

First change in the project — no existing state or specs to migrate. Two forward-looking notes for future changes:
- When mark-done/streaks land, `Store` grows new methods; `add`/`list` should not need to change shape.
- If habit identity ever needs to become independent of name, that's a breaking migration for both the domain model and the JSON file format, and should get its own design doc rather than being folded silently into a feature change.

## Open Questions

- None blocking this change. Tracked for later: at what point (if ever) does name-as-identity stop being sufficient (e.g., supporting rename)?
