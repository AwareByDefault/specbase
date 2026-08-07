# Enforcement: Dependency boundaries (domain isolation, inward direction)

```yaml
version: 1
spec: architecture.boundaries
bindings:
  - id: import-boundary-fitness-function
    covers:
      - domain-isolation
      - domain-fs-import-rejected
      - domain-adapter-import-rejected
      - domain-port-usage-accepted
      - inward-dependency-direction
      - adapter-imports-domain-accepted
      - domain-imports-outward-rejected
    mechanism: lint
    strength: automated
    status: active
    targets:
      - tools/lint/boundaries.test.ts
    run:
      command: bun
      args: [test, tools/lint/boundaries.test.ts]
      cwd: .
    limitations: Proves the static import graph has no disallowed edges (domain -> adapters/CLI/ambient I/O); does not prove the domain actually exercises an injected port correctly at runtime.
```
