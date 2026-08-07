# Design: migrate-specbase-architecture

## Context

`migrate-specbase-specs` (archived) set the migration's rules: D2 classifies
every legacy requirement keep/promote/demote/drop, D3 fixes the target tree,
and D7 makes `mapping.md` the coverage guarantee. The architecture plane takes
three locators and 16 manifest rows (14 `command-generation`, 1 `completion`,
1 `artifact-graph`), all verdict **promote** — internal mechanism that is a
real structural invariant.

Promote is the narrowest verdict in the scheme, and the legacy sources are
generous with mechanism narration: class names, function signatures, switch
statements, cache TTLs. The work here is subtraction. What survives is only
what a maintainer would defend in review when someone tries to add a tool, a
shell, or a schema.

## Goals

- Three pairs that state boundaries, not implementations.
- Every binding points at a suite that already asserts the claim; no test is
  written, moved, or renamed by this change.
- Claims the legacy residue asserted but the code never grew are recorded as
  unshipped rather than migrated.

## Non-Goals

- No `src/`, `test/`, or `docs/` edits.
- No behavior-plane content. `state detection`, `schema directory structure`,
  and every user-visible completion command claim route to the behavior
  tranche; restating them here would be a §2 leak.
- No `architecture/` parent pair. Three siblings share no invariant, and
  §4's rule of three says a parent guarding unrelated children is noise.

## Decisions

### D1. Name the boundary, never the class

`ZshGenerator`, `CompletionFactory`, and `CommandAdapterRegistry.getAll()` are
implementations of boundaries, not the boundaries. A spec that names the class
breaks on a rename that changes nothing structural. Each requirement therefore
states the obligation ("every supported shell is served by a generator
implementing one common interface") and lets the enforcement targets carry the
current names.

### D2. Demote the function-level API scenarios

`getBuildOrder()`, `getNextArtifacts()`, `isComplete()`, `getBlocked()` and the
completion provider's 2-second cache are unit-test surface. They are already
guarded by `test/core/artifact-graph/graph.test.ts` and the provider tests, and
nothing about the system's structure depends on their signatures. Manifest rows
2 and 4–6 of legacy `artifact-graph` are demoted by the manifest itself; this
change keeps that line and does not smuggle them back in as scenarios.

### D3. Enforcement: conformance first, architectural review for the residue

Per foundation D4, architecture binds a real check where one exists and the
`architectural` review lens where none does. The split lands as:

| Claim shape | Mechanism | Why |
|---|---|---|
| interface/registry shape and per-implementation conformance | `test` against `test/core/command-generation/*`, `test/core/completions/*`, `test/core/artifact-graph/schema.test.ts` | the suites already assert exactly these shapes |
| projection parity between skills and commands | `test` against `test/core/templates/skill-templates-parity.test.ts` | hashes plus registry iteration catch drift |
| "no *other* code path does this" (negative, whole-repo) | `review`, architectural lens, with `covered_by` naming the deterministic part | no suite can witness the absence of a bypass; inspection can |

Every negative claim is honest about this: a test proves the sanctioned path
works, a reviewer proves no unsanctioned path exists.

### D4. Unshipped residue is dropped, with the reason recorded

The manifest promotes five `template-artifact-pipeline` requirements into
`architecture/command-generation`. Verification against `src/` shows three of
them describe a refactor that never landed (no `WorkflowManifest`,
`ToolProfileRegistry`, `ArtifactSyncEngine`, or `preAdapter`/`postAdapter`
symbols anywhere in `src/` or `test/`; the change's own `tasks.md` is entirely
unchecked). D2 classes an aspiration that never shipped as **drop**, and D2's
whole point is that permanent specs state current truth. Writing them as
invariants would produce three requirements no binding could honestly cover.

The two that did leave a residue are migrated narrowed:

- *Canonical Workflow Manifest* → **one workflow source**: `getSkillTemplates`
  / `getCommandTemplates` / `getCommandContents` in
  `src/core/shared/skill-generation.ts` project both surfaces from a single
  registration, and the parity suite guards the projection.
- *Fidelity Guardrails* → the parity suite itself, which hashes template
  payloads and iterates the production registries so a new workflow is covered
  automatically.

The proposal records all five verdicts so the tranche review can check the
manifest mechanically (D7).

### D5. Check every promoted claim against the code, clause by clause

Two further clauses failed verification and are recorded rather than written:
`add-global-install-scope`'s MODIFIED adapter and generator requirements say
path resolution "receives install context", but `getFilePath` takes a command
id and nothing else, and the generator passes no context. The Codex half of the
same requirement did ship, so the pair states the boundary that exists — a
globally scoped tool's adapter returns an absolute path it resolves itself.

The same check corrected a claim inherited from the flat spec. "Only the
frontmatter and file path SHALL differ" is no longer true: the OpenCode, Pi,
Oh My Pi, and Bob adapters rewrite command references and argument
placeholders in the body. The requirement is therefore written as the
invariant that actually holds and is worth guarding — one authored body, with
mechanical invocation-syntax rewrites confined to the adapter.

## Risks / Trade-offs

- **[Under-narrowing]** — a demoted claim sneaks back as a scenario, and the
  pair churns on every refactor. → Each requirement was checked against the
  "would this survive a rename?" test; class names appear only in enforcement
  targets and `limitations`.
- **[Review bindings look like coverage theater]** — four of the twelve
  bindings are review-strength. → Each names its deterministic residue via
  `covered_by`, so `coverage` reports the pair as partly review-backed rather
  than fully automated, which is the true state.
- **[Manifest drift]** — flagging rows instead of migrating them could read as
  a leak at archive review. → The three unshipped rows are named in the
  proposal with the verification that produced the verdict.

## Migration Plan

Author the three pairs, run the bound suites, validate strict, then check the
diff against the manifest's architecture-destined rows. The remaining tranches
(`behavior`, `ops`, `agents`, `quality-design`) are independent changes.

## Open Questions

- If the template-generation refactor ever lands, its invariants should be
  proposed as a delta to `architecture.command-generation` rather than revived
  from `openspec-old/` — the spec should follow the code, not precede it by
  years.
