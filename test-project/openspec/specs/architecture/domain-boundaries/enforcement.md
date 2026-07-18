# Enforcement: Domain Layer Boundaries

A static-analysis boundary check (bun test) proves the domain has no adapter
imports and no ambient-time reads.

```yaml
version: 1
spec: architecture.domain-boundaries
bindings:
  - id: import-boundary
    covers: [domain-no-adapter-imports, adapter-import-rejected]
    mechanism: static-analysis
    strength: automated
    status: active
    targets:
      - tools/lint/boundaries.test.ts
    run:
      command: bun
      args: [test, tools/lint/boundaries.test.ts]
      cwd: .
    limitations: Proves imports are absent by source scan, not by type-graph analysis.

  - id: ambient-time-boundary
    covers: [domain-no-ambient-time, ambient-time-rejected]
    mechanism: static-analysis
    strength: automated
    status: active
    targets:
      - tools/lint/boundaries.test.ts
    run:
      command: bun
      args: [test, tools/lint/boundaries.test.ts]
      cwd: .

  - id: injected-clock-review
    covers: [injected-clock-accepted]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/ports/clock.ts
    review:
      procedure: Confirm the domain reads time via the injected Clock port, not ambient time.
      inputs:
        - src/domain
        - src/ports/clock.ts
```
