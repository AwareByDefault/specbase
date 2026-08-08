# Enforcement: Ideas store architecture

Paired with `spec.md` (`architecture.ideas`). The stable-id invariant and the
governed-enumeration exclusion are both structural and bind conformance tests:
one asserts id immutability across simulated moves; one asserts no idea path
appears in the governed surfaces.

```yaml
version: 1
spec: architecture.ideas
bindings:
  - id: stable-id-conformance
    covers:
      - stable-id-across-moves
      - id-survives-date-prefix
      - id-survives-propose-move
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/ideas/stable-id.test.ts
    run:
      command: pnpm
      args: [test, --, test/ideas/stable-id.test.ts]
      cwd: .
    limitations: Asserts the id field is unchanged after a simulated propose-move and a simulated archive date-prefix rename against fixture objects. Does not guard against a human manually editing the id field; that is a doctor/drift concern, not gated here.

  - id: governed-enumeration-excludes-ideas
    covers:
      - ideas-outside-governed-enumeration
      - resolver-skips-ideas-coverage
      - resolver-skips-ideas-validate
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/ideas/enumeration-exclusion.test.ts
    run:
      command: pnpm
      args: [test, --, test/ideas/enumeration-exclusion.test.ts]
      cwd: .
    limitations: Asserts validate/coverage/list --specs omit idea paths against a fixture store containing an idea. A stronger one-test-per-governed-command guard could be added if the resolver grows more surfaces; the architecture invariant itself is the load-bearing claim.
