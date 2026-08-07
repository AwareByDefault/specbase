# Enforcement: Creating a Change

Paired with `spec.md` (`behavior.workflow.new-change`). Directory scaffolding,
schema recording, and name validation bind hard to both a unit suite and a real
CLI suite. The propose workflow is a set of instructions an agent follows, so
only its shipping and its content are testable: the suites pin that it is
registered and byte-stable, and the behaviour it prescribes is behavioural-lens
review of the template text.

```yaml
version: 1
spec: behavior.workflow.new-change
bindings:
  - id: change-creation-tests
    covers: [new-change-scaffolds, new-change-created, new-change-creates-parents, new-change-duplicate-rejected, change-name-validation, names-accepted, names-rejected, names-rejected-hyphens]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/utils/change-utils.test.ts
    run:
      command: pnpm
      args: [test, --, test/utils/change-utils.test.ts]
      cwd: .
    limitations: Covers directory creation, parent-directory creation, metadata written with the default and with a custom schema, duplicate rejection, and the full accept/reject name matrix; unit-level, so the CLI process and its exit codes are not exercised here.

  - id: new-change-command-tests
    covers: [new-change-created, new-change-duplicate-rejected, new-change-with-description, names-rejected]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts]
      cwd: .
    limitations: Spawns the real CLI to create a change, write a description file, and fail on a duplicate name and on a name containing a space; it does not re-check the whole name matrix, which the unit suite covers.

  - id: propose-workflow-shipping-tests
    covers: [propose-single-step]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/shared/skill-generation.test.ts
      - test/core/templates/skill-templates-parity.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/shared/skill-generation.test.ts, test/core/templates/skill-templates-parity.test.ts]
      cwd: .
    limitations: Proves the propose workflow is registered in both the skill and command projections and that its payload is byte-stable against a pinned hash; it does not run the workflow, so nothing here shows a change is actually created or its artifacts generated.

  - id: propose-workflow-content-review
    covers: [propose-single-step, propose-from-description, propose-name-in-use, propose-equals-step-by-step, propose-onboarding-narration, propose-states-plan, propose-reports-progress]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/templates/workflows/propose.ts
    review:
      procedure: >-
        Read the propose workflow template in both its skill and command
        projections. Confirm it derives a kebab-case name from the user's
        description, creates the change through the CLI so the schema metadata is
        written, reads the artifact set and build order from status rather than
        hard-coding artifact names, loops until every gating artifact is done, and
        redirects a name collision to a continue-or-rename choice. Confirm it
        states which artifacts it will create before it starts, reports each one
        as it lands, and ends by naming the workflow that begins implementation.
      inputs:
        - src/core/templates/workflows/propose.ts
    limitations: Review-strength; the workflow is agent instruction text, so its effect is verified by reading what it prescribes, not by executing it. Its registration and byte-stability are covered automatically, and the CLI steps it invokes are covered by the change-creation suites.
    covered_by: [propose-workflow-shipping-tests, change-creation-tests, new-change-command-tests]
```
