# Enforcement: <!-- paired spec title -->

<!--
  One enforcement.md is PAIRED with each governed spec.md in the same plane
  directory. It contains exactly ONE authoritative fenced ```yaml document.

  - `spec` MUST equal the paired spec.md frontmatter `id`.
  - Each binding `id` is a pair-local stable slug, unique within this file.
  - `covers` references ONLY requirement/scenario IDs from the paired spec.
  - Every SHALL/MUST requirement needs at least one binding; a scenario is
    covered directly or by a requirement-level binding claiming full coverage.
  - mechanism: test | lint | static-analysis | command | review | manual
  - strength: automated | review | manual | unenforced
  - status:   planned | active   (planned allowed while authoring; must be
              active with an existing target before verify/archive readiness)
  - `run` is required for automated bindings; `review` for review bindings;
    `procedure` + `rationale` for manual bindings; `limitations` is optional.
-->

```yaml
version: 1
spec: architecture.domain
bindings:
  - id: import-boundary
    covers: [domain-determinism, ambient-time-rejected]
    mechanism: lint
    strength: automated
    status: active
    targets:
      - tools/lint/boundaries.test.ts
    run:
      command: pnpm
      args: [vitest, run, tools/lint/boundaries.test.ts]
      cwd: .
    limitations: Proves imports are absent, not that the injected clock is used.

  - id: determinism-review
    covers: [injected-clock-accepted]
    mechanism: review
    strength: review
    status: active
    targets:
      - docs/architecture/determinism.md
    review:
      procedure: Confirm each domain module resolves time via the injected clock port.
      inputs:
        - src/domain
        - docs/architecture/determinism.md

  - id: injected-clock-manual
    covers: [injected-clock-accepted]
    mechanism: manual
    strength: manual
    status: planned
    targets:
      - src/domain/clock.ts
    procedure: Manually trace one domain call path and confirm it reads the injected clock.
    rationale: No automated rule yet distinguishes injected from ambient clock reads.
    limitations: A single traced path does not prove every module complies.
```
