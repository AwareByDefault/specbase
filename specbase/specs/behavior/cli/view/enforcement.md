# Enforcement: View Command

Paired with `spec.md` (`behavior.cli.view`). Change classification, active
ordering, and the tracked-tasks resolution bind to real suites. The dashboard's
section inventory, the summary metrics, the specification ranking, and the
draft ordering have no suite today and are honest review residue.

```yaml
version: 1
spec: behavior.cli.view
bindings:
  - id: view-classification-tests
    covers: [change-classification, all-done-is-completed, no-tasks-is-draft, partial-is-active, change-ordering, active-sorted-by-progress, nested-tasks-aggregated, unchecked-not-completed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/view.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/view.test.ts]
      cwd: .
    limitations: Drives the view command over fixture projects and asserts section membership and active ordering including tie-breaks; it does not assert the summary metrics, the specification section, or the draft section's ordering.

  - id: tracked-tasks-resolution-tests
    covers: [task-progress-resolution, artifact-chosen-by-apply, resolution-scoped-to-change, schema-fallback-no-error, single-file-unchanged, no-match-is-zero]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/utils/task-progress.test.ts
    run:
      command: pnpm
      args: [test, --, test/utils/task-progress.test.ts]
      cwd: .
    limitations: Exercises the shared task-progress resolver directly — glob aggregation, apply-tracked artifact selection, change-directory scoping, and the fallbacks — rather than through a rendered dashboard.

  - id: dashboard-rendering-review
    covers: [dashboard-sections, all-sections-rendered, unreadable-items-skipped, summary-metrics, populated-summary, empty-summary, specs-display, specs-by-count, unparseable-spec-counts-zero, drafts-alphabetical]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/view.ts
    review:
      procedure: >-
        Read the dashboard render path and confirm it emits a summary, draft,
        active, completed, and specifications section in one pass; that the
        summary reports specification count, requirement count, draft, active
        and completed change counts, and overall task progress, all reading zero
        for an empty project; that specifications are ordered by requirement
        count descending with a spec that fails to parse kept at zero; that
        draft changes are ordered alphabetically; and that a read or parse
        failure omits only the offending item.
      inputs:
        - src/core/view.ts
    limitations: Inspection only; the view suite asserts only classification and active ordering, so nothing automated covers the summary, the specification section, or draft ordering.
    covered_by: [view-classification-tests]
```
