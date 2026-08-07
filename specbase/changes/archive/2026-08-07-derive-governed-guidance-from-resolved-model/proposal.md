# Proposal: derive-governed-guidance-from-resolved-model

## Why

Six governed workflow-guidance surfaces (`apply`, `update`, `sync`, `verify`,
`archive`, `onboard`, plus `bulk-archive` by inheritance) interpolate a frozen
two-plane primer (`behavior` + `architecture`) instead of the project's resolved
spec model. In any governed repo whose roster differs from two planes — including
this one, which declares six — four of the six core-profile skills mis-teach the
model: an agent running `/spcb:apply` is told that `ops`, `code-quality`,
`design-system`, and `agents` do not exist. The defect is silent because no
conformance test pins the generated surfaces' plane roster against the resolved
model. The dynamic path (`explore`, `authoring`) and the plumbing
(`withGovernedGuidance` accepts model-parametric guidance; every template already
receives the resolved `SpecModel`) exist — the six constants never migrated.

## What Changes

- Convert the six static governed guidance constants in
  `src/core/templates/workflows/governed-guidance.ts` to functions of the
  resolved spec model, matching the existing explore/authoring pattern.
- Delete the back-compat `GOVERNED_PRIMER` two-plane alias so no future caller
  can regress to a frozen roster.
- Rewrite `GOVERNED_ONBOARD_GUIDANCE`'s "two truth planes" pedagogy
  plane-parametrically: the lesson enumerates the declared roster, not a
  hardcoded pair.
- Add a parity conformance test: every generated governed skill and command
  surface's plane roster matches the resolved model it was generated from.
- Make the review-panel skill's per-lens scope prose derive from the lens
  definition, removing the `code-quality` "whole tree" special case that
  contradicts the lens router (`architecture.review-panel-projection` already
  requires projection from the resolved model; this is a conformance fix, not a
  spec change).
- Add curated `design-system` triggers to `DEFAULT_PLANE_TRIGGERS` and correct
  its stale "four default planes" docstring.
- Correct the `proposal` instruction in
  `schemas/spec-driven-governed/schema.yaml` to enumerate all six shipped
  default planes.
- Delete the dead `DEFAULT_SPEC_PLANES` constant in
  `src/core/artifact-graph/types.ts`.
- Regenerate this repo's own `.claude/` skills and commands so the installed
  instruments carry the six-plane roster.

## Planes

### Architectural truth
- `architecture.governed-guidance-projection`: every governed guidance surface
  (skill and command projections) derives its plane roster, purposes, and
  curated pedagogy from the resolved spec model — no surface embeds a frozen
  roster (new)

No other plane needs a delta:
- `architecture.review-panel-projection` already states the lens-projection
  invariant the code-quality scope fix conforms to — code change, no spec change.
- The `agents` plane's planted baselines (`agents/spec-driven`) describe the
  installed instruments; regeneration closes their drift under existing
  enforcement — no new truth.
- The schema.yaml instruction fix is project-overridable schema content, not a
  durable truth of the system; it rides in Impact.

## Spec pairs

- `architecture.governed-guidance-projection` (new) -> paired enforcement via
  one parity conformance test (generate all governed surfaces against a
  multi-plane model; assert each output's roster matches) plus a static check
  that no frozen-roster constant survives in the guidance module.

## Impact

- `src/core/templates/workflows/governed-guidance.ts` — six constants become
  functions; `GOVERNED_PRIMER` deleted; onboard pedagogy rewritten;
  `DEFAULT_PLANE_TRIGGERS` gains `design-system`.
- `src/core/templates/workflows/{apply-change,update-change,sync-specs,verify-change,archive-change,bulk-archive-change,onboard}.ts`
  — call sites pass the guidance function through `withGovernedGuidance`
  (signature already supports it).
- `src/core/templates/workflows/review-panel.ts` — scope phrase derives from
  the lens definition.
- `schemas/spec-driven-governed/schema.yaml` — proposal instruction enumerates
  the six shipped defaults.
- `src/core/artifact-graph/types.ts` — dead `DEFAULT_SPEC_PLANES` removed.
- `test/` — new parity conformance test; existing
  `propose-structure-surface.test.ts` unaffected.
- `.claude/skills/`, `.claude/commands/` — regenerated outputs for this repo.
