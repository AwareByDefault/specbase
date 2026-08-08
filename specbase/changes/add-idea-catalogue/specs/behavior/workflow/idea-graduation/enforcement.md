# Enforcement: Idea graduation by move

Paired with `spec.md` (`behavior.workflow.idea-graduation`). The graduation
contract is behavioral — assert the directory moves, the scratchpad survives,
the id carries forward, and no graduate verb exists.

```yaml
version: 1
spec: behavior.workflow.idea-graduation
bindings:
  - id: propose-move-contract
    covers:
      - propose-moves-idea
      - idea-moved-to-change
      - scratchpad-preserved
      - no-graduate-command
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/workflow/idea-graduation.test.ts
    run:
      command: pnpm
      args: [test, --, test/workflow/idea-graduation.test.ts]
      cwd: .
    limitations: Asserts the move-and-scaffold behavior against a fixture idea. The "no graduate command" assertion is a command-surface conformance check (registry scan) rather than a full CLI parse.
