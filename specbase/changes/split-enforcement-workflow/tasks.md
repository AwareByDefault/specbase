## 1. Workflow instruments

- [x] 1.1 Narrow `spcb:explore` to behavior + structure; drop the stage-three enforcement
      sketch
- [x] 1.2 Narrow `spcb:propose` to stop after `design`; leave the enforcement/testing
      sections as TO-BE-FILLED and write no `enforcement.yaml`
- [x] 1.3 Relax the propose workflow template guardrail so a feature-pass resting state is
      valid
- [x] 1.4 Add `spcb:explore-enforce` (verification-only pass over the feature requirements)
- [x] 1.5 Add `spcb:propose-enforce` (fills `enforcement.yaml` + testing sections + evidence
      tasks; may emit testability-driven MODIFIED deltas)

## 2. Templates

- [x] 2.1 Mark the proposal's `Enforcement intent` and the design's `Enforcement design`
      sections as TO-BE-FILLED in the templates

## 3. Evidence delivery

- [x] 3.1 Add a `command` conformance source (or extend the existing instrument-conformance
      harness) that drift-checks the workflow skill/prompt artifacts against the agents
      `agents/workflow` spec
- [x] 3.2 Link the `command` conformance bindings (`feature-propose-conformance`,
      `explore-enforce-conformance`, `propose-enforce-conformance`) and
      `enforcement-judgment-review` in `specs/agents/workflow/enforcement.yaml`
- [x] 3.3 Execute each conformance source through its native harness and record results in
      change progress

## 4. Cleanup

- [x] 4.1 Confirm no retired sources are shared by surviving bindings before cleanup
