# Enforcement: The Governed Workflow

Paired with `spec.md` (`behavior.governed.workflow`). The generated workflows are
text, so most claims bind to the template suites that assert the governed guidance
ships under the governed model and is absent under a legacy one. The archive
readiness gate is real code with its own suite. The per-step claims that no marker
test pins down — apply, update, and artifact creation — are honest review residue.

```yaml
version: 1
spec: behavior.governed.workflow
bindings:
  - id: plane-awareness-generation-tests
    covers:
      - plane-awareness-baked-in
      - generation-writes-plane-guidance
      - regeneration-follows-roster
      - legacy-prompts-byte-identical
      - legacy-workflow-unchanged
      - governed-targets-distinguished
      - generated-workflow-parity
      - parity-checked
      - explore-classifies-insights
      - structural-insight-classified
      - rationale-classified
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/governed-guidance.test.ts
      - test/core/templates/coverage-guidance.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/governed-guidance.test.ts, test/core/templates/coverage-guidance.test.ts]
      cwd: .
    limitations: Generates from a governed and a legacy model in process and asserts byte-identical legacy output, plane-derived guidance for a project-added plane, projection parity, and the explore classification table; it does not run the init or update command end to end.

  - id: verify-sync-archive-onboard-guidance-tests
    covers:
      - verify-uses-bindings-first
      - bindings-are-the-map
      - verify-blocks-on-drift
      - sync-preserves-pairs
      - sync-updates-both
      - sync-leaves-conflict-alone
      - archive-requires-readiness
      - archive-blocks-when-unready
      - archive-bypass-recorded
      - onboarding-teaches-governed-truth
      - onboarding-demonstrates-pairs
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/governed-guidance.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/governed-guidance.test.ts]
      cwd: .
    limitations: Asserts the guidance markers for each step ship in both projections under the governed model and never under legacy; it proves what the agent is told, not what the agent then does.

  - id: archive-readiness-gate-tests
    covers:
      - archive-requires-readiness
      - archive-proceeds-when-ready
      - archive-blocks-when-unready
      - archive-bypass-recorded
      - sync-updates-both
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.governed.test.ts]
      cwd: .
    limitations: Exercises the gate over each blocking class, the explicit bypass, and coherent pair application against temporary projects; it does not exercise the bulk-archive batch report.

  - id: cli-artifact-context-tests
    covers:
      - cli-is-the-source-of-truth
      - status-before-artifact-work
      - instructions-before-writing
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/update-change.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/update-change.test.ts]
      cwd: .
    limitations: Asserts one workflow reads artifact ids from status output, never branches on hardcoded artifact names, and writes to the resolved existing output paths; the same discipline in every other generated workflow is not asserted here.

  - id: creation-and-update-review
    covers:
      - creation-classifies-by-plane
      - cross-plane-deltas
      - identities-authored
      - updates-preserve-pair-coherence
      - update-handles-removal
      - update-handles-move
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/templates/workflows/propose.ts
      - src/core/templates/workflows/update-change.ts
    review:
      procedure: >-
        Read the change-creation and update workflows under the governed model.
        Confirm creation classifies each proposed spec by plane, writes the
        specification and then the enforcement artifact at the CLI-reported
        paths, and assigns a project-wide spec ID with pair-local requirement,
        scenario, and binding IDs. Confirm the update workflow reviews both
        members of a pair together, and that removing a covered ID updates or
        removes the stale binding and reports its former targets, while a move
        keeps the stable spec ID.
      inputs:
        - src/core/templates/workflows/propose.ts
        - src/core/templates/workflows/new-change.ts
        - src/core/templates/workflows/update-change.ts
    limitations: No marker test pins these steps today; the drift consequences they guard against are proved by the governed drift and archive suites, but the instruction to avoid them is verified by reading.
    covered_by: [cli-artifact-context-tests, archive-readiness-gate-tests]

  - id: apply-evidence-review
    covers:
      - apply-resolves-bindings
      - apply-implements-evidence
      - apply-assesses-retired-targets
      - apply-blocks-on-planned
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/templates/workflows/apply-change.ts
    review:
      procedure: >-
        Read the apply workflow under the governed model. Confirm it implements
        the declared evidence alongside the change, names concrete targets and a
        command for each resolved binding, checks surviving bindings and project
        usage before removing a retired target, never deletes a shared target
        automatically, and refuses to mark related work complete while a
        mandatory binding is still planned.
      inputs:
        - src/core/templates/workflows/apply-change.ts
    limitations: Only the generic assertion that apply gains governed guidance is automated; the specific evidence-resolution and retired-target rules are verified by reading the workflow text.
    covered_by: [plane-awareness-generation-tests]
```
