## Why

The specbase migration (`migrate-specbase-specs`, archived) classified all 451
legacy requirements and routed each to a destination locator. Two destinations
belong to no other tranche: `code-quality/spec-authoring` — the craft rules the
old `openspec-conventions` capability carried alongside its format rules — and
`design-system/cli-voice` — the copy and presentation clauses scattered through
`cli-init`, `cli-update`, `cli-validate`, `cli-view`, `cli-completion`, and
`cli-archive`.

Both are judgment truth. The craft rules tell an author how much ceremony a
change earns and where the boundary between contract and mechanism sits; the
voice rules tell the CLI how to sound. Neither survives inside a behavior spec:
the format rules already left for `behavior/store/format`, and the command
contracts already left for `behavior/cli/*`. Left unmigrated they would be the
only legacy truth with no home.

## What Changes

- **Add `code-quality/spec-authoring`** — four craft requirements: ceremony
  scales to risk, requirements state verifiable contracts rather than mechanism,
  the smallest still-testable spec is the default, and specs state current truth
  while history stays in the archive. Sources: `openspec-conventions`
  "Progressive Rigor" and "Behavior-First Specification Boundary" (with the
  `introduce-enforced-spec-planes` MODIFIED revision), `spec-planes` "Current
  architecture and historical rationale", and the craft halves of
  `docs-agent-instructions`' authoring-guidance rows. The organizing rules in
  `docs/clean-specbase.md` supply the one-truth-one-plane scenario and the
  restatement check the review binding runs.

- **Add `design-system/cli-voice`** — five expression requirements: terse calm
  copy, non-blaming errors, stderr/stdout routing, one status symbol and color
  vocabulary, and an actionable close on every terminal outcome. Sources:
  `cli-init` "Success Output" and "Success Output Enhancements", `cli-view`
  "Visual Formatting", plus the voice clauses split out of `cli-update` "Core
  Files Always Updated" (ASCII-safe success message), `cli-validate`'s Next-steps
  footer wording, `cli-artifact-workflow` "Output Formatting" (color meaning),
  `cli-completion`'s error and success copy, and `cli-archive`'s delta symbols.

- **Enforcement is split honestly.** `cli-voice`'s deterministic sub-rules bind
  four existing vitest suites that genuinely assert them (stream routing, three
  error wordings, `✓`/`○` and `+ ~ - →` symbols, the `Next steps:` footer); its
  judgments bind the `design` lens. `spec-authoring` binds the store validator
  as the one real deterministic floor (`openspec validate --specs --strict`
  rejects a requirement with no normative keyword or no scenario) and the
  `code-quality` lens for everything above it.

## Impact

- Affected specs: `code-quality/spec-authoring` (new pair),
  `design-system/cli-voice` (new pair).
- No source, test, or documentation changes. Every binding targets a check that
  already exists.
- Two planes declared in `specbase/config.yaml` (`code-quality`, `design-system`)
  gain their first governed pair, so the `code-quality` and `design` review
  lenses gain a subtree to own.

## Non-Goals

- **No new eslint rule.** `eslint.config.js` scopes to `src/**/*.ts` and carries
  one project rule (`no-restricted-imports` for `@inquirer/*`); nothing there
  governs spec prose or CLI copy, so no lint conformance is bound.
- **No new tests.** Where no suite asserts a claim — `init`'s success output,
  colour meaning, every tone judgment — the pair says so in `limitations` and
  binds a review instead.
- **No design tokens.** The design-system plane's token stratum has no artifact
  in a CLI; only the voice stratum is authored.
