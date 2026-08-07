# Enforcement: Legacy Cleanup

Paired with `spec.md` (`behavior.cli.legacy-cleanup`). Detection, surgical marker
removal, outright deletion, project-document preservation, and the reporting
format all bind to the legacy-cleanup suite; the auto-cleanup path binds to the
init and update suites. Only the interactive confirmation prompt has no suite and
stays as behavioural-lens review residue.

```yaml
version: 1
spec: behavior.cli.legacy-cleanup
bindings:
  - id: detection-tests
    covers: [legacy-artifact-detection, marked-config-files-detected, managed-command-artifacts-detected, renamed-command-directory-detected, structure-files-detected]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/legacy-cleanup.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/legacy-cleanup.test.ts]
      cwd: .
    limitations: Detection runs against temporary project fixtures covering marked and unmarked instruction files, per-tool command directories and files, both the current and the previous name of a renamed command directory, and the store and root instruction files; it does not prove the scan runs before the first write.

  - id: surgical-removal-tests
    covers: [surgical-config-edit, mixed-content-preserved, marker-only-file-kept, managed-artifact-removal, command-directory-deleted, parents-survive, project-document-preserved, project-doc-kept]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/legacy-cleanup.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/legacy-cleanup.test.ts]
      cwd: .
    limitations: Exercises marker-block removal with content before, after, and around it, blank-line collapsing, marker-only files surviving empty, directory and file deletion with the parent left in place, and the project document surviving — all on temporary directories rather than a real project.

  - id: reporting-tests
    covers: [cleanup-report, summary-lists-actions, failures-reported-and-cleanup-continues, silent-when-nothing-found, migration-hint-shown]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/legacy-cleanup.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/legacy-cleanup.test.ts]
      cwd: .
    limitations: Asserts the formatted detection summary, cleanup summary, migration hint, error lines, and the empty string when there is nothing to report; it checks the formatter's output rather than what the command prints to a terminal.

  - id: auto-cleanup-tests
    covers: [cleanup-confirmation, detection-shown-first, unprompted-auto-cleanup]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.test.ts
      - test/core/update.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.test.ts, test/core/update.test.ts]
      cwd: .
    limitations: Covers cleanup running unprompted when the session cannot ask and when the user asked to proceed, with instruction files keeping their user content; the detection output is asserted as reported lines, and the interactive prompt itself is never reached in these runs.

  - id: cleanup-prompt-review
    covers: [cleanup-confirmation, detection-shown-first, decline-cancels]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/init.ts
    review:
      procedure: >-
        Read the legacy-cleanup path in the init flow. Confirm the detection
        summary is printed before any change, that an interactive session is asked
        to confirm with yes as the default, that declining returns before any
        artifact is removed or modified and prints how to proceed without the
        prompt, and that a session which cannot ask proceeds to cleanup instead of
        aborting.
      inputs:
        - src/core/init.ts
    limitations: Review-strength; no suite answers the confirmation prompt, so the decline-and-cancel path is verified by inspection only.
    covered_by: [auto-cleanup-tests, surgical-removal-tests]
```
