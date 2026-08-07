## 1. Truth: wire the manifestos into the generated skills

- [x] 1.1 Add a delimited Rules section (distilled imperative SHALLs) to
      `docs/clean-spec.md`, distinct from the surrounding reasoning.
      Verified: new `## 7. Rules` section, `<!-- BEGIN RULES -->` /
      `<!-- END RULES -->`, no `docs/clean-*` path inside the block.
- [x] 1.2 Add a delimited Rules section to `docs/clean-specbase.md`.
      Verified: same marker pair; placement rules distilled from §1-§6.
- [x] 1.3 Write the extraction script that reads both marked sections and emits
      `src/core/templates/workflows/clean-rules.generated.ts` (exported const).
      Verified: `scripts/generate-clean-rules.mjs` emits `CLEAN_SPEC_RULES` and
      `CLEAN_SPECBASE_RULES`; importing it has no side effects.
- [x] 1.4 Wire the extraction into `build.js` to run before `tsc`; commit the
      generated module.
      Verified: `pnpm build` prints "Generating clean-rules module..." before
      "Compiling TypeScript...".
- [x] 1.5 Update `src/core/templates/workflows/governed-guidance.ts` to import
      the generated rules const and inject it, removing any inline rules text.
      Verified: `GOVERNED_MANIFESTO_RULES` composes the two imported constants
      and is appended by `buildGovernedPrimer`, so every governed skill carries
      them.
- [x] 1.6 Add the propose structure-surface step to the propose guidance: after
      placement, show chosen locators + applied clean-specbase rule, offer
      discussion; ensure clean-spec writing rules apply during authoring
      regardless of that offer.
      Verified: `### Surface the chosen structure before authoring (governed)`
      in `GOVERNED_AUTHORING_GUIDANCE`, closing with "Writing quality is never
      gated by that offer."
- [x] 1.7 Delete the stale hand-written plane primer in the propose skill path
      so it inherits the shared generated guidance.
      Verified: `GOVERNED_AUTHORING_GUIDANCE` is now a function of the resolved
      spec model using `buildGovernedPrimer`, so the propose skill reports this
      repo's real 6-plane roster instead of the static `[behavior, architecture]`
      copy.
- [x] 1.8 Rebuild and regenerate this repo's skills (`openspec update`); commit
      the regenerated `.pi/skills/**` outputs.
      Verified: `pnpm build` + `node bin/specbase.js update --force`; the four
      governed `.pi/skills/**/SKILL.md` and `.pi/prompts/spcb-*.md` carry the
      injected rules. (Committing is out of scope for this session.)

## 2. Evidence: implement paired enforcement so bindings go active

- [x] 2.1 Add `test/clean-rules-source.test.ts` — marked sections exist; the
      generator imports the generated module and restates no rules inline
      (binding `rules-single-source`).
      Verified: 4 tests pass. The restatement scan walks every `.ts` under
      `src/` except the generated module and fails on any verbatim rule
      sentence, so a hand-copied rule cannot reappear.
- [x] 2.2 Add `test/clean-rules-drift.test.ts` — re-run extraction, assert
      byte-equality with the committed module (binding `rules-drift-check`).
      Verified: 4 tests pass, including malformed-marker rejection and the
      stale-module case.
- [x] 2.3 Add `test/generated-skill-rules.test.ts` — generate a skill without
      `docs/` present; assert injected rules appear and no `docs/clean-*` path is
      referenced (binding `emitted-skill-carries-rules`).
      Verified: 27 tests pass. Generation writes into an `os.tmpdir()` directory
      that has no `docs/`; every governed skill carrying the primer contains both
      rule blocks and matches no `docs/clean-*.md` path.
- [x] 2.4 Add `test/propose-structure-surface.test.ts` — generated propose
      guidance contains the structure-surface step and injected writing rules
      (binding `propose-surface-present`).
      Verified: 10 tests pass across both the skill and command projections,
      including step ordering (surface before authoring, rules before surface).
- [x] 2.5 Perform the `propose-surface-quality` review against the generated
      propose guidance; record the outcome (binding `propose-surface-quality`).
      **Outcome: PASS (review strength, agents lens), one clarity fix applied.**
      Reviewed the emitted step in `.pi/skills/specbase-propose/SKILL.md` against
      `docs/clean-specbase.md`, above the deterministic gate that
      `propose-surface-present` already holds.
      - Genuine, not a rubber stamp: step 1 requires a NAMED placement rule per
        locator, and each rule it names (actor test, one truth one plane, hoist
        on duplication, quantify to place, earn parents, earn depth) resolves to
        real text in the injected clean-specbase rules directly above it.
      - Step 2 (state what you weighed and rejected) is what makes the offer
        answerable — a bare "here is where I put them" invites a reflexive yes;
        a stated rejected alternative invites correction.
      - Step 3 gives concrete verbs (move, split, merge, re-plane) rather than a
        vague "any thoughts?", and step 4 reserves blocking for real ambiguity,
        which is the design.md mitigation against training a reflex "no".
      - **Finding (minor, fixed):** step 3 originally read "proceed without
        waiting once they are satisfied", which could be read as requiring a
        pause on every routine placement — exactly the reflex-dismissal failure
        mode. Reworded to "The offer does NOT block: carry straight on into
        authoring, and revise the placement if they come back on it", and the
        clause is now asserted by `propose-surface-present`.
- [x] 2.6 Move bindings `rules-single-source`, `rules-drift-check`,
      `emitted-skill-carries-rules`, `propose-surface-present`,
      `propose-surface-quality` from `planned` to `active` once targets exist.
      Verified: all five are `active`; every declared target resolves on disk
      and each `run:` vector was executed in its declared form
      (`pnpm vitest run <target>`).

## 3. Cleanup

- [x] 3.1 Confirm no generator source retains a second copy of the rules text
      after 1.5 (covered by `rules-single-source`; remove any stragglers).
      Verified: the restatement scan in `test/clean-rules-source.test.ts` walks
      every `.ts` under `src/` (excluding the generated module) and found no
      verbatim rule sentence — no stragglers to remove. The generator reaches
      the rules only through `import ... from './clean-rules.generated.js'`.
