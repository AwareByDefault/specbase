# Tasks: migrate-specbase-quality-design

Quality/design tranche of the specbase migration (design D3 / migration plan
step 6). Authors the two pairs no other tranche claims:
`code-quality/spec-authoring` and `design-system/cli-voice`.

## 1. Source the destined rows

- [x] 1.1 Read the manifest rows destined for `code-quality/spec-authoring`
      (4 rows: flat `openspec-conventions` #2 Behavior-First Specification
      Boundary, #3 Progressive Rigor; delta `introduce-enforced-spec-planes` #21
      [M] Behavior-First Specification Boundary, #51 `spec-planes` [A] Current
      architecture and historical rationale) plus the craft halves of the
      `docs-agent-instructions` #5/#6 splits.
- [x] 1.2 Read the manifest rows destined for `design-system/cli-voice`
      (3 rows: `cli-init` #6 Success Output, #9 Success Output Enhancements,
      `cli-view` #6 Visual Formatting) plus the clauses split into cli-voice
      from `cli-update` #5, `cli-validate` #4, `cli-artifact-workflow` #7, and
      the copy in `cli-completion` / `cli-archive`.
- [x] 1.3 Read `docs/clean-specbase.md` for the organizing rules the craft pair
      states (one truth one plane, restatement check).

## 2. Author `code-quality/spec-authoring`

- [x] 2.1 Write the delta `spec.md` — 4 requirements, 13 scenarios:
      `progressive-rigor`, `behavior-first-boundary`, `lightweight-by-default`,
      `current-truth-only`.
- [x] 2.2 Check `eslint.config.js` for a rule that could bind conformance.
      *Result: none. The config scopes to `src/**/*.ts` and carries one project
      rule (`no-restricted-imports` for `@inquirer/*`). No lint binding is
      authored; the enforcement prose records why.*
- [x] 2.3 Write `enforcement.md` — one `command` binding on the store validator
      (the real deterministic floor: strict mode rejects a requirement with no
      normative keyword or no scenario) and three `review` bindings on the
      `code-quality` lens with concrete, runnable procedures.
- [x] 2.4 Verify the bound command runs green:
      `openspec validate --specs --strict --no-interactive` → exit 0, 4 specs
      valid.

## 3. Author `design-system/cli-voice`

- [x] 3.1 Search `test/` for suites that genuinely assert voice sub-rules before
      binding anything.
      *Found: `test/cli-e2e/basic.test.ts` (errors on stderr with non-zero exit;
      `--json` ⇒ empty stderr + parseable stdout; `Invalid tool(s):` +
      `Available values:`), `test/commands/validate.enriched-output.test.ts`
      (`has issues`, `Next steps:`, suggested command — all on stderr),
      `test/commands/completion.test.ts` (exact unsupported-shell and
      undetected-shell wording), `test/core/view.test.ts` (`✓` completed / `○`
      draft), `test/core/archive.test.ts` (`Totals: + 1, ~ 1, - 0, → 1`),
      `test/core/update.test.ts` (`Updated: <tool>` + `(vX.Y.Z)`).*
      *Not found: any assertion on `init`'s success output, and any assertion on
      colour meaning (`view.test.ts` strips ANSI). Both bind review only.*
- [x] 3.2 Write the delta `spec.md` — 5 requirements, 19 scenarios:
      `terse-calm-copy`, `non-blaming-errors`, `stream-routing`,
      `status-vocabulary`, `actionable-next-steps`. The `--no-color` mechanism is
      left to `behavior/cli`; only symbol/colour meaning is claimed here.
- [x] 3.3 Write `enforcement.md` — four `test` bindings over the suites found in
      3.1 and two `design`-lens `review` bindings for the judgments, each with
      honest `limitations` and `covered_by` naming its deterministic residue.
- [x] 3.4 Run every bound suite and confirm green.
      *`pnpm test -- test/commands/completion.test.ts test/cli-e2e/basic.test.ts`
      → 36/36 passed. `pnpm test -- test/commands/validate.enriched-output.test.ts
      test/core/view.test.ts test/core/archive.test.ts test/core/update.test.ts`
      → 91/91 passed.*

## 4. Validate and cross-check

- [x] 4.1 `openspec validate --change migrate-specbase-quality-design --strict`
      passes.
- [x] 4.2 Cross-check the manifest: every row destined for
      `code-quality/spec-authoring` and `design-system/cli-voice`, plus every
      clause the manifest splits into those locators, is represented by a
      requirement or scenario in this change. *All 7 destined rows and all 5
      split clauses are covered; nothing is flagged as unrepresented.*
