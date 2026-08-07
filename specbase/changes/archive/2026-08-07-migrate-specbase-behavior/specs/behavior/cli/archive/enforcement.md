# Enforcement: Archive Command

Paired with `spec.md` (`behavior.cli.archive`). The task gate, the ordered
delta application, atomicity, the validation gate, and the governed pair path
all bind to the archive suites; the exact content of the spec-update
confirmation summary and its default-to-decline behavior are honest review
residue.

```yaml
version: 1
spec: behavior.cli.archive
bindings:
  - id: archive-task-gate-tests
    covers: [task-completion-gate, nested-unfinished-blocks, decline-incomplete-stops, complete-tasks-proceed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.test.ts
      - test/utils/task-progress.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.test.ts, test/utils/task-progress.test.ts]
      cwd: .
    limitations: Drives the archive command object with mocked prompts rather than a spawned CLI; the tracked-tasks resolution itself is proven by the shared task-progress suite, not by the archive path for every schema shape.

  - id: archive-sequence-and-delta-tests
    covers: [archive-sequence, dated-archive-target, existing-target-refused, archive-success-report, current-state-update, operation-order, unmatched-delta-aborts, multi-spec-atomicity, pre-archive-validation, invalid-change-blocked, update-confirmation, decline-still-archives, yes-skips-confirmation, skip-specs, skip-specs-moves-directly]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.test.ts]
      cwd: .
    limitations: Unit-level over temporary fixture projects; asserts the dated target name, the refusal to overwrite, operation ordering, multi-spec abort behavior, the validation gate's exit code, and the skip/decline paths — but not the wording of the success report.

  - id: governed-archive-tests
    covers: [governed-archive-sequence, governed-archive-report, governed-pair-atomicity, retired-target-candidates, bypass-warns, unready-enforcement-blocks, incomplete-pair-aborts]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.governed.test.ts]
      cwd: .
    limitations: Covers governed pair application, every blocking condition, retired-target reporting, and the explicit bypass over fixture projects; it does not exercise the legacy and governed paths in one repository.

  - id: confirmation-summary-review
    covers: [confirmation-summary, confirmation-defaults-no]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/archive.ts
      - src/core/specs-apply.ts
    review:
      procedure: >-
        Read the spec-update confirmation path and confirm that, before any
        write, the command lists the specs it will create, the specs it will
        update, and the source of each, and that the prompt's default answer
        declines so that no answer leaves the current specs untouched.
      inputs:
        - src/core/archive.ts
        - src/core/specs-apply.ts
    limitations: Inspection only; the suites mock the confirmation prompt and assert the resulting branch, not the summary text or the prompt's default value.
    covered_by: [archive-sequence-and-delta-tests]
```
