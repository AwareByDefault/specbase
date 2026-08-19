## Why

The repo moves work through propose -> apply -> review -> archive, but nothing
names where a work item actually *sits* in that arc. Status reports per-artifact
done/ready/blocked; it does not say "this change is waiting on its enforcement."
And the pattern of carrying a feature through its whole life is half-built: ideas
are first-class developing-thought records, yet an idea that seeded a change can
lose its thinking once that change closes. There is an open idea in this very
store named "fix-ideas-aren-t-archived-once-they-re-explored-and-proposed" — the
loss is a live, felt problem, not a hypothetical.

We want a work item's lifecycle to be legible, and we want the idea that seeded
it to travel with it to the end.

**DEPENDS ON `split-enforcement-workflow` (change A).** This change REQUIRES that
A be finished and archived BEFORE B lands. B's `proposed` and `enforcement`
lifecycle states are the surfaced form of A's two-phase proposal shape: a change
whose features are drafted and resting while its enforcement is produced. Without
A there is no `proposed` -> `enforcement` pause to model, and B would describe a
state machine whose middle states do not exist. B is authored to land after A.

## What Changes

- **Track a derived lifecycle in status.** `specbase status` SHALL surface the
  change's lifecycle position: `proposed -> enforcement -> ready-to-apply ->
  implementing -> reviewing -> archived`. The state is COMPUTED from artifacts
  and tasks on read — never stored as a `state:` field that can drift and lie.
- **The `proposed` / `enforcement` states come from change A.** `proposed` is
  "features drafted, enforcement pending"; `enforcement` is "the enforcement pass
  is being written." They exist only because A splits proposal into the feature
  and enforcement phases.
- **`ready-to-apply`, `implementing`, `reviewing`, `archived`** derive from the
  apply-required artifact set, task completion, a review footprint, and the
  archive move respectively.
- **One non-derivable state decided.** `reviewing` is the only state a pure
  derivation cannot see, because running the review panel may leave no file mark.
  Decision: write a light `lastReviewedAt` footprint into the change directory
  when the review panel completes, and derive `reviewing` from its presence. This
  is explicit and reversible, not a stored lifecycle `state` flag.
- **Ideas are a loosely-coupled developing-thought backlog.** The workflow
  instruments treat `specbase/ideas/<id>/` as a running thought record an agent
  picks up by passing the idea's directory during explore — not a mandatory,
  literally-linked mandatory record. Whether or not graduation moves the idea
  into the change, the idea's accumulated thinking is preserved.
- **An idea's thinking is archived with its change.** When a change that grew
  from an idea reaches `archived`, the idea's carried `notes.md` and scratchpad
  travel into `changes/archive/<date>-<id>/` alongside the closed change, so the
  idea's reasoning is kept with the work item, not orphaned.

## Planes

### Behavioral truth
- `behavior.workflow.status` (modified): status SHALL report the derived
  lifecycle state alongside the existing per-artifact view. The state is computed,
  user-visible output; it lives here. This is not a new artifact command — it
  sharpens what `status` already reports.
- `behavior.workflow.idea-graduation` (modified): when a change that came from an
  idea reaches `archived`, the idea's thinking SHALL persist alongside the
  archived change. This is an observable file outcome and belongs here, next to
  the existing graduation behavior it extends.

### Agents truth
- `agents.idea-lifecycle` (modified): the repo's own workflow instruments — the
  `save-idea` and `explore` skills — SHALL treat an idea as a loosely-coupled
  developing-thought record and SHALL keep its thinking intact through elevation
  and into the archived change. This describes the SKILL.md artifact and is
  enforced by conformance/drift against it.

### Why no other plane
No new CLI contract shape change beyond the `status` output (behavioral), no new
package or dependency boundary, no ops selection, no code-quality rule. The idea
archive move extends an existing `archive` behavior rather than introducing a new
package or seam.

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| `lifecycle-state-reporting` | `test` | `test/commands/work-item-lifecycle.test.ts` | A test asserts `status` derives and emits a lifecycle state from the artifact set, task completion, and the review footprint, and that it never reads a stored `state` |
| `idea-thinking-archives` | `test` | `test/workflow/idea-archive.test.ts` | A test asserts an idea's `notes.md` and scratchpad are present in `changes/archive/<date>-<id>/` after an idea grown change is archived |
| `instrument-elevates-idea` | `command` (conformance) | `.pi/skills/save-idea/SKILL.md` | A drift check asserts the `save-idea` skill's guidance treats an idea as a movable raised `backlog` record and preserves its thinking through the change lifecycle |
| `instrument-elevates-idea` | `command` (conformance) | `.pi/skills/specbase-explore/SKILL.md` | A drift check asserts explore can resume an idea by passing its directory |

## Impact

- Affected code: `status` derivation (`src/commands/workflow/src/`), the archive
  command (preserve idea dir alongside the archived change), the review guidance
  (write the `lastReviewedAt` footprint), and the workflow skill surface.
- Affected specs: `agents/idea-lifecycle`, `behavior/workflow/status`,
  `behavior/workflow/idea-graduation` (all modified).
- No public contract break; the `status` output gains a field, `archive` copies
  the idea's thinking.

## Open dependencies

- **Must land after A.** B assumes the two-phase proposal states exist
  (`proposed`, `enforcement`). If A is not yet archived, B's lifecycle derives
  cannot run in full.
- **Existing graduation is a move.** The current truth (`behavior/workflow/
  idea-graduation`) already moves an idea directory into the change at propose;
  B formalizes the archive carry-through. Fully relaxing to "idea stays in the
  `ideas/` backlog and is never moved" is an alternative design set: this change
  does not change that move, it only guarantees the idea's thinking is preserved
  when the work item closes. (Out of scope, tracked as residual.)