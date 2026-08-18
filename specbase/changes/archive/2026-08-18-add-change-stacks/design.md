## Context

Specbase has independently movable ideas and changes, stable IDs across idea/change/archive positions, schema-aware artifact status, and deterministic delta application at archive time. It has no repo-local object that says several ordinary changes are deliberate slices of one larger outcome or that a downstream delta is authored against predecessor-projected truth.

The removed initiative/workspace model is an important constraint: it coupled planning to repository topology, affected areas, and cross-store context. Change stacks must not recreate that system. They are a narrow ordering primitive over work items in one planning root.

A useful stack guarantees more than grouping. For accepted specs `S0` and member deltas `D1..Dn`, every prefix `S0 + D1 + ... + Di` must be structurally valid and represent an independently observable review boundary.

## Goals / Non-Goals

**Goals:**

- Represent one finite linear order of ordinary work-item IDs in the repository.
- Preserve an umbrella idea's scratchpad when it is decomposed into a stack.
- Resolve each member by stable ID across idea, active-change, and archived-change positions.
- Let downstream changes be proposed and reviewed against predecessor-projected truth before predecessors archive.
- Validate every projected prefix and require archive order.
- Give agents a first-class workflow for proposing vertical slices rather than horizontal implementation phases.
- Keep unstacked work behavior unchanged.

**Non-Goals:**

- Generic parent/child todos, DAG dependencies, nested stacks, or membership in more than one stack.
- Cross-store or cross-repository coordination.
- Git branches, PR bases, commits, pushes, worktrees, assignees, or merge automation.
- Kanban rendering, OpenTUI, harness activity, or autonomous execution; those are later stacked changes.
- A stack-level governed specification or task list. Normative truth remains in member changes.

## Decisions

### D1: A stack is a repo-local planning object, not an initiative

A stack lives at `specbase/stacks/<id>/`. Its `.openspec.yaml` is the single manifest and carries `id`, `summary`, `created`, and an ordered `members` list. `notes.md` holds non-normative decomposition context. No second `stack.yaml`, copied member title, lifecycle state, completion count, repository target, or PR metadata is stored.

The stack region is ungoverned planning context like `ideas/`: governed enumeration continues to scan current specs and change deltas only. Stack commands validate the manifest's own structure without presenting it as spec truth.

### D2: Stack membership is central, linear, and exclusive

The manifest list is the complete order. It must contain at least two unique stable IDs. Every ID resolves inside the same planning root, and a work item may belong to at most one stack. Nested stack IDs and references outside the resolved root are rejected.

A central manifest was chosen over distributed `stack`/`after` fields because one file makes intended order inspectable, prevents forks and misspelled group IDs, and avoids scanning every work item to reconstruct the sequence.

The initial command surface supports creating, listing, showing, and validating stacks. Creation is serialized with a repo-local lock, rechecks exclusivity under that lock, stages the complete directory, and publishes it by rename. Idea graduation copies to staging and removes the source only after publication, rolling the destination back if source removal fails. Sequence mutation is deliberately narrow: an agent may construct the complete list before creation, while later reorder/rebase ergonomics can be added when a real workflow demands them.

### D3: An idea can graduate either to one change or to one stack

Creating a stack with an idea in context moves the umbrella scratchpad from `ideas/<id>/` to `stacks/<id>/`, preserving its stable ID, summary, creation date, notes, and supporting files. The stack members are separately created work items with their own stable IDs and ordinary lifecycles. The umbrella does not become a fake implementation change.

Ordinary idea-to-change graduation remains unchanged.

### D4: Member state is always derived

Stack inspection resolves each ID by metadata identity across:

1. `ideas/` — planned member;
2. active `changes/` — proposed or in progress, with artifact and task status;
3. `changes/archive/` — completed member.

The manifest stores no member state. Missing, ambiguous, duplicated, malformed-metadata, or cross-root members are reported as manifest errors. A valid present `.openspec.yaml` ID is authoritative; directory fallback exists only for legacy work items whose metadata file or metadata `id` predates stable IDs. Malformed YAML and invalid present IDs never fall back. Archived date prefixes never change identity. Membership checks used by ordinary status/instructions/archive tolerate malformed unrelated stack directories, but remain strict when a manifest claims the selected member.

### D5: Projection reuses the archive delta semantics without writing

The projector starts from the current accepted spec tree and folds only active predecessors before the target member, in manifest order. Archived predecessors are skipped because their deltas are already current truth. Governed members reuse the governed archive planner and pair writer; legacy/default `spec-driven` members reuse `findSpecUpdates` and `buildUpdatedSpec`, so both models apply rename → remove → modify → add exactly as their native archive path does. Projection writes only to an isolated temporary tree.

The public JSON DTO never exposes that temporary tree or an internal archive plan. It reports durable accepted pair paths, ordered predecessor delta spec/enforcement paths, operation counts, prospective result summaries, and diagnostics. Agents can therefore read the exact source artifacts while the temporary implementation detail is deleted safely.

For target member `i`, validation uses the prospective state after members `0..i-1`. A predecessor conflict stops the chain and names the first invalid member; no downstream result is presented as valid. A planned idea has no delta to fold, so it is reported as planned and blocks downstream projection rather than letting a later change validate against a false base.

### D6: Every prefix must validate

Stack validation evaluates members in order and validates each prospective accepted state before advancing. This makes prefix validity deterministic even though whether a slice is meaningfully vertical remains a review judgment.

A stacked change may be proposed before predecessors complete. Apply is not blocked solely by stack order because Specbase does not own Git branch topology. Status and instructions expose predecessor context and warnings. Archive is blocked until all predecessors are archived.

