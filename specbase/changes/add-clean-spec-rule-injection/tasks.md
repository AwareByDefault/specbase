## 1. Truth: wire the manifestos into the generated skills

- [ ] 1.1 Add a delimited Rules section (distilled imperative SHALLs) to
      `docs/clean-spec.md`, distinct from the surrounding reasoning.
- [ ] 1.2 Add a delimited Rules section to `docs/clean-specbase.md`.
- [ ] 1.3 Write the extraction script that reads both marked sections and emits
      `src/core/templates/workflows/clean-rules.generated.ts` (exported const).
- [ ] 1.4 Wire the extraction into `build.js` to run before `tsc`; commit the
      generated module.
- [ ] 1.5 Update `src/core/templates/workflows/governed-guidance.ts` to import
      the generated rules const and inject it, removing any inline rules text.
- [ ] 1.6 Add the propose structure-surface step to the propose guidance: after
      placement, show chosen locators + applied clean-specbase rule, offer
      discussion; ensure clean-spec writing rules apply during authoring
      regardless of that offer.
- [ ] 1.7 Delete the stale hand-written plane primer in the propose skill path
      so it inherits the shared generated guidance.
- [ ] 1.8 Rebuild and regenerate this repo's skills (`openspec update`); commit
      the regenerated `.pi/skills/**` outputs.

## 2. Evidence: implement paired enforcement so bindings go active

- [ ] 2.1 Add `test/clean-rules-source.test.ts` — marked sections exist; the
      generator imports the generated module and restates no rules inline
      (binding `rules-single-source`).
- [ ] 2.2 Add `test/clean-rules-drift.test.ts` — re-run extraction, assert
      byte-equality with the committed module (binding `rules-drift-check`).
- [ ] 2.3 Add `test/generated-skill-rules.test.ts` — generate a skill without
      `docs/` present; assert injected rules appear and no `docs/clean-*` path is
      referenced (binding `emitted-skill-carries-rules`).
- [ ] 2.4 Add `test/propose-structure-surface.test.ts` — generated propose
      guidance contains the structure-surface step and injected writing rules
      (binding `propose-surface-present`).
- [ ] 2.5 Perform the `propose-surface-quality` review against the generated
      propose guidance; record the outcome (binding `propose-surface-quality`).
- [ ] 2.6 Move bindings `rules-single-source`, `rules-drift-check`,
      `emitted-skill-carries-rules`, `propose-surface-present`,
      `propose-surface-quality` from `planned` to `active` once targets exist.

## 3. Cleanup

- [ ] 3.1 Confirm no generator source retains a second copy of the rules text
      after 1.5 (covered by `rules-single-source`; remove any stragglers).
