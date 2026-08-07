# Enforcement: List Command

Paired with `spec.md` (`behavior.cli.list`). Change enumeration, task counting,
archive exclusion, empty states, and ordering bind to the list suites; governed
discovery and coverage rendering bind to the governed list suite. The empty-spec
message and the flat spec row are review residue.

```yaml
version: 1
spec: behavior.cli.list
bindings:
  - id: list-changes-tests
    covers: [list-scope, default-lists-changes, task-counting, checkbox-tally, no-tasks-status, list-output, change-row-progress, empty-state, no-changes-message, sorting, alphabetical-order]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/list.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/list.test.ts]
      cwd: .
    limitations: Drives the list command object over fixture directories; it covers the change scope only — the spec scope, its empty message, and machine-readable output are not exercised here.

  - id: list-governed-tests
    covers: [flag-lists-specs, governed-recursive-discovery, incomplete-pair-listed, governed-row-coverage, governed-record-fields]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/list.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/list.governed.test.ts]
      cwd: .
    limitations: Covers nested governed discovery, hanging and incomplete-pair states, and the machine-readable record fields; the planned, stale, and broken states are asserted by the governed validate and coverage suites rather than here.

  - id: change-list-shape-tests
    covers: [change-row-progress, list-output]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/commands/change-command.list.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/commands/change-command.list.test.ts]
      cwd: .
    limitations: Asserts the change listing's machine-readable shape and its terse/detailed text forms; it does not cover the spec scope.

  - id: list-spec-scope-review
    covers: [flat-spec-row, no-specs-message]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/list.ts
    review:
      procedure: >-
        Read the spec-listing paths and confirm that a flat project's specs are
        each rendered with their identifier and requirement count, and that
        every spec-scope path reports that no specs were found when the scope is
        empty or absent, rather than printing an empty table or throwing.
      inputs:
        - src/core/list.ts
    limitations: Inspection only; no suite exercises the flat spec listing rows or the empty-specs message.
    covered_by: [list-governed-tests]
```
