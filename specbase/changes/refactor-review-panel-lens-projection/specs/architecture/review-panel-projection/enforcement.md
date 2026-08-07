# Enforcement: The review-panel skill is projected from the resolved review model

Paired with `spec.md` (`architecture.review-panel-projection`). Two structural
invariants, each protected by a conformance test that drives the generator
directly: (1) the generated skill contains no lens absent from the projection and
the generator consumes the resolved model; (2) init/update regenerate the skill
for every model and re-projection is idempotent.

```yaml
version: 1
spec: architecture.review-panel-projection
bindings:
  - id: skill-projection-conformance
    covers:
      - skill-is-projection
      - no-hardcoded-lens
      - generator-takes-model
    mechanism: conformance
    strength: automated
    status: active
    targets:
      - test/core/templates/review-panel-projection.conformance.test.ts
    run:
      command: pnpm
      args:
        - test
        - --
        - test/core/templates/review-panel-projection.conformance.test.ts
      cwd: .
    limitations: Drives the generator over several resolved models and asserts the
      emitted lens set equals the projection with no extra lens; does not assert
      the skill prose is well written.
  - id: regeneration-conformance
    covers:
      - regenerated-every-model
      - flat-project-registered
      - roster-change-reprojects
      - reprojection-idempotent
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init/review-panel-regeneration.test.ts
    run:
      command: pnpm
      args:
        - test
        - --
        - test/core/init/review-panel-regeneration.test.ts
      cwd: .
    limitations: Runs init/update over a flat fixture and a governed fixture and a
      roster-change fixture, asserting the skill is produced for each and that a
      second run against an unchanged model is byte-identical.
```
