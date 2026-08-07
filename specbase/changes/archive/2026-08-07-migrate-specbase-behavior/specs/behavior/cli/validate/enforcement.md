# Enforcement: Validate Command

Paired with `spec.md` (`behavior.cli.validate`). Scope selection, resolution
parity, diagnostic wording, and the governed pair diagnostics bind to real CLI
and validator suites; the archive-exclusion rule, the bulk aggregate verdict,
the unknown-plane-root diagnostic, and governed *delta* validation are honest
review residue above those suites.

```yaml
version: 1
spec: behavior.cli.validate
bindings:
  - id: validate-cli-tests
    covers: [validation-scope, targeted-validation, bulk-scope, item-resolution, proposal-less-change-resolves, resolution-parity, resolved-invalid-fails, ambiguity-aborts, bulk-reporting, per-item-and-totals, bounded-concurrency]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/validate.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/validate.test.ts]
      cwd: .
    limitations: Spawns the CLI over fixture projects; asserts the bulk payload shape and the resolution fixes, but does not assert that a concurrency limit actually bounds parallelism, only that results are unchanged under one.

  - id: validator-core-tests
    covers: [strict-mode, warning-fails-strict, nested-delta-discovery, delta-header-notes, stray-header-noted, nameless-header-note, main-spec-headers-unaffected, body-keyword-hint, header-only-keyword-hint, one-issue-per-requirement, hint-parity-with-deltas, no-keyword-still-fails, rename-exempt-from-hint]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/validation.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/validation.test.ts]
      cwd: .
    limitations: Exercises the validator directly rather than through a spawned CLI; the skipped-header notes are asserted on change deltas and on the main-spec control case, not on every document surface.

  - id: enriched-diagnostics-tests
    covers: [actionable-diagnostics, no-deltas-guidance, missing-section-guidance, scenario-format-warning, bulleted-steps-warn, next-steps-footer, footer-on-invalid]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/validation.enriched-messages.test.ts
      - test/commands/validate.enriched-output.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/validation.enriched-messages.test.ts, test/commands/validate.enriched-output.test.ts]
      cwd: .
    limitations: Asserts the guidance text for the no-delta, missing-section, and bulleted-scenario cases and the presence of the footer; it does not enumerate every diagnostic the validator can emit.

  - id: governed-validate-tests
    covers: [governed-pair-validation, governed-whole-project, stale-binding-reported, hanging-claim-reported, broken-target-reported]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/validate.governed.test.ts
      - test/core/governed/diagnostics.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/validate.governed.test.ts, test/core/governed/diagnostics.test.ts]
      cwd: .
    limitations: Covers whole-repository and targeted governed validation over fixture projects and the determinism of diagnostic rendering; it does not cover governed change deltas validated against their current pairs.

  - id: locator-and-plane-declaration-tests
    covers: [locator-platform-parity, unknown-plane-prefix, invalid-plane-declaration]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/locator.test.ts
      - test/core/artifact-graph/spec-model.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/locator.test.ts, test/core/artifact-graph/spec-model.test.ts]
      cwd: .
    limitations: Unit-level; proves that an undeclared plane prefix is rejected, that native path forms normalize to one locator, and that malformed plane declarations are rejected — not that the validate command renders each as a located diagnostic.

  - id: issue-location-review
    covers: [issue-location, issue-file-and-path, missing-body-guidance, unknown-plane-root, archive-excluded, any-failure-fails-run]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/validate.ts
      - src/core/validation/validator.ts
      - src/core/governed/discovery.ts
    review:
      procedure: >-
        Read the issue-construction paths in the validator and confirm every
        emitted error, warning, and note carries a source file path and a
        structured location, including the missing-requirement-body case. Read
        the bulk scope assembly in the validate command and confirm the archive
        directory is excluded from the change list and that a single invalid
        item makes the whole run report failure. Read the governed discovery
        walk and confirm a pair under an undeclared plane root is reported with
        its path and the declared plane list.
      inputs:
        - src/commands/validate.ts
        - src/core/validation/validator.ts
        - src/core/governed/discovery.ts
    limitations: Inspection only; no suite asserts archive exclusion, the bulk aggregate verdict, or the unknown-plane-root diagnostic today.
    covered_by: [validate-cli-tests, enriched-diagnostics-tests, governed-validate-tests]

  - id: governed-delta-validation-review
    covers: [governed-change-validation, delta-strands-binding, paired-removal-validates, planned-binding-allowed, incomplete-delta-pair]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/governed/pair-merge.ts
      - src/core/governed/coverage.ts
      - src/core/artifact-graph/governed-validate.ts
    review:
      procedure: >-
        Read the delta merge and coverage paths and confirm that a governed
        change's specification and enforcement deltas are merged onto the
        current pair and validated before apply or archive; that a binding left
        covering a removed identity blocks readiness; that removing a claim and
        its binding together validates and reports the former targets as
        cleanup candidates; that a planned binding is reported as planned,
        permits apply, and blocks archive readiness; and that a one-sided delta
        pair names its missing member.
      inputs:
        - src/core/governed/pair-merge.ts
        - src/core/governed/coverage.ts
        - src/core/artifact-graph/governed-validate.ts
    limitations: The equivalent blocking behavior is asserted at archive time, not at validate time; no suite runs the validate command over a governed change delta for these cases.
    covered_by: [governed-validate-tests]
```
