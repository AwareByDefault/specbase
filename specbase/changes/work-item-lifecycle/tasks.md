## 1. Add the derived lifecycle derivation to status

- [x] 1.1 Derive `proposed` / `enforcement` / `ready-to-apply` / `implementing` / `reviewing` / `archived` on read from the artifact set, task completion, the `lastReviewedAt` footprint, and the archive location — with no stored lifecycle `state` field
- [x] 1.2 Expose the derived state in the human `status` report next to the existing per-artifact view, and add it to the JSON emitter via the machine-readable surface

### Evidence for lifecycle-state-reporting (behavior/workflow/status)

- [x] 1.3 Add `test/commands/work-item-lifecycle.test.ts` covering the derived-state derivation (ready-to-apply, proposed, enforcement, reviewing with footprint, archived) and asserting no stored `state` field is read
- [x] 1.4 Bind `lifecycle-state-reporting-tests` / `lifecycle-state-review` in the delta enforcement.yaml and execute the test through the project harness
- [x] 1.5 Run the review binding (`lifecycle-state-review`, `behavioural` lens — light review; full panel deferred by user) and record its finding

## 2. Write the review footprint

- [x] 2.1 Write `lastReviewedAt` stamp into the change directory (`.openspec.yaml`) when the review panel completes, read-only to the lifecycle derivation
- [x] 2.2 Confirm the stamp records that the panel ran, not that it approved (panel stays a non-hard gate)

## 3. Carry an idea's thinking into the archived change

- [x] 3.1 Extend `archive` so a change that grew from an idea preserves the idea's carried `notes.md` and scratchpad into `changes/archive/<date>-<id>/`
- [x] 3.2 Confirm an unproposed idea stays in `specbase/ideas/<id>/` and is unchanged by archive

### Evidence for idea-thinking-archives (behavior/workflow/idea-graduation)

- [x] 3.3 Add `test/workflow/idea-archive.test.ts` asserting an idea's notes and scratchpad are present under `changes/archive/<date>-<id>/` after an idea-grown change is archived
- [x] 3.4 Bind and run `idea-archive-carries-thinking`

## 4. Make the idea workflow treat ideas as a loosely-coupled thought backlog

- [x] 4.1 Update `.pi/skills/save-idea/SKILL.md` and `.pi/skills/specbase-explore/SKILL.md` so the workflow treats an idea as a developing-thought record resumed by passing its directory, preserving its thinking through elevation
- [x] 4.2 Confirm no instrument discards or stubs an idea's carried thinking when a change graduates or archives

### Evidence for idea-elevation-instrument (agents/idea-lifecycle)

- [x] 4.3 Bind the two `command` conformance checks (`idea-lifecycle-instrument-conformance`, `idea-lifecycle-explore-conformance`) to the SKILL.md files and run the project conformance harness
- [x] 4.4 Record that the SKILL surface conforms (or a drift is reported as degraded)

## 5. Validate and archive

- [x] 5.1 Run `specbase validate --change work-item-lifecycle --strict`

- [ ] 5.2 Archive change B only after `split-enforcement-workflow` (A) has archived
- [ ] 5.3 Run `specbase archive` on this change and confirm the derived states and idea-carry behavior ship to the permanent store

## 6. Cleanup

- [ ] 6.1 Remove / relocate the stale open idea `fix-ideas-aren-t-archived...` after confirming its concern is closed by the archive-carry behavior