A stacked member with deltas must apply those deltas when archived. Skipping or declining required spec updates cannot advance the stack because downstream projection assumes predecessor truth shipped. Existing skip behavior remains available to unstacked changes and stack members with no delta.

### D7: The stack workflow slices by observable outcome

The repo ships a `specbase-stack` skill and matching `spcb` command projection. Given a large idea, the instrument reads its scratchpad, proposes a finite linear sequence, and evaluates each candidate with the vertical-slice test:

- demonstrable through a real entry point;
- understandable without future members;
- states what becomes newly true at that boundary;
- leaves specs, evidence, and repository state coherent;
- names what is explicitly deferred.

The instrument creates ordinary child ideas first and then creates the stack through the CLI. It does not author one giant final spec and divide only the implementation tasks.

Propose, apply, and archive guidance consume CLI-reported stack context rather than reading manifests directly or guessing paths.

### D8: Stack behavior remains Git-agnostic

The feature does not inspect branches or PRs and does not claim that applying a downstream member is safe in the current checkout. The CLI reports predecessor state; users retain responsibility for Git topology. Worktree and PR orchestration belong to the later Kanban delivery stack.

## Enforcement design

### Command behavior suite

`test/commands/change-stacks.test.ts` runs the CLI against isolated temporary planning roots. It asserts stack creation, idea-to-stack movement with scratchpad preservation, list/show JSON and human shapes, stable member resolution across all three positions, actionable malformed-member diagnostics, and unchanged behavior for unstacked work. Failure is a non-zero test run with the mismatched output or filesystem state.

Boundary: it proves the public command contract, not the projection algebra.

### Projection workflow suite

`test/workflow/change-stack-projection.test.ts` builds small governed pairs where later members modify or remove requirements introduced by predecessors. It asserts stack-aware validation accepts valid chains, rejects the first invalid prefix, names blocked downstream members, and handles mixes of archived and active predecessors without replay. It runs under Vitest in isolated cross-platform paths.

Boundary: examples protect end-to-end wiring; the core suite protects the fold invariant across a broader matrix.

### Archive integration suite

`test/core/archive.change-stacks.test.ts` exercises the native archive path. It asserts out-of-order archive rejection, unchanged files on rejection, normal archive of the next eligible member, rejection of skipped required deltas, and ordinary behavior for unstacked changes.

Boundary: it does not manage Git merge order.

### Manifest invariant suite

`test/core/change-stacks/manifest.test.ts` tests the strict parser and resolver over duplicate IDs, ambiguous/missing members, malformed present metadata, multiple-stack membership, nested stacks, unsafe IDs, identity-preserving idea graduation, and concurrent exclusivity. Table-driven cases provide the highest-leverage check for manifest structure.

Boundary: semantic quality of slice descriptions is not deterministic.

### Projection invariant suite

`test/core/change-stacks/projection.test.ts` treats the projector as a pure state transition. Governed and legacy chains assert order, exactly-once application, pair atomicity, planned-predecessor blocking, durable public DTO paths, first-conflict stopping, and valid-prefix evaluation. Failure identifies the member and projected operation that diverged.

Boundary: it proves structural projection, not that code implements the projected behavior.

### Planning layout evidence

The existing `layout-conformance` command binding remains, and `test/core/init.change-stacks.test.ts` asserts initialization plants `stacks/` and root discovery does not mistake stack content for governed specs or active changes.

### Agent instrument conformance

The `agents.change-stacks` bindings point to `.pi/skills/specbase-stack/SKILL.md` and the generated-workflow parity suite. Conformance checks require the vertical-slice test, explicit-deferral language, CLI-first stack context, and identical semantics across supported tool projections.

Boundary: conformance proves the instrument carries the policy; review remains responsible for whether proposed slices are genuinely meaningful.

## Risks / Trade-offs

- **[Risk] This recreates initiatives under a new name.** → Keep one root, one ordered ID list, no targets, ownership, Git data, cross-store links, or stack-level governed truth.
- **[Risk] Projection drifts from archive behavior.** → Extract and share the prospective-state transition instead of implementing a second delta engine.
- **[Risk] Archived predecessors were moved without applying their deltas.** → A stacked member with deltas cannot advance via skipped or declined updates.
- **[Risk] Earlier proposal edits invalidate downstream review assumptions.** → Stack-wide validation always recomputes from the current chain and reports downstream blockage; base fingerprints/rebase UX remain a later enhancement if recomputation is insufficient.
- **[Risk] Stack creation encourages another large planning ceremony.** → The manifest stays tiny; each member is an ordinary idea/change, and the slicing workflow optimizes for the smallest demonstrable increments.
- **[Risk] A technically valid prefix is not a meaningful vertical slice.** → Keep deterministic checks structural and use the agent instrument plus behavioural review for semantic quality.
- **[Trade-off] Apply does not hard-block on active predecessors.** → This permits real stacked branches without pretending Specbase owns Git; archive order remains the durable gate.
- **[Trade-off] Initial sequence editing is limited.** → Prefer a small stable model first; add reorder/rebase operations only with observed workflows and explicit downstream invalidation semantics.

## Migration Plan

1. Add `stacks/` to root initialization and recognize existing roots without it as valid-but-young until first stack creation or re-init.
2. Add the strict stack manifest model, stable-ID resolver, and read-only stack commands.
3. Extract reusable prospective delta application from archive and add stack projection/validation.
4. Integrate stack context into status, instructions, and archive eligibility.
5. Add idea-to-stack graduation and the generated stack slicing workflow.
6. Regenerate supported workflow projections, run native tests, strict change validation, and coverage.

Rollback removes stack commands and workflow projections while leaving `stacks/` directories as inert user data. Existing ideas, changes, archives, and specs remain readable because their formats are not changed.
