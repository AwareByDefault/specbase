## 1. Truth: the STE rule engine and `ste-lint` command (behavior.cli.ste-lint)

- [x] 1.1 Port the reference linter to a TypeScript rule engine (e.g. `src/core/ste/lint.ts`): sentence/word segmentation, code-span stripping, and the category counters (marketing adjectives, banned words, phrasal verbs, passive voice, `ing`-main-verb, nominalizations, long sentences, semicolons, contractions, modal hedges, long paragraphs, em-dash slop) plus the `total` and `total_per100w` metric. Match the reference's word/sentence rules.
- [x] 1.2 Model per-category severity: `banned_word` and `marketing_adjective` are errors by default; stylistic categories are warnings. Expose severity in the engine's result shape.
- [x] 1.3 Add `src/commands/ste-lint.ts` implementing the command: positional file/glob args, stdin fallback when no path, per-document + aggregate reporting, `--json` (single clean document, no decoration), and `--max <n>` that gates the exit code (non-zero above the threshold, zero without `--max`). Model it on the `coverage --strict` gate-on-a-flag pattern.
- [x] 1.4 Register the command in `src/cli/index.ts` (verb-first `ste-lint`, following the `register*Command` convention).
- [x] 1.5 Register `ste-lint` and its options in the completion registry (`src/core/completions/command-registry.ts`) so the parent `behavior.cli` completion-registration invariant still holds.

## 2. Truth: STE adoption and the writing skill (ops.ste, agents.ste-writing)

- [x] 2.1 Add the `ops/ste` baseline template pair under `schemas/spec-driven-governed/templates/baseline/ops/ste/` (`spec.md` + `enforcement.md`), carrying the planted-opt-in comment header like the existing agents baselines.
- [x] 2.2 Add the `agents/ste-writing` baseline template pair under `schemas/spec-driven-governed/templates/baseline/agents/ste-writing/` (`spec.md` + `enforcement.md`).
- [x] 2.3 Author and register the STE writing SKILL.md instrument: frontmatter declaring the STE mandate and trigger, body directing short active sentences and forbidding marketing adjectives / banned words. Wire it into the skill template set so it is emitted as invocable.

## 3. Truth: generalize the init baseline planter (architecture.baseline-planting)

- [x] 3.1 Refactor `plantAgentsBaseline` in `src/core/init.ts` into a plane-parametric planter that takes a declared set of `{plane, locator}` pairs and copies each from `templates/baseline/<plane>/<locator>` to `specs/<plane>/<locator>`, preserving the existing idempotent "never overwrite" guarantee. Keep the current agents-baseline call site working through the general routine.
- [x] 3.2 Add the opt-in STE init prompt that, when accepted, plants the STE bundle (`agents/ste-writing` + `ops/ste`); when declined, plants none of it. Gate it the same shape as the agentic-review selection.

## 4. Evidence: paired enforcement so bindings go active

- [x] 4.1 Commit the golden fixture: run `reference/ste-lint.py` over a shared corpus and save its JSON as `test/fixtures/ste-lint/golden.json`; add `test/commands/ste-lint.golden.test.ts` asserting the TS engine matches it (satisfies binding `ste-lint-golden-corpus`).
- [x] 4.2 Add `test/commands/ste-lint.test.ts` and `test/cli-e2e/ste-lint.test.ts` covering input modes, clean `--json` aggregate, `--max` gating (over/within/no-threshold), and severity classification (bindings `ste-lint-input-modes-tests`, `ste-lint-json-and-gate-tests`).
- [x] 4.3 Add `test/core/init.baseline-planting.test.ts` and extend `test/commands/init.test.ts`: multi-plane planting, idempotent no-overwrite, opt-in plants both STE pairs, declined plants nothing, and the existing agents baseline still plants unchanged (bindings `planter-conformance`, `baseline-opt-in-integration`).
- [x] 4.4 Add `test/core/skills/ste-writing.conformance.test.ts` asserting the STE skill is registered and its frontmatter declares the mandate and trigger (binding `ste-writing-skill-conformance`).
- [x] 4.5 Wire `ops.ste`'s `ste-doc-gate` command against the real doc glob; pick the initial `--max` threshold and glob from the actual backlog count and record them in `specs/ops/ste/enforcement.md` and the `ops.ste` requirement text.
- [x] 4.6 Move each mandatory binding from `status: planned` to `status: active` once its target exists and passes: `ste-lint-golden-corpus`, `ste-lint-input-modes-tests`, `ste-lint-json-and-gate-tests`, `ste-doc-gate`, `planter-conformance`, `baseline-opt-in-integration`, `ste-writing-skill-conformance`. Confirm with `specbase coverage`.

## 5. Verify

- [x] 5.1 Run `specbase validate --change add-ste-instrument --strict` and the full test suite; confirm every mandatory binding resolves and no `planned`/stale/broken binding remains before marking the change complete.
