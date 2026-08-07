# Enforcement: Store port and its JSON-file adapter

```yaml
version: 1
spec: architecture.persistence-port
bindings:
  - id: store-port-boundary-check
    covers:
      - store-port-exists
      - domain-uses-store-port
      - domain-bypasses-store-port-rejected
      - json-adapter-sole-access
      - no-other-fs-access-to-habit-data
    mechanism: lint
    strength: automated
    status: active
    targets:
      - tools/lint/boundaries.test.ts
    run:
      command: bun
      args: [test, tools/lint/boundaries.test.ts]
      cwd: .
    limitations: Proves no module other than the JSON-file adapter imports fs for habit data; does not prove the adapter's on-disk format is correct.

  - id: json-adapter-conformance
    covers:
      - json-adapter-satisfies-contract
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/architecture/json-store-adapter.test.ts
    run:
      command: bun
      args: [test, test/architecture/json-store-adapter.test.ts]
      cwd: .
    limitations: Verifies add-then-list round-tripping through the Store contract; does not test concurrent access, which is explicitly deferred (see design.md).
```
