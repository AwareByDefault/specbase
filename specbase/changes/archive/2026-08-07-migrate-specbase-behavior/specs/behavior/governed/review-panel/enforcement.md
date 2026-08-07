# Enforcement: The Review Panel

Paired with `spec.md` (`behavior.governed.review-panel`). Lens scope resolution is
ordinary code with a unit suite. The panel itself is an orchestration an agent
carries out, so its contract binds to the suite over the generated panel workflow —
which asserts the pipeline, the lens methods, and the non-gating promise ship — with
the run-time behavior of the residue and the router held as honest review residue.

```yaml
version: 1
spec: behavior.governed.review-panel
bindings:
  - id: panel-orchestration-tests
    covers:
      - blind-lens-panel
      - lens-single-concern
      - enforcement-lens-audits-evidence
      - residue-above-gate
      - no-double-reporting
      - findings-non-gating
      - refute-verified
      - completeness-critic
      - review-never-gates
      - policy-read-at-review-time
      - policy-follows-the-specs
      - lens-growth-by-proposal
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/review-panel.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/review-panel.test.ts]
      cwd: .
    limitations: Asserts the shipped panel workflow encodes the router, the deterministic-gate-first order, blindness, the residue handoff, refute-verify, the completeness critic, the read-only non-gating promise, and growth by proposal; it does not run a panel or judge a finding.

  - id: lens-scope-tests
    covers:
      - lens-scope-routing
      - scoped-lens-wins
      - plane-lens-fallback
      - design-system-routes-to-design
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/lenses.test.ts
      - test/commands/coverage.lenses.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/lenses.test.ts, test/commands/coverage.lenses.test.ts]
      cwd: .
    limitations: Proves most-specific-wins routing on segment boundaries, the plane fallback, the design lens scoped to the design-system plane, and the unresolved case; it does not prove the design lens asks a useful question.

  - id: panel-runtime-review
    covers:
      - router-scales-to-change
      - residue-shrinks
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/templates/workflows/review-panel.ts
    review:
      procedure: >-
        Read the panel workflow. Confirm the router spawns only the lenses whose
        subtrees the change touches plus the cross-cutting lenses and logs every
        skipped lens with its reason, and that a lens is handed the deterministic
        binding IDs already covering its territory so adding one shrinks what it
        reviews without any edit to the lens method.
      inputs:
        - src/core/templates/workflows/review-panel.ts
        - src/core/governed/lenses.ts
    limitations: The panel is executed by an agent following this workflow, so no harness observes a real run; skip logging and residue shrinkage are verified by reading the instruction the agent receives.
    covered_by: [panel-orchestration-tests, lens-scope-tests]
```
