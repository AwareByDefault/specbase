## 1. Workflow instruments

- [ ] 1.1 Narrow `spcb:explore` to behavior + structure; drop the stage-three enforcement
      sketch
- [ ] 1.2 Narrow `spcb:propose` to stop after `design`; leave the enforcement/testing
      sections as TO-BE-FILLED and write no `enforcement.yaml`
- [ ] 1.3 Relax the propose workflow template guardrail so a feature-pass resting state is
      valid
- [ ] 1.4 Add `spcb:explore-enforce` (verification-only pass over the feature requirements)
- [ ] 1.5 Add `spcb:propose-enforce` (fills `enforcement.yaml` + testing sections + evidence
      tasks; may emit testability-driven MODIFIED deltas)

## 2. Templates

- [ ] 2.1 Mark the proposal's `Enforcement intent` and the design's `Enforcement design`
      sections as TO-BE-FILLED in the templates

## 3. Evidence delivery

- [ ] 3.1 Add a `command` conformance source (or extend the existing instrument-conformance
      harness) that drift-checks the workflow skill/prompt artifacts against the agents
      `agents/workflow` spec
- [ ] 3.2 Link the `command` conformance bindings (`feature-propose-conformance`,
      `explore-enforce-conformance`, `propose-enforce-conformance`) and
      `enforcement-judgment-review` in `specs/agents/workflow/enforcement.yaml`
- [ ] 3.3 Execute each conformance source through its native harness and record results in
      change progress

## 4. Cleanup

- [ ] 4.1 Confirm no retired sources are shared by surviving bindings before cleanup
