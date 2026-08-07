# Enforcement: ste-lint command contract

Paired with `spec.md` (`behavior.cli.ste-lint`). The command is an observable
input→output contract, so the highest-leverage evidence is example and property
tests over a fixed corpus. `reference/ste-lint.py` is the executable
specification of the rules: its JSON output over a shared corpus is committed as
the golden fixture, and the TS port must match it on the metric fields. Bindings
start `planned`; apply resolves them to `active` once the suite exists and passes.

```yaml
version: 1
spec: behavior.cli.ste-lint
bindings:
  - id: ste-lint-golden-corpus
    covers: [ste-lint-violation-report, per-document-metric, density-normalizes-length, code-spans-excluded]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/ste-lint.golden.test.ts
      - test/fixtures/ste-lint/golden.json
    run:
      command: pnpm
      args: [test, --, test/commands/ste-lint.golden.test.ts]
      cwd: .
    limitations: Asserts the TS engine reproduces the reference linter's category counts and `total_per100w` on a shared corpus and excludes code spans. It proves parity with the reference on that corpus, not that the rule set matches every ASD-STE100 rule.

  - id: ste-lint-input-modes-tests
    covers: [ste-lint-input-modes, input-files-and-globs, input-stdin]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/ste-lint.test.ts
      - test/cli-e2e/ste-lint.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/ste-lint.test.ts, test/cli-e2e/ste-lint.test.ts]
      cwd: .
    limitations: Drives the command with file arguments, a glob, and piped stdin (the e2e layer, which needs a child process) and asserts each mode scores and names its documents; it does not enumerate every glob edge case.

  - id: ste-lint-json-and-gate-tests
    covers: [ste-lint-json-aggregate, json-aggregate-clean, ste-lint-threshold-gate, over-threshold-fails, within-threshold-passes, no-threshold-reports-only, ste-lint-severity, default-errors-marked, default-warnings-marked]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/ste-lint.test.ts
      - test/cli-e2e/ste-lint.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/ste-lint.test.ts, test/cli-e2e/ste-lint.test.ts]
      cwd: .
    limitations: Asserts a single clean JSON aggregate on `--json`, exit non-zero above `--max`, exit zero at or below it and with no `--max`, and that banned-word/marketing categories report as errors while stylistic categories report as warnings. The clean-`--json`-stream and exit-code invariants are the leaf realization of the parent `behavior.cli` bindings, which own the general contract.
```
