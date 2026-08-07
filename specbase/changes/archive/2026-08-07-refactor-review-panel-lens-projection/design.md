## Context

The review panel's lens set exists in four representations that have drifted:

1. `specbase/config.yaml` — `specModel.planes[].reviewLens` (the authoritative
   per-project declaration; carries a lens id per plane, none on `agents`).
2. `src/core/governed/lenses.ts` — `DEFAULT_LENSES`, a hand-maintained six-entry
   TS constant, consumed by coverage and routing.
3. `specbase/specs/agents/review-panel/spec.md` — states "one lens per plane +
   enforcement" abstractly and describes `lenses.ts` as its artifact.
4. `src/core/templates/workflows/review-panel.ts` — an inline Markdown table
   generating the skill body, currently listing four lenses and omitting `ops`
   and `design`.

`getReviewPanelSkillTemplate()` takes no arguments and its comment states it
"ignores `specModel` for content." The generated skill is therefore a build-time
snapshot shipped identically to every consumer, unable to reflect the planes a
consumer selected. The pure routing helpers in `lenses.ts` (`scopeCovers`,
`scopeDepth`, `resolveDefaultLens`, `resolveLensForBinding`, most-specific-wins)
are correct and stay; only the lens *data* is the problem.

## Goals / Non-Goals

**Goals:**

- Make the lens set a single projection of the resolved review model: one lens
  per plane that declares a `reviewLens`, plus cross-cutting `enforcement`, plus
  declared augmentation (scoped sub-lenses, extra cross-cutting lenses).
- Generate the review-panel skill from that projection, per consumer, with no
  hardcoded lens set; regenerate on `init` and `update`.
- Register the skill for every project, flat or governed, so the panel runs as a
  general spec-conformance reviewer at minimum and refines per plane above that.
- Rebind `agents/review-panel` conformance to the generated skill.

**Non-Goals:**

- Changing the routing/most-specific-wins resolution logic in `lenses.ts`.
- Adding or removing planes, or changing any plane's `reviewLens` value.
- Automating lens growth/split — lenses still grow by proposal; this change only
  moves where the lens set is *sourced from*, not how it evolves.
- Remediating existing review-panel findings or changing the panel's read-only,
  non-gating nature.

## Decisions

**D1 — Shape A: derive the base set from planes, plus declared augmentation.**
`DEFAULT_LENSES` (data) becomes `lensesFromPlanes(resolvedModel)`: it reads each
plane's `reviewLens`, skips planes without one (e.g. `agents`), always appends
the cross-cutting `enforcement` lens, and appends any declared augmentation
lenses. The plane roster is the single source for the base set; the helper
functions that route a binding to a lens are unchanged and now operate over the
projected list. *Rejected: an independent declared lens list (Shape B) — it
reintroduces a second list to keep aligned with the roster, the exact drift being
removed.*
- *Enforcement:* `architecture.review-panel-projection / skill-is-projection` and
  `generator-takes-model` bind a **conformance test** — the generator consumes
  the resolved model and emits no lens absent from the projection.

**D2 — One adaptive skill body, not two projections.** The pipeline (router →
deterministic gate → blind fan-out → dedup → refute-verify → completeness critic
→ read-only report) is model-agnostic. Only the *lens set* and *whether a
deterministic gate exists* differ by model. The skill body is generated once with
the projected lens set interpolated; in a flat project the lens set is the single
general spec-conformance reviewer and the enforcement-gate/`coverage --json`
steps degrade to no-ops (there are no `enforcement.md` bindings or lens rollup to
read). *Rejected: a lean flat skill plus a full governed skill — two bodies would
duplicate the refute/critic/report machinery and re-create the drift this change
removes.* The cost is that the adaptive body must state its gate/coverage steps
so they gracefully no-op when the model provides no bindings; that conditional
lives in the generated prose, keyed off whether the projection produced any
plane lens.
- *Enforcement:* `behavior.cli.review-panel-availability / skill-names-own-lenses`
  binds a **test** over a flat fixture and a governed fixture asserting the
  installed skill names exactly the projected lenses.

**D3 — Register for every model; widen the governed-only gate.** The registration
gate in `src/core/init.ts` (~`init.ts:756`, where `review-panel` is appended only
under the governed/agentic path) widens so the skill is written for every
project. `update` re-projects it. This is the one behavioral surface change flat
consumers see.
- *Enforcement:* `architecture.review-panel-projection / regenerated-every-model`
  binds a **conformance test** — init/update produce the skill for a flat and a
  governed fixture, and re-projection against an unchanged model is idempotent.

**D4 — Rebind the instrument's conformance to the generated skill.** The
`agents/review-panel` enforcement currently targets `test/core/governed/lenses.test.ts`
and a lens-conformance vitest over `lenses.ts`. It rebinds to assert the
**generated skill's** lens set equals the projection of the resolved model. The
judgment a test cannot make — whether each lens's *question* is the right one —
stays a `review` binding on the `enforcement` lens. *A test fits `lenses-conform`
because "the emitted skill equals the projection" is an observable equality; the
"right question" residue is genuinely non-deterministic and honestly review-only.*

**D5 — `enforcement` lens and scoped lenses are augmentation, not plane-derived.**
`enforcement` has scope `''` and belongs to no plane, so the projection always
appends it rather than deriving it. Scoped sub-lenses (e.g.
`architecture/rings/boundaries`) are deeper than any plane and are declared
augmentation the projection also appends. This keeps the "base = planes" rule
clean while preserving the two lens kinds that a 1:1 plane mapping cannot express.

## Risks / Trade-offs

- **[Adaptive body's flat-mode no-ops read as dead prose in governed mode, or
  vice versa]** → The generated body includes a step only when the projection
  warrants it (a gate step only when at least one plane lens with bindings
  exists); the generator, not runtime prose, decides which steps appear. The
  conformance test asserts a flat skill omits the gate/coverage steps.
- **[Flat consumers gaining a new skill is a surprise/BREAKING registration
  change]** → It is additive (a new read-only, non-gating skill) and documented
  in the proposal; no existing flat behavior is removed.
- **[`lensesFromPlanes` diverges from what coverage previously reported]** → For
  this repo's roster the projection reproduces the existing six lenses exactly;
  a snapshot test pins the projected set against the current `DEFAULT_LENSES`
  values so the refactor is provably behavior-preserving for governed projects.
- **[Coupling with the STE change's `baseline-planting` seam]** → Kept distinct:
  baseline-planting copies static template pairs; this projects a generated skill.
  Neither spec references the other's mechanism; they are parallel invariants.

## Migration Plan

1. Replace `DEFAULT_LENSES` with `lensesFromPlanes(resolvedModel)` in
   `lenses.ts`; keep routing helpers; add a snapshot test pinning the projection
   for the current roster (proves governed behavior preservation).
2. Change `getReviewPanelSkillTemplate` to accept the resolved model and project
   the lens table/methods; make the gate/coverage steps conditional on the
   projection.
3. Widen the registration gate in `init.ts` so the skill is written for every
   model; ensure `update` re-projects idempotently.
4. Update the planted `agents/review-panel` baseline template to the reshaped
   spec; rebind its `enforcement.md` conformance to the generated skill.
5. Regenerate this repo's own review-panel skill and confirm it now names all six
   lenses.

Rollback: revert the generator signature, restore the `DEFAULT_LENSES` constant,
and narrow the registration gate; the skill regenerates to its prior form. No
consumer data migration is involved. This transitional rationale lives here and
in the dated archive, not in the permanent specs.
