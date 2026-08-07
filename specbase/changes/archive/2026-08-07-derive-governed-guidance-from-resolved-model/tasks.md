# Tasks: derive-governed-guidance-from-resolved-model

## 1. Truth: make every governed guidance surface project the resolved model

- [x] 1.1 Convert `GOVERNED_APPLY_GUIDANCE`, `GOVERNED_UPDATE_GUIDANCE`,
      `GOVERNED_SYNC_GUIDANCE`, `GOVERNED_VERIFY_GUIDANCE`, and
      `GOVERNED_ARCHIVE_GUIDANCE` in
      `src/core/templates/workflows/governed-guidance.ts` from static strings
      to `(specModel: SpecModel) => string` functions calling
      `buildGovernedPrimer(specModel)`, matching the existing
      `GOVERNED_EXPLORE_GUIDANCE` pattern. Update
      `GOVERNED_BULK_ARCHIVE_GUIDANCE` to compose the archive function.
- [x] 1.2 Rewrite `GOVERNED_ONBOARD_GUIDANCE` as a function of the resolved
      model: keep the lesson skeleton, enumerate the declared planes (id +
      purpose) in the truth-planes section, and remove every fixed plane count
      from the prose.
- [x] 1.3 Delete the `GOVERNED_PRIMER` back-compat alias. Update any test that
      asserted the two-plane primer to call `buildGovernedPrimer` with an
      explicit two-plane model instead.
- [x] 1.4 Verify all call sites (`apply-change.ts`, `update-change.ts`,
      `sync-specs.ts`, `verify-change.ts`, `archive-change.ts`,
      `bulk-archive-change.ts`, `onboard.ts`) pass the guidance through
      `withGovernedGuidance` with the resolved model; adjust any that
      interpolate a constant directly.
- [x] 1.5 Add curated `design-system` triggers to `DEFAULT_PLANE_TRIGGERS`
      (token truths describe the token artifact; principle/voice truths bind
      the design review lens) and correct the "four default planes" docstring.
- [x] 1.6 In `src/core/templates/workflows/review-panel.ts`, derive the
      per-lens scope phrase from the lens definition
      (`crossCutting`/empty scope → "the whole tree", otherwise
      `` `<scope>/**` ``), removing both `lens.id === 'code-quality'`
      special cases.
- [x] 1.7 Update the `proposal` instruction in
      `schemas/spec-driven-governed/schema.yaml` to enumerate all six shipped
      default planes.
- [x] 1.8 Delete the dead `DEFAULT_SPEC_PLANES` constant from
      `src/core/artifact-graph/types.ts`; confirm the build compiles.

## 2. Evidence: activate the declared bindings

- [x] 2.1 Write `test/governed-guidance-projection.test.ts` roster-parity
      cases: build a synthetic model with more planes than the shipped
      defaults, generate every governed workflow's skill and command content
      by iterating the shared workflow source (no hand-written list), and
      assert each surface's `planes: [...]` roster matches the model; assert
      the onboarding lesson enumerates the model's planes and states no fixed
      count (binding `guidance-roster-parity`).
- [x] 2.2 Add the static check to the same file: the guidance module exports
      no plane-aware guidance as a plain string and contains no hardcoded
      roster literal (binding `no-frozen-roster-static`).
- [x] 2.3 Add the triggers-completeness cases: `DEFAULT_PLANE_TRIGGERS` keys
      equal the default-shipped plane ids, and a synthetic user-added plane
      resolves to the purpose-derived block (binding
      `triggers-cover-defaults`).
- [x] 2.4 Run the full test suite; fix any snapshot or assertion that pinned
      the frozen two-plane output.
- [x] 2.5 Flip all three bindings in
      `specs/architecture/governed-guidance-projection/enforcement.md` from
      `planned` to `active`.

## 3. Regenerate installed instruments

- [x] 3.1 Regenerate this repo's `.claude/` skills and commands through the
      CLI's update path; verify `/spcb:apply` and `/spcb:archive` surfaces
      list all six planes and the review-panel skill's code-quality scope
      phrase matches the lens definition.
