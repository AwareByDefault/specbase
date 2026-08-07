# Enforcement: Update

Paired with `spec.md` (`behavior.cli.update`). Preconditions, tool detection,
drift detection, profile and delivery synchronization, and the one-time migration
bind to the existing `update`, drift, migration, and template suites. The
archive-argument and Oh My Pi refresh claims are honest behavioural-lens review
above the generator suites. Command-surface delivery, the plane-catalog sync
offer, and install scope are `planned`: the current source does not implement
them, and one of them contradicts today's behavior — each binding says so.

```yaml
version: 1
spec: behavior.cli.update
bindings:
  - id: update-precondition-tests
    covers: [refresh-only-what-exists, no-configured-tools, unconfigured-tool-not-added]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/update.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/update.test.ts]
      cwd: .
    limitations: Unit-level; asserts the missing-store refusal, the no-configured-tools message, and that only configured tools are written, without spawning the real CLI process.

  - id: new-tool-detection-tests
    covers: [new-tool-directories-reported, new-tool-reported, several-new-tools-one-message, no-new-tools-silent]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/update.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/update.test.ts]
      cwd: .
    limitations: Asserts the reported text and that no artifact is written for the detected tool; the consolidation is checked for two tools, not for every combination.

  - id: configured-tool-detection-tests
    covers: [configured-tool-detection, commands-only-tool-configured]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/update.test.ts
      - test/core/shared/tool-detection.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/update.test.ts, test/core/shared/tool-detection.test.ts]
      cwd: .
    limitations: Covers detection from generated skills and from generated command files; it does not cover a tool whose command surface is served by its skills, which the current source does not model.

  - id: drift-detection-tests
    covers: [drift-triggers-refresh, version-drift, profile-or-delivery-drift, already-up-to-date, forced-refresh]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/update.test.ts
      - test/core/profile-sync-drift.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/update.test.ts, test/core/profile-sync-drift.test.ts]
      cwd: .
    limitations: Drift is computed against a temporary project tree; the drift predicate and the update run are asserted separately rather than as one end-to-end pass.

  - id: profile-and-delivery-sync-tests
    covers: [profile-sync, missing-workflows-added, deselected-workflows-removed, change-summary-reported, delivery-sync, skills-only-removes-commands, commands-only-removes-skills, both-keeps-both]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/update.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/update.test.ts]
      cwd: .
    limitations: Exercises the default and custom profiles and all three delivery settings for a few tools; the summary is asserted for the refreshed-tool and removal lines only, and the sweep does not cover every supported tool.

  - id: governed-regeneration-tests
    covers: [governed-regeneration, planes-refreshed, flat-project-unchanged]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/governed-guidance.test.ts
      - test/core/shared/skill-generation.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/governed-guidance.test.ts, test/core/shared/skill-generation.test.ts]
      cwd: .
    limitations: Proves that generated skills and commands carry plane awareness only under a governed model, that ungoverned output is byte-identical, and that a project's declared planes resolve into the model; it does not drive an update run in a project whose plane set changed between installs.

  - id: migration-tests
    covers: [one-time-migration, union-of-installed, unrecognized-artifacts-ignored, migrated-delivery-matches-artifacts, migration-is-once-only, no-migration-without-artifacts]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/migration.test.ts
      - test/core/update.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/migration.test.ts, test/core/update.test.ts]
      cwd: .
    limitations: The migration routine is exercised directly and the installed-workflow scan through the update command; the reported migration summary text is not asserted, and the once-only property is checked by the preference-already-set path rather than by two consecutive runs.

  - id: oh-my-pi-generator-tests
    covers: [omp-commands-written]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/command-generation/adapters.test.ts
      - test/utils/command-references.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/command-generation/adapters.test.ts, test/utils/command-references.test.ts]
      cwd: .
    limitations: Asserts the generated command path, header, and hyphen rewrite at the generator level; it does not run the update command against a project configured for Oh My Pi.

  - id: oh-my-pi-refresh-review
    covers: [oh-my-pi-refresh, omp-skills-refreshed]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/update.ts
    review:
      procedure: >-
        Read the per-tool refresh loop in src/core/update.ts. Confirm that when
        Oh My Pi is configured its skills are rewritten from the current
        templates with the hyphen-form command transform applied, and that a
        command file is written for every workflow in the active profile,
        created when absent and overwritten when present.
      inputs:
        - src/core/update.ts
    limitations: No suite drives an update run with Oh My Pi configured; the transform selection and the write loop are verified by reading the source.
    covered_by: [oh-my-pi-generator-tests]

  - id: archive-argument-review
    covers: [archive-argument-support, archive-with-identifier, archive-without-identifier]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/templates/workflows/archive-change.ts
    review:
      procedure: >-
        Read the archive workflow's skill and command bodies in
        src/core/templates/workflows/archive-change.ts. Confirm that both
        declare an optional change name as input, that a supplied name is
        validated against the listed changes before use with a fail-fast on no
        match, and that an omitted name falls back to context inference and then
        to prompting the user from the listed changes.
      inputs:
        - src/core/templates/workflows/archive-change.ts
    limitations: The template text is inspected, not executed; whether an agent honors the instruction is outside any suite.
```
