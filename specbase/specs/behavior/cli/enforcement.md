# Enforcement: CLI cross-command invariants

Paired with `spec.md` (`behavior.cli`). These are universally quantified claims,
so the highest-leverage evidence is iteration over the command registry rather
than per-command assertions: `test/core/completions/command-registry.test.ts`
compares the completion registry against the registered command tree
(commands, aliases, positionals, options) and is the conformance suite for the
surface invariants. The remaining invariants bind representative end-to-end and
unit suites; the genuinely universal residue above them — "*every* command"
rather than "these commands" — is an honest behavioural-lens review.

```yaml
version: 1
spec: behavior.cli
bindings:
  - id: command-registry-conformance
    covers: [completion-registration, registry-matches-commands, verb-noun-structure, verb-first-discovery]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/completions/command-registry.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/completions/command-registry.test.ts]
      cwd: .
    limitations: Iterates the registered command tree and asserts the completion registry matches its visible commands, aliases, flags, and positionals; it proves the surface is verb-first only insofar as the registered top-level names are verbs, and it does not execute the shell completion scripts.

  - id: completion-provider-tests
    covers: [new-command-completable]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/completions/completion-provider.test.ts
      - test/commands/completion.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/completions/completion-provider.test.ts, test/commands/completion.test.ts]
      cwd: .
    limitations: Exercises the completion provider and the `completion` command in-process; the generated scripts are not sourced by a real shell.

  - id: json-output-tests
    covers: [json-output, json-is-clean, json-error-payload]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/cli-e2e/basic.test.ts
      - test/core/commands/change-command.show-validate.test.ts
      - test/commands/validate.test.ts
    run:
      command: pnpm
      args: [test, --, test/cli-e2e/basic.test.ts, test/core/commands/change-command.show-validate.test.ts, test/commands/validate.test.ts]
      cwd: .
    limitations: The end-to-end suite asserts spinner-free JSON for `list`, `schemas`, `status`, `instructions`, and `templates` and the unit suites assert JSON shape and non-zero exit on invalid input; it is a representative sample, not an assertion over every reporting command.

  - id: interactivity-resolution-tests
    covers: [non-interactive-fallback, prompts-disabled]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/utils/interactive.test.ts
    run:
      command: pnpm
      args: [test, --, test/utils/interactive.test.ts]
      cwd: .
    limitations: Covers the interactivity predicate itself — flag, `OPEN_SPEC_INTERACTIVE=0`, CI detection, and non-TTY stdin — but not that every command consults it.

  - id: non-interactive-hint-tests
    covers: [hint-instead-of-prompt]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/change.interactive-show.test.ts
      - test/commands/change.interactive-validate.test.ts
      - test/commands/spec.interactive-show.test.ts
      - test/commands/spec.interactive-validate.test.ts
      - test/commands/show.test.ts
      - test/commands/validate.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/change.interactive-show.test.ts, test/commands/change.interactive-validate.test.ts, test/commands/spec.interactive-show.test.ts, test/commands/spec.interactive-validate.test.ts, test/commands/show.test.ts, test/commands/validate.test.ts]
      cwd: .
    limitations: Asserts the hint-and-non-zero-exit path for the show and validate surfaces; other commands that take an optional item are not covered by these suites.

  - id: error-message-tests
    covers: [actionable-errors, nearest-match-suggestion, unsupported-value-error, type-flag-disambiguation]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/show.test.ts
      - test/commands/validate.test.ts
      - test/cli-e2e/basic.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/show.test.ts, test/commands/validate.test.ts, test/cli-e2e/basic.test.ts]
      cwd: .
    limitations: Covers nearest-match suggestions, the ambiguity error with its `--type` advice, and the unsupported-tool-value error; it does not assert that every error path in the CLI carries a next action.

  - id: exit-code-tests
    covers: [exit-codes, success-exit-zero, invalid-option-exit, unknown-command-exit]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/cli-e2e/basic.test.ts
      - test/commands/legacy-groups-removed.test.ts
    run:
      command: pnpm
      args: [test, --, test/cli-e2e/basic.test.ts, test/commands/legacy-groups-removed.test.ts]
      cwd: .
    limitations: Spawns the real CLI and asserts exit 0 on success, exit 1 for invalid `--tools` values and reserved-keyword combinations, and exit 1 with an "unknown command" message for unregistered names; the full exit-code matrix per command is not enumerated.

  - id: deprecation-notice-tests
    covers: [noun-form-back-compat, experimental-alias, deprecated-option-alias]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
      - test/core/commands/change-command.show-validate.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts, test/core/commands/change-command.show-validate.test.ts]
      cwd: .
    limitations: Asserts the hidden `experimental` alias prints a deprecation notice and that the deprecated `--requirements-only` alias still resolves; the deprecation warning printed by the noun-prefixed command groups is not asserted.

  - id: delta-symbol-tests
    covers: [delta-symbols, delta-counts-displayed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.test.ts]
      cwd: .
    limitations: >-
      Asserts the aggregated totals line emitted when deltas are applied, which
      names each operation by its symbol; other surfaces that summarize deltas
      are not asserted to use the same symbols.

  - id: output-framing-tests
    covers: [output-framing, no-color-respected, progress-human-only]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/spec.test.ts
      - test/cli-e2e/basic.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/spec.test.ts, test/cli-e2e/basic.test.ts]
      cwd: .
    limitations: Asserts one command honors `--no-color` with no ANSI escapes and that machine-readable output is spinner-free; the `NO_COLOR` environment variable and the presence of a progress indicator in human mode are not asserted.

  - id: universal-quantification-review
    covers: [verb-noun-structure, json-output, interactive-selection, picker-offered, non-interactive-fallback, exit-codes, actionable-errors, missing-store-error, delta-symbols, completion-registration, output-framing, noun-form-back-compat, noun-group-warns]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/cli/index.ts
      - src/commands
      - src/utils/interactive.ts
    review:
      procedure: >-
        Walk the command registrations in `src/cli/index.ts` and the
        `register*Command` modules under `src/commands/`. For each registered,
        non-hidden command confirm: the top-level name is a verb and its noun is
        an argument or scoping flag; a reporting command declares `--json`; a
        command that takes an optional item resolves interactivity through
        `isInteractive` and, when non-interactive, prints a hint and sets a
        non-zero exit code instead of prompting; errors are written to stderr
        with a next action. Then confirm every noun-prefixed group still
        registered emits a deprecation notice naming its verb-first
        replacement. Record any command that breaks an invariant as a finding —
        per Clean Specbase, a leaf that cannot satisfy the parent means the
        parent is stated too broadly and must be narrowed, not exempted.
        Finally, run a command outside an initialized project and confirm the
        error says the store was not found and names the command that creates
        it.
      inputs:
        - src/cli/index.ts
        - src/commands
        - src/utils/interactive.ts
    limitations: Review-strength residue above the automated bindings. The suites sample representative commands; only this inspection covers the "every command" quantifier, and it is judgment, not a gate.
    covered_by: [command-registry-conformance, json-output-tests, interactivity-resolution-tests, non-interactive-hint-tests, error-message-tests, exit-code-tests, delta-symbol-tests, output-framing-tests, deprecation-notice-tests]

  - id: interactive-picker-review
    covers: [interactive-selection, picker-offered]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/utils/interactive.ts
      - src/prompts
    review:
      procedure: >-
        For each command that accepts an optional item argument, read the
        selection path and confirm that in an interactive session it lists the
        available items, acts on the chosen one, and preserves every other
        option the user already supplied (for example a `--json` or filter flag
        passed alongside the omitted item).
      inputs:
        - src/utils/interactive.ts
        - src/prompts
    limitations: No existing suite drives a real terminal prompt, so the picker path is verified by inspection only; the automated evidence covers the non-interactive branch of the same decision.
    covered_by: [interactivity-resolution-tests, non-interactive-hint-tests]
```
