# Enforcement: Config Command

Paired with `spec.md` (`behavior.cli.config`). The key-path vocabulary, the type
inference, the value formatting, and the subcommand surface bind to existing unit
suites; the operations that touch a terminal or another process — reset
confirmation, opening an editor, and reading the resolved governed plane set —
have no suite and are honest behavioural-lens review residue.

```yaml
version: 1
spec: behavior.cli.config
bindings:
  - id: subcommand-surface-tests
    covers: [config-subcommands, subcommands-listed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/config.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/config.test.ts]
      cwd: .
    limitations: Asserts the registered subcommands and their options through the completion registry; it does not render the command's help text.

  - id: key-path-and-listing-tests
    covers: [config-key-naming, dotted-key-path, config-get-raw, get-scalar-raw, get-object-as-json, get-missing-key-empty, config-listing, list-human-readable]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/config-schema.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/config-schema.test.ts]
      cwd: .
    limitations: Exercises dotted-path traversal, absent-path results, and the indented value formatter at function level; the explicit-versus-default annotation and the command's exit behaviour on an absent key are not asserted here.

  - id: write-and-clear-tests
    covers: [config-set-coercion, set-coerces-types, set-forced-string, set-nested-creates-path, config-unset-reverts, unset-existing, unset-absent]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/config-schema.test.ts
      - test/commands/config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/config-schema.test.ts, test/commands/config.test.ts]
      cwd: .
    limitations: Type inference, forced strings, intermediate-object creation, and delete-returns-false are asserted at function level; only one write path (`set workflows`) is driven through the registered command, and the confirmation wording for `unset` is not asserted.

  - id: config-location-tests
    covers: [config-path-output, path-printed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/global-config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/global-config.test.ts]
      cwd: .
    limitations: Proves the resolved absolute path across platform and environment overrides; it does not prove `config path` prints that path and nothing else.

  - id: interactive-and-process-operations-review
    covers: [config-reset-guarded, reset-requires-all, reset-confirms, reset-skip-confirm, config-edit-editor, edit-opens-and-waits, edit-no-editor]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/commands/config.ts
    review:
      procedure: >-
        Read the `reset` and `edit` actions in the config command. Confirm reset
        refuses and writes nothing when the all-settings flag is absent, confirms
        before writing defaults, and skips the prompt only when the user asked to.
        Confirm edit refuses with the variable name when no editor is configured,
        creates the file with defaults when absent, launches the editor without a
        shell, and returns only after the editor process closes.
      inputs:
        - src/commands/config.ts
    limitations: Review-strength; no suite drives the confirmation prompt or spawns an editor process, so both paths are verified by inspection only.
    covered_by: [subcommand-surface-tests]

  - id: resolved-planes-read-review
    covers: [resolved-planes-readable]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/commands/config.ts
      - src/core/shared/skill-generation.ts
    review:
      procedure: >-
        Confirm that reading the spec-model plane key through the config command
        reaches the resolved plane set — defaults merged with the project's
        appended or replaced planes — rather than only the stored preference
        document. Record a finding if the read path cannot reach the resolved
        planes.
      inputs:
        - src/commands/config.ts
        - src/core/shared/skill-generation.ts
    limitations: No suite exercises reading the resolved plane set through the config command; plane resolution is tested only where the resolver is consumed, so this claim is unproven and the review is expected to report on it.
```
