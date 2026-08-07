# Enforcement: Paired Enforcement

Paired with `spec.md` (`behavior.governed.enforcement`). Parsing, coverage
classification, drift, retired targets, and target resolution all bind to the
`src/core/governed/` unit suites. Running a binding's declared command and judging
whether a check fits the claim it covers are carried out by the governed workflow,
so those bind to the generated-guidance suite plus an honest review of the residue.

```yaml
version: 1
spec: behavior.governed.enforcement
bindings:
  - id: pair-contract-and-parser-tests
    covers:
      - paired-enforcement-contract
      - pair-identity-matches
      - pair-identity-mismatch
      - structured-bindings
      - binding-test-shape
      - binding-lint-shape
      - binding-review-shape
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/enforcement-parser.test.ts
      - test/core/schemas/governed-spec.schema.test.ts
      - test/core/governed/drift.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/enforcement-parser.test.ts, test/core/schemas/governed-spec.schema.test.ts, test/core/governed/drift.test.ts]
      cwd: .
    limitations: Asserts the document shape, the binding field set, pair-local ID uniqueness, and the identity-mismatch diagnostic; it does not prove an author chose the right mechanism for a given claim.

  - id: evidence-strength-tests
    covers:
      - honest-evidence-strength
      - agentic-review-strength
      - manual-evidence
      - planned-binding-blocks
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/coverage.test.ts
      - test/core/artifact-graph/governed-coverage.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/coverage.test.ts, test/core/artifact-graph/governed-coverage.test.ts]
      cwd: .
    limitations: Proves that planned and unenforced bindings never count as coverage and that a spec covered only by review or manual evidence derives as degraded rather than complete; it does not prove a reviewer refrained from overstating a result.

  - id: lens-and-residue-field-tests
    covers:
      - review-lens-and-residue
      - binding-names-lens
      - binding-covered-by
      - lens-fields-optional
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/enforcement-lens-fields.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/enforcement-lens-fields.test.ts]
      cwd: .
    limitations: Round-trips the two optional fields and their absence; the routing of covered claims to the named lens is proved by the lens suite, not here.

  - id: drift-and-retired-target-tests
    covers:
      - bidirectional-drift
      - stale-after-requirement-removal
      - stale-after-scenario-removal
      - broken-target-hangs-claim
      - retired-target-candidates
      - retired-candidate-reported
      - shared-target-not-retired
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/drift.test.ts
      - test/core/governed/coverage.test.ts
      - test/core/archive.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/drift.test.ts, test/core/governed/coverage.test.ts, test/core/archive.governed.test.ts]
      cwd: .
    limitations: Covers stale coverage IDs, broken targets, retired versus still-shared candidates, and that archive reports candidates without deleting code; it does not scan a real project for orphaned files beyond declared targets.

  - id: target-validation-tests
    covers:
      - resolvable-targets
      - targets-resolve
      - missing-target-reported
      - escaping-target-rejected
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/target-validation.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/target-validation.test.ts]
      cwd: .
    limitations: Unit-level path resolution against a temporary root; symlink escapes and network paths are not exercised.

  - id: pair-coherent-sync-tests
    covers:
      - pair-coherent-sync
      - pair-not-promoted-on-failure
      - pair-promoted-together
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.governed.test.ts
      - test/commands/validate.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.governed.test.ts, test/commands/validate.governed.test.ts]
      cwd: .
    limitations: Exercises pair application, the blocking conditions that leave the change unmoved, and the diagnostics; it does not prove behavior under a partially written working tree.

  - id: binding-execution-guidance-tests
    covers:
      - automated-execution-and-correspondence
      - automated-check-passes
      - automated-check-fails
      - semantic-mismatch-reported
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/governed-guidance.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/governed-guidance.test.ts]
      cwd: .
    limitations: Proves the generated workflow instructs execution of the declared command vector, association of results with covered IDs, separate reporting of semantic correspondence, and blocked readiness on failure; it does not spawn a binding's command.

  - id: binding-execution-review
    covers:
      - automated-execution-and-correspondence
      - semantic-mismatch-reported
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/templates/workflows/verify-change.ts
    review:
      procedure: >-
        Read the verify workflow. Confirm that an affected automated binding is
        run through its declared command, arguments, and working directory, that
        its result is attached to the IDs it covers, that a failed or unstartable
        mandatory check marks the change not ready, and that a correspondence
        judgment is reported at review strength and never upgraded to automated.
      inputs:
        - src/core/templates/workflows/verify-change.ts
    limitations: Execution is performed by the agent following the generated workflow, so no harness proves a real binding ran; this is inspection of the instruction the agent receives.
    covered_by: [binding-execution-guidance-tests]

  - id: conformance-pattern-example-tests
    covers:
      - conformance-binding-pattern
      - artifact-conformance-bound
      - no-new-mechanism
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/review-panel.conformance.test.ts
      - test/core/schemas/governed-spec.schema.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/review-panel.conformance.test.ts, test/core/schemas/governed-spec.schema.test.ts]
      cwd: .
    limitations: One live instance of the pattern — a spec over the resolved lens set bound to a conformance test — plus the closed mechanism vocabulary; it does not prove every artifact-governing spec in a project carries such a binding.

  - id: describe-direction-review
    covers:
      - describe-direction-of-truth
      - artifact-stays-source
      - scaffold-exception
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/templates/workflows/governed-guidance.ts
    review:
      procedure: >-
        Read the governed authoring guidance. Confirm it states that a spec over
        an agent-operational artifact describes that artifact and asserts
        conformance while the runtime keeps reading the artifact as its source of
        truth, that the spec never generates it, and that planted baseline specs
        are the single documented exception to the proposal-to-spec flow with all
        later edits authored through a change.
      inputs:
        - src/core/templates/workflows/governed-guidance.ts
    limitations: The direction-of-truth rule is authoring policy carried in generated prose; no suite asserts these markers today, and none can prove an author obeyed the direction.
    covered_by: [conformance-pattern-example-tests]
```
