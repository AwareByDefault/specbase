## 1. Truth: project the lens set from the resolved review model

- [x] 1.1 Replace `DEFAULT_LENSES` in `src/core/governed/lenses.ts` with
  `lensesFromPlanes(resolvedModel)`: derive one lens per plane that declares a
  `reviewLens`, skip planes without one, always append the cross-cutting
  `enforcement` lens, and append declared augmentation lenses. Keep
  `scopeCovers`, `scopeDepth`, `resolveDefaultLens`, `resolveLensForBinding`
  unchanged; route them over the projected list.
- [x] 1.2 Add a snapshot test pinning the projection for this repo's current
  roster to the existing six lenses (proves the refactor is behavior-preserving
  for governed projects).
- [x] 1.3 Change `getReviewPanelSkillTemplate` in
  `src/core/templates/workflows/review-panel.ts` to accept the resolved review
  model and project the lens table/methods from it; delete the inline hardcoded
  lens table. Make the deterministic-gate and `coverage --json` steps conditional
  on the projection producing plane lenses (no-op in flat mode).
- [x] 1.4 Keep the command projection (`getReviewPanelCommandTemplate`) at body
  parity with the skill.
- [x] 1.5 Widen the registration gate in `src/core/init.ts` (~`init.ts:756`) so
  the review-panel skill is generated for every project, flat or governed; ensure
  the `update` path re-projects it idempotently.
- [x] 1.6 Update the planted `agents/review-panel` baseline template
  (`schemas/spec-driven-governed/templates/baseline/agents/review-panel/`) to the
  reshaped spec + enforcement.
- [x] 1.7 Regenerate this repo's own review-panel skill and confirm it now names
  all six lenses.

## 2. Evidence: implement paired enforcement so bindings go active

- [x] 2.1 Implement
  `test/core/templates/review-panel-projection.conformance.test.ts` — drive the
  generator over several resolved models (flat, minimal, full) and assert the
  emitted lens set equals the projection with no extra lens and that the
  generator consumes the model. Activate `skill-projection-conformance`
  (`architecture.review-panel-projection`) and `lens-conformance`
  (`agents.review-panel`).
- [x] 2.2 Implement `test/core/init/review-panel-regeneration.test.ts` — init/update
  over flat, governed, and roster-change fixtures; assert the skill is produced
  for each and a second run against an unchanged model is byte-identical.
  Activate `regeneration-conformance` (`architecture.review-panel-projection`).
- [x] 2.3 Implement `test/core/init/review-panel-availability.test.ts` — init/update
  over a flat fixture and a governed fixture declaring `ops`/`design`; assert the
  skill is present in each and its named lenses match the resolved model.
  Activate `availability-and-lens-content`
  (`behavior.cli.review-panel-availability`).
- [x] 2.4 Execute the `lens-questions-are-right` review binding
  (`agents.review-panel`, enforcement lens) once the projected skill exists; keep
  it as review-strength evidence. Executed against the regenerated skill: all six
  projected lens questions (architectural, behavioural, ops, code-quality,
  design, enforcement) name their plane's actual concern — invariants/boundaries,
  outcome production, declared ops usage, cleanliness, design identity, and
  binding-evidence adequacy — none vacuous or misaimed.
- [x] 2.5 Flip every binding above from `planned` to `active` in each
  `enforcement.md` once its target exists and passes.

## 3. Cleanup: retire the superseded lens-conformance target

- [x] 3.1 Remove the old `lenses.ts`-targeted vitest
  (`test/core/governed/lenses.test.ts` / `review-panel.conformance.test.ts`) only
  after confirming no surviving binding references it; the retargeted
  `lens-conformance` binding now points at the projection conformance test.
  **Resolution: NOT removed** — surviving bindings reference both files
  (`behavior.governed.review-panel / lens-scope-tests` targets
  `test/core/governed/lenses.test.ts`; `behavior.governed / plane-metadata-schema-tests`
  targets `test/core/governed/review-panel.conformance.test.ts`). They stay as
  shared targets and still pass; the `lens-conformance` binding was retargeted to
  the projection conformance test.
