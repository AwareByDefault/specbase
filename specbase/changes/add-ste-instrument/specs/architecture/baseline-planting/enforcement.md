# Enforcement: Baseline planting seam

Paired with `spec.md` (`architecture.baseline-planting`). The invariants are
structural properties of the planter, so the evidence drives the planter directly:
a conformance test asserts it plants a declared multi-plane set into
`specs/<plane>/<locator>` and leaves an existing file untouched, and an init
integration test asserts an opt-in run plants the whole bundle while a declined
run plants nothing and a customized baseline survives re-init. Bindings are
`planned` until the generalized planter and its suites land; apply resolves them.

```yaml
version: 1
spec: architecture.baseline-planting
bindings:
  - id: planter-conformance
    covers: [planting-is-plane-parametric, plants-across-planes, planting-is-idempotent, existing-file-preserved, rerun-is-noop]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.baseline-planting.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.baseline-planting.test.ts]
      cwd: .
    limitations: Calls the planter with a declared multi-plane baseline set and asserts each pair lands under its own `specs/<plane>/<locator>`, that a pre-existing target file is left unchanged, and that a second run rewrites nothing. It exercises the planter unit directly, not a full interactive init.

  - id: baseline-opt-in-integration
    covers: [planting-is-opt-in, declined-bundle-plants-nothing, plants-across-planes]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.baseline-planting.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.baseline-planting.test.ts]
      cwd: .
    limitations: Asserts an accepted STE selection plants both the `agents/ste-writing` and `ops/ste` pairs, a declined selection plants neither, and the existing agents baseline still plants unchanged. It drives init in-process with a scripted plane picker and confirm, not a real terminal prompt.
```
