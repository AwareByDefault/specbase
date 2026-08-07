## 1. Truth: domain core, Store port, JSON adapter, and CLI

- [x] 1.1 Create the domain core module (e.g. `src/domain/habits.ts`) with an in-memory habit-management operation set: add-by-name (trim, reject empty/whitespace-only, reject >100 chars, reject exact-name duplicates) and list-in-insertion-order. No I/O in this module.
- [x] 1.2 Define the `Store` port in the domain layer (e.g. `src/domain/ports/store.ts`) with `add`/`list`-shaped async methods, sized so later operations (mark-done, streak reads) can be added without reshaping these two.
- [x] 1.3 Implement the JSON-file adapter (e.g. `src/adapters/json-file-store.ts`) satisfying the `Store` port: reads/writes a single JSON file via whole-file overwrite (not append), creating the file/parent directory on first write.
- [x] 1.4 Implement storage-path resolution: use `HABIT_TRACKER_DATA` when set and non-empty; otherwise default to `~/.habit-tracker/habits.json`; fail with a clear error if neither is resolvable.
- [x] 1.5 Implement the CLI entry at `src/main.ts` with `add <name>` and `list` commands, wiring the JSON-file adapter into the domain core (dependency injection at the edge) and printing list output one name per line with no numbering/decoration.
- [x] 1.6 Verify manually that add-then-list persists across two separate `bun run src/main.ts` invocations, including with `HABIT_TRACKER_DATA` set to a temp file.

## 2. Evidence: implement enforcement so bindings go active

- [x] 2.1 Implement `test/behavior/add-habit.test.ts` covering binding `add-habit-tests` (happy path, duplicate rejection, empty/whitespace rejection, over-length rejection, trimming); move that binding to `active` in `specs/behavior/habits-manage/enforcement.md`.
- [x] 2.2 Implement `test/behavior/list-habits.test.ts` covering binding `list-habits-tests` (order preserved, empty-list case); move that binding to `active`.
- [x] 2.3 Implement `test/behavior/persistence.test.ts` covering binding `cross-run-persistence-tests` by spawning `src/main.ts` as a real, separate OS process per invocation (`Bun.spawn`) - not two in-process Store instances - for both the basic cross-process scenario and the cwd-independence-of-default-path scenario (via a fake `HOME`); move that binding to `active`.
- [x] 2.4 Implement `test/behavior/storage-override.test.ts` covering binding `storage-override-tests` (`HABIT_TRACKER_DATA` used when set; default used when unset); move that binding to `active`.
- [x] 2.5 Implement the import-boundary fitness function at `tools/lint/boundaries.test.ts` (the path already referenced by the `test:boundaries` script) asserting: domain imports nothing from adapters/CLI/ambient I/O; adapters/CLI may import domain; only the JSON-file adapter imports `fs` for habit data. Move bindings `import-boundary-fitness-function` (in `architecture/boundaries`) and `store-port-boundary-check` (in `architecture/persistence-port`) to `active`.
- [x] 2.6 Implement `test/architecture/json-store-adapter.test.ts` covering binding `json-adapter-conformance` (add-then-list round-trips through the `Store` contract); move that binding to `active`.
- [x] 2.7 Run `bun run typecheck`, `bun test`, and `bun run test:boundaries`; confirm all pass before moving any binding to `active`.

## 3. Cleanup: retired enforcement targets

- [x] 3.1 None — this is the first change in the project; no prior bindings or targets exist to retire.
