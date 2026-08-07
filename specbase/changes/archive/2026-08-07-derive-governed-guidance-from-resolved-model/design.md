# Design: derive-governed-guidance-from-resolved-model

## Context

`src/core/templates/workflows/governed-guidance.ts` has a split personality.
`GOVERNED_EXPLORE_GUIDANCE` and `GOVERNED_AUTHORING_GUIDANCE` are already
`(specModel) => string` functions calling `buildGovernedPrimer(specModel)`.
The other six exports — `GOVERNED_APPLY_GUIDANCE`, `GOVERNED_UPDATE_GUIDANCE`,
`GOVERNED_SYNC_GUIDANCE`, `GOVERNED_VERIFY_GUIDANCE`,
`GOVERNED_ARCHIVE_GUIDANCE`, `GOVERNED_ONBOARD_GUIDANCE` (and
`GOVERNED_BULK_ARCHIVE_GUIDANCE`, which extends archive) — are static template
strings interpolating `GOVERNED_PRIMER`, a module-private alias defined as
`buildGovernedPrimer(<hardcoded two-plane model>)` (line ~223).

The plumbing for the fix already exists and is fully wired:

- `withGovernedGuidance(base, specModel, guidance)` accepts
  `string | ((specModel: SpecModel) => string)` and calls the function form
  with the resolved model.
- Every workflow template factory (`apply-change.ts`, `archive-change.ts`,
  `update-change.ts`, `sync-specs.ts`, `verify-change.ts`,
  `bulk-archive-change.ts`, `onboard.ts`) already receives the resolved
  `SpecModel` as a parameter.

So the six constants only need their declarations changed from
`` `${GOVERNED_PRIMER}\n...` `` to
`` (specModel: SpecModel) => `${buildGovernedPrimer(specModel)}\n...` `` —
call sites pass the reference through `withGovernedGuidance` unchanged.

Two content-level bake-ins need more than the mechanical swap:

- `GOVERNED_ONBOARD_GUIDANCE` teaches "the two truth planes" as a lesson —
  headings and prose assert a fixed count and enumerate only behavior and
  architecture.
- `DEFAULT_PLANE_TRIGGERS` curates behavior, architecture, ops, code-quality,
  and agents but omits `design-system` (falls through to the generic
  purpose-matched branch), and its docstring still says "four default planes".

Adjacent inconsistencies found by the same audit:

- `review-panel.ts` lines 45 and 88 special-case
  `lens.id === 'code-quality' ? 'the whole tree'` while the lens definition in
  `src/core/governed/lenses.ts` scopes that lens to `code-quality` with
  `crossCutting: false`. The generated prose contradicts the router — and
  `architecture.review-panel-projection` already requires the skill to project
  the resolved model.
- `schemas/spec-driven-governed/schema.yaml` line ~5 enumerates four shipped
  defaults; the project ships six.
- `DEFAULT_SPEC_PLANES` in `src/core/artifact-graph/types.ts:59` is referenced
  nowhere else in `src/` — a dead migration marker.

## Goals / Non-Goals

**Goals:**
- Every governed guidance surface derives its plane roster from the resolved
  model; the frozen two-plane snapshot is gone and cannot return unnoticed.
- One parity conformance test protects the invariant for all surfaces at once.
- The repo's own installed `.claude/` skills and commands carry the six-plane
  roster after regeneration.

**Non-Goals:**
- No change to the resolved-model schema, plane roster semantics, or lens
  routing behavior.
- No redesign of the workflow prose beyond the primer swap — the apply/archive/
  verify/sync/update bodies are already plane-agnostic. Onboard is the sole
  editorial rewrite.
- No decision on whether `code-quality` *should* be cross-cutting. The router
  (`resolveDefaultLens`) scopes it to its plane today; this change makes the
  prose agree with the router. Widening the lens's scope would be a separate
  proposal against `architecture.review-panel-projection`.

## Decisions

