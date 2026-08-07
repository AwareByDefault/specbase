# Enforcement: Governed guidance projection

```yaml
version: 1
spec: architecture.governed-guidance-projection
bindings:
  - id: guidance-roster-parity
    covers: [guidance-projects-resolved-model, multi-plane-roster-projected, roster-change-reprojects-all, pedagogy-follows-roster]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/governed-guidance-projection.test.ts
    run:
      command: npm
      args: [test, --, test/governed-guidance-projection.test.ts]
      cwd: .
    limitations: >
      Asserts the roster line and plane enumeration in every generated surface
      match the model they were generated from; it does not judge the
      pedagogical quality of the onboarding prose beyond its roster claims.

  - id: no-frozen-roster-static
    covers: [no-frozen-roster, guidance-requires-model]
    mechanism: static-analysis
    strength: automated
    status: active
    targets:
      - test/governed-guidance-projection.test.ts
    run:
      command: npm
      args: [test, --, test/governed-guidance-projection.test.ts]
      cwd: .
    limitations: >
      Checks the guidance module exports no static plane-aware guidance string
      and declares no hardcoded roster literal; a determined workaround in
      another module would evade it, but the roster-parity binding would still
      catch the resulting drift.

  - id: triggers-cover-defaults
    covers: [curated-defaults-derived-extras, every-default-plane-curated, user-added-plane-derived]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/governed-guidance-projection.test.ts
    run:
      command: npm
      args: [test, --, test/governed-guidance-projection.test.ts]
      cwd: .
    limitations: >
      Proves each default plane resolves to a curated trigger block and a
      synthetic extra plane resolves to the derived block; the curated prose
      itself is judged by review, not this test.
```
