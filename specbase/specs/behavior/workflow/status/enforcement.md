# Enforcement: Workflow Status

Paired with `spec.md` (`behavior.workflow.status`). Most of this pair binds hard:
the status command is driven end to end by a real CLI suite, completion detection
has its own filesystem suite, and the machine-readable fields are asserted by the
store and governed-context suites. The one claim left as review residue is that
the graceful empty-state exit did not leak into other commands.

```yaml
version: 1
spec: behavior.workflow.status
bindings:
  - id: status-command-tests
    covers: [status-reports-artifact-states, status-shows-three-states, status-names-missing-deps, status-shows-completion-summary, status-on-empty-change, status-empty-is-not-an-error, empty-status-human, empty-status-machine, status-errors-preserved, unnamed-change-with-changes-present, named-change-missing, status-core-fields]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts]
      cwd: .
    limitations: Spawns the real CLI over fixture projects covering scaffolded, partial, and complete changes plus both empty-state exits and both failure paths; it does not assert the ordering of artifacts within the report.

  - id: status-formatting-tests
    covers: [status-shows-output-paths, status-shows-three-states, status-names-missing-deps]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/instruction-loader.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/instruction-loader.test.ts]
      cwd: .
    limitations: Covers the status formatter directly — done/ready/blocked labelling, missing-dependency lists, per-artifact output paths, the complete flag, and build-order sorting; unit-level, so the rendered terminal output is not inspected.

  - id: completion-detection-tests
    covers: [completion-read-from-disk, single-file-completion, glob-completion, missing-change-dir-state]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/state.test.ts
      - test/core/artifact-graph/workflow.integration.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/state.test.ts, test/core/artifact-graph/workflow.integration.test.ts]
      cwd: .
    limitations: Exercises named-file and pattern completion, empty and missing directories, non-matching files, and nested paths against a real temporary filesystem; symlinked and permission-denied cases are not covered.

  - id: next-work-tests
    covers: [next-work-from-status, ready-artifacts-are-next]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/graph.test.ts
      - test/core/artifact-graph/workflow.integration.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/graph.test.ts, test/core/artifact-graph/workflow.integration.test.ts]
      cwd: .
    limitations: Proves the ready set advances correctly as artifacts are written, including out-of-order creation; it establishes that status can answer "what next" but cannot prove no other command offers the same answer.

  - id: status-machine-context-tests
    covers: [status-machine-context, status-next-steps, status-action-context]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/declared-store-fallback.test.ts
      - test/commands/legacy-groups-removed.test.ts
      - test/commands/store-references.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/declared-store-fallback.test.ts, test/commands/legacy-groups-removed.test.ts, test/commands/store-references.test.ts]
      cwd: .
    limitations: Asserts machine-readable status carries next-step guidance and an action context reporting where the change lives, through the real CLI; these suites approach the fields from the store-selection angle, so they pin the fields' presence and mode rather than every field of the action context.

  - id: governed-status-model-tests
    covers: [status-spec-model]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/governed-context.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/governed-context.test.ts]
      cwd: .
    limitations: Proves the governed wrapper attaches the resolved spec model and pair context and returns the base object unchanged under a non-governed schema; unit-level, so the field is not observed on a spawned CLI run.

  - id: empty-state-scope-review
    covers: [other-commands-unaffected]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/workflow/status.ts
      - src/commands/workflow/shared.ts
    review:
      procedure: >-
        Read the status command's no-changes branch and the shared
        change-resolution helper it calls. Confirm the graceful exit lives in the
        status command body and not in the shared helper, so a command other than
        status that resolves a change against an empty project still fails with
        its original error.
      inputs:
        - src/commands/workflow/status.ts
        - src/commands/workflow/shared.ts
    limitations: Review-strength; no suite runs a non-status command against a project with no changes, so the non-regression is verified by inspecting where the branch sits.
    covered_by: [status-command-tests]
```
