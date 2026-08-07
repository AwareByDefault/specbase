# Enforcement: Habit management (add, list, persistence)

```yaml
version: 1
spec: behavior.habits-manage
bindings:
  - id: add-habit-tests
    covers:
      - add-habit
      - add-habit-succeeds
      - add-duplicate-rejected
      - add-empty-name-rejected
      - add-overlong-name-rejected
      - add-name-trimmed
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/behavior/add-habit.test.ts
    run:
      command: bun
      args: [test, test/behavior/add-habit.test.ts]
      cwd: .
    limitations: Exercises the representative and edge cases for add-name validation; does not fuzz over the full space of possible name strings.

  - id: list-habits-tests
    covers:
      - list-habits
      - list-preserves-order
      - list-empty
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/behavior/list-habits.test.ts
    run:
      command: bun
      args: [test, test/behavior/list-habits.test.ts]
      cwd: .

  - id: cross-run-persistence-tests
    covers:
      - cross-run-persistence
      - persistence-across-processes
      - persistence-independent-of-cwd
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/behavior/persistence.test.ts
    run:
      command: bun
      args: [test, test/behavior/persistence.test.ts]
      cwd: .
    limitations: Spawns src/main.ts as a real, separate OS process per CLI invocation (Bun.spawn), so it proves genuine cross-process persistence rather than reuse of one in-memory object graph. The cwd-independence scenario redirects the default path via a fake HOME rather than the developer's real home directory; it does not prove behavior against every possible home-directory configuration on every OS.

  - id: storage-override-tests
    covers:
      - storage-override
      - env-override-used
      - env-override-absent-uses-default
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/behavior/storage-override.test.ts
    run:
      command: bun
      args: [test, test/behavior/storage-override.test.ts]
      cwd: .
    limitations: The override scenario spawns a real CLI process and inspects the override file directly; the fallback scenario is a pure unit check of the path-resolution function rather than a spawned process, to avoid writing to the real developer machine's home directory.
```