- **Function conversion over parameter threading.** Convert the six constants
  to `(specModel: SpecModel) => string` and keep passing them by reference to
  `withGovernedGuidance`, which already dispatches on `typeof guidance ===
  'function'`. Zero call-site signature changes. Chosen over pre-rendering
  guidance at the call site because it matches the existing
  explore/authoring pattern exactly (one idiom, not two).
- **Delete `GOVERNED_PRIMER`, do not deprecate it.** The alias exists only for
  "legacy tests and unmigrated callers"; after this change there are no
  unmigrated callers. Keeping it invites regression. Tests that asserted the
  two-plane shape assert against an explicit two-plane model passed to
  `buildGovernedPrimer` instead.
- **Onboard rewrite is roster-parametric, not roster-free.** The lesson keeps
  its pedagogical structure (truth planes → change creation → proposal →
  specs → paired enforcement → tasks → implementation → archive) but the
  "truth planes" section enumerates the resolved roster (id + purpose per
  plane) instead of asserting "two". Fixed counts are removed from prose.
- **One parity test, generation-level, protects `guidance-projects-resolved-model`
  and `no-frozen-roster` (mechanism: conformance test).** Build a synthetic
  multi-plane model (more planes than the shipped defaults), generate every
  governed workflow's skill and command content through the shared workflow
  source, and assert each output's `planes: [...]` roster line matches the
  model — iterating the workflow registry, not a hand-written list (mirrors
  `guidance-covers-every-workflow` in `architecture.command-generation`).
  Chosen over per-surface example tests: one test covers all current and
  future surfaces; a new workflow that forgets the model fails automatically.
  A second cheap assertion greps the guidance module for a static roster
  literal to pin `no-frozen-roster` structurally.
- **`curated-defaults-derived-extras` (mechanism: conformance test).** Assert
  `DEFAULT_PLANE_TRIGGERS` keys equal the default-shipped plane ids (catches
  both a missing curation like design-system today and a stale extra), and
  that a synthetic user-added plane produces the purpose-derived block.
- **Review-panel scope prose derives from the lens definition.** Replace the
  `lens.id === 'code-quality'` ternary with a phrase computed from
  `lens.scope`/`lens.crossCutting` (`''`/cross-cutting → "the whole tree",
  otherwise `` `<scope>/**` ``). This is conformance to the existing
  `architecture.review-panel-projection` spec; its existing enforcement
  covers it, no new binding.
- **schema.yaml fix is editorial.** Enumerate the six shipped defaults in the
  proposal instruction. It is project-overridable schema text, not generated
  from the model, so the parity test does not cover it; it stays outside the
  new spec's claims.

## Risks / Trade-offs

- [Existing tests pin the two-plane primer output] -> They assert against
  `buildGovernedPrimer` with an explicit two-plane model, or update snapshots;
  behavior for a genuinely two-plane project is unchanged by construction
  (same function, same input).
- [Onboard rewrite drifts pedagogically from the original lesson] -> Keep the
  section skeleton and only parameterize the roster enumeration; review the
  diff against the archived original.
- [Regenerated `.claude/` outputs churn many files in one commit] -> Mechanical
  regeneration via the CLI's own update path; the parity test plus the
  installed-instrument drift checks (agents plane) verify the result rather
  than hand inspection.
- [Deleting `DEFAULT_SPEC_PLANES` breaks an unseen consumer] -> It is
  referenced only at its declaration in `src/`; compile + full test suite
  gates the removal.

## Migration Plan

1. Convert the six guidance constants to functions; delete `GOVERNED_PRIMER`;
   fix call sites if any pass the old constant outside `withGovernedGuidance`.
2. Rewrite the onboard lesson plane-parametrically.
3. Add `design-system` triggers; fix the triggers docstring.
4. Fix review-panel scope prose; fix schema.yaml enumeration; delete
   `DEFAULT_SPEC_PLANES`.
5. Add the parity conformance test and the triggers-completeness test; run the
   full suite.
6. Regenerate this repo's `.claude/` skills and commands; verify
   `/spcb:apply` and `/spcb:archive` surfaces list all six planes.

Rollback: revert the commit; generated `.claude/` files regenerate from the
previous templates the same way.
