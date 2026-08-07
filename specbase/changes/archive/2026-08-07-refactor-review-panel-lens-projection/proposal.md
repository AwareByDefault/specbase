## Why

The review panel's lens set is stated in four places that have already drifted:
`specbase/config.yaml` (`specModel.planes[].reviewLens`), `DEFAULT_LENSES` in
`src/core/governed/lenses.ts`, the `agents/review-panel` spec, and an inline
Markdown table in `src/core/templates/workflows/review-panel.ts`. That last one
ships a stale four-lens table (`architectural`, `behavioural`, `enforcement`,
`code-quality`) to every consumer regardless of the planes they chose — it omits
`ops` and `design`, which this repo's own config declares. `getReviewPanelSkillTemplate()`
takes no arguments and, by its own comment, "ignores `specModel` for content," so
the generated skill is a build-time snapshot, not a projection of the consumer's
resolved review model. The panel a consumer runs cannot reflect the planes they
actually selected.

## What Changes

- **Project the lens set from the resolved review model, not a hardcoded copy.**
  The base lens set becomes one lens per resolved plane that declares a
  `reviewLens`, plus the cross-cutting `enforcement` lens, plus any declared
  scoped/augmentation lenses. `DEFAULT_LENSES` (the data) stops being a
  hand-typed constant and becomes a projection of the resolved planes; the pure
  routing helpers in `lenses.ts` (`scopeCovers`, most-specific-wins) stay.
- **Make the generated SKILL the operational artifact.** `getReviewPanelSkillTemplate`
  takes the resolved review model and projects the lens table/methods from it.
  The skill holds no hardcoded lens set and is regenerated on both `init` and
  `update`, so adding or dropping a plane re-projects the skill.
- **BREAKING (registration surface): the panel is no longer governed-only.** The
  review-panel skill registers for every specbase project. In a flat/legacy
  project it carries a single general spec-conformance reviewer over the flat
  specs; in a governed project it carries the projected per-plane lens set. The
  panel's one job — "review whether the implementation produces the specs that
  were implemented" — holds across that spectrum; planes only partition it into
  blind, focused lenses, and `enforcement` is the keystone once bindings exist.
- **Rebind the instrument's conformance check to the generated skill.** The
  `agents/review-panel` enforcement asserts the generated skill's lens set
  conforms to the projection of the resolved model, replacing the current binding
  against `lenses.ts`.

## Planes

### Behavioral truth
- `behavior.cli.review-panel-availability` (new leaf under the existing
  `behavior/cli` parent): `specbase init`/`update` makes the review-panel skill
  available in every project — flat and governed alike — and the generated skill
  names exactly the lenses the project's resolved review model implies. This is a
  user-visible surface change (flat consumers gain the panel; governed consumers
  see their real lens set). Inherits the hoisted CLI invariants from the parent.

### Architectural truth
- `architecture.review-panel-projection` (new): the review-panel skill is a
  projection of the resolved review model (flat spec set OR governed plane
  roster), holds no hardcoded lens set, and is regenerated on `init` and
  `update`. The lens vocabulary derives from the plane roster's `reviewLens`
  fields; a plane without a `reviewLens` contributes no lens. A distinct seam
  from `architecture.baseline-planting` (static template copy) — this one is a
  projection, so it earns its own pair.

### Agents
- `agents.review-panel` (modified): reshape the spec so it declares the
  projection rule — "one lens per resolved plane with a `reviewLens`, plus the
  cross-cutting `enforcement` lens, plus declared augmentation" — and describes
  the **generated skill** as its operational artifact (not `lenses.ts`). The
  panel's identity is spec-conformance review refined per plane.

## Spec pairs

- `behavior.cli.review-panel-availability` → paired enforcement via **test**
  (vitest): init/update in a flat fixture and a governed fixture, asserting the
  skill is registered in both and its lens table matches the resolved model.
- `architecture.review-panel-projection` → paired enforcement via **conformance
  test** (automated): the generated skill body contains no lens data absent from
  the resolved model's projection, and re-projection is idempotent across
  init/update.
- `agents.review-panel` → paired enforcement via **test** (skill-conformance):
  the generated skill's lens set equals the projection of the resolved review
  model — replacing the current `lenses.ts` target — plus a `review` binding
  (enforcement lens) for whether each lens's question is the right one.

## Impact

- **Affected code**: `src/core/templates/workflows/review-panel.ts`
  (`getReviewPanelSkillTemplate` gains a resolved-model parameter; the inline lens
  table becomes a projection); `src/core/governed/lenses.ts` (`DEFAULT_LENSES`
  becomes `lensesFromPlanes(...)`, routing helpers unchanged); `src/core/init.ts`
  (registration gate at ~`init.ts:756` widens from governed-only to every model;
  update path re-projects); the planted `agents/review-panel` baseline template.
- **Consumers**: flat/legacy projects gain the review-panel skill for the first
  time (additive); governed projects get a skill that finally names their real
  lenses (fixes the `ops`/`design` omission).
- **Stacking**: independent of the in-flight `add-ste-instrument` change, but a
  conscious sibling of its `architecture.baseline-planting` seam — the two should
  read as parallel "declaration → codebase artifact" invariants without coupling.
- **Design decision to pin (design.md)**: one adaptive skill body (same pipeline,
  projected lens set, gate/coverage steps no-op in flat) vs two projections. Lean
  one adaptive body to avoid re-drifting the refute/critic/report machinery.
