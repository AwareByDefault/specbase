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

- [ ] 3.1 Implement `test/agents/workflow-enforcement-split.test.ts` asserting the workflow
      shape (feature pass stops before enforcement; enforcement skills exist and fill; only
      testability-driven feedback)
- [ ] 3.2 Link `enforcement-phase-split-tests` and `enforcement-judgment-review` in
      `specs/agents/workflow/enforcement.yaml`
- [ ] 3.3 Execute the test source through the native harness and record the result in change
      progress

## 4. Cleanup

- [ ] 4.1 Confirm no retired sources are shared by surviving bindings before cleanup
