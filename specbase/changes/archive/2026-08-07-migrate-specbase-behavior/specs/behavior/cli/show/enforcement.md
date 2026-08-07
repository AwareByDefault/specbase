# Enforcement: Show Command

Paired with `spec.md` (`behavior.cli.show`). Kind detection, governed
resolution, and the governed pair display all bind to the show suites. The
kind-then-item prompt and the ignored-option warning are honest review residue —
no suite drives the top-level picker or asserts the warning.

```yaml
version: 1
spec: behavior.cli.show
bindings:
  - id: show-resolution-tests
    covers: [show-resolution, auto-detect-and-display, type-option-skips-detection, flag-delegation, kind-option-honored]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/show.test.ts
      - test/core/commands/change-command.show-validate.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/show.test.ts, test/core/commands/change-command.show-validate.test.ts]
      cwd: .
    limitations: Spawns the CLI over a fixture project for change and spec detection, ambiguity, and kind-specific options; the explicit type option is exercised through the ambiguity path rather than in isolation.

  - id: show-governed-tests
    covers: [governed-locator-resolution, governed-identity-resolution, ambiguous-basename-refused, governed-pair-display, raw-first-display, governed-json-fields, incomplete-pair-reported]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/show.governed.test.ts
      - test/commands/spec.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/show.governed.test.ts, test/commands/spec.governed.test.ts]
      cwd: .
    limitations: Covers locator and stable-identity resolution, the machine-readable pair shape, the incomplete pair, and ambiguity over fixture projects; it does not cover a project declaring planes beyond the built-in ones.

  - id: show-prompt-and-warning-review
    covers: [kind-prompt, kind-then-item, irrelevant-option-warns]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/show.ts
    review:
      procedure: >-
        Read the no-argument path of the show command and confirm that, in an
        interactive session, it asks which kind of item to show before offering
        the items of that kind. Then read the option-routing path and confirm
        that an option belonging to the other kind is dropped rather than
        applied, and that a warning naming the ignored option is emitted.
      inputs:
        - src/commands/show.ts
    limitations: Inspection only; the suites assert the non-interactive hint instead of driving the picker, and no assertion covers the ignored-option warning.
    covered_by: [show-resolution-tests]
```
