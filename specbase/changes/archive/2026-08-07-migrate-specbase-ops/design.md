## Context

Fourth tranche of the migration set up by `2026-08-07-migrate-specbase-specs`.
The target tree (design D3) reserves four ops locators; `planning-layout`
landed with the foundation. This change authors the remaining three. The
sources are two flat capabilities (`ci-nix-validation`, `ai-tool-paths`), the
`add-global-install-scope` and `feat-add-omp-tool-support` delta residue the
manifest routes to `ops/tool-paths`, and two clause-splits the manifest routes
to `ops/stack` from rows whose primary destination is `behavior/*`.

## Goals

- Give every ops fact exactly one home so the swap test holds: change the
  runtime, the CI system, or the telemetry vendor by editing ops only.
- Keep only claims that match the tree today. The legacy `ci-nix-validation`
  spec was written against an intended workflow; the shipped workflow differs.
- Bind every claim to a command that runs in this repo, right now, with no new
  test files invented.

## Non-Goals

- Not restating `ops/planning-layout`.
- Not authoring `behavior/telemetry`'s or `behavior/cli/feedback`'s own
  contracts — only the vendor facts they name abstractly.
- Not adding source, test, or workflow files. Every binding audits artifacts
  that already exist.

## Decisions

### O1. Ops enforcement is `command`, not `test`

Design D4 assigns ops the `command` mechanism: lockfile audit, plan validate,
drift detect. Every binding here is a `command` binding — one `nix flake check`
and nine `node -e` conformance one-liners. Each was executed against the
working tree and exits 0 before being written down.

### O2. Conformance direction: the spec describes the artifact

Following the agents-plane pattern the foundation established, each ops
requirement DESCRIBES an operational artifact that stays the runtime source of
truth — `flake.nix`, `.github/workflows/ci.yml`, `.actrc`,
`src/core/config.ts`'s `AI_TOOLS`, `package.json`. The binding asserts the
artifact still conforms; it never regenerates the artifact from the spec. A
drift between the two is a defect in whichever one moved without the other.

### O3. Text conformance over runtime import

The tool-path and stack bindings read source text rather than importing the
built module. `dist/` is a build product that need not exist when a binding
runs, and importing TypeScript directly needs a loader. Reading
`src/core/config.ts` and the adapters keeps the binding runnable from a clean
checkout with nothing but Node. The cost is stated in each binding's
`limitations`: the check proves the declaration, not the executed behavior.

### O4. `nix flake check --no-build --all-systems`

`nix` is installed in this environment and the command exits 0 in about a
second against a warm store. `--all-systems` evaluates all four declared
systems instead of only the host's, which is what the "multi-platform support"
claim is actually about. `--no-build` keeps it an evaluation check rather than
a full build — the full build is CI's job, and the binding says so in
`limitations`. The binding degrades to a failure when `nix` is absent; that is
honest, since the requirement is precisely that this repo ships a working
flake.

### O5. Restate rather than drop where reality moved

Where the legacy spec's intent survives but its literal claim does not (the
"required for merge" clause), the requirement is restated to what the workflow
actually guarantees and the correction is recorded in `proposal.md`. Where
nothing survives (the performance tuning claims), the manifest had already
demoted it. No claim is dropped by implication.

### O6. `ops/stack` names vendors on purpose

`docs/clean-specbase.md` §2 forbids vendor names in behavior specs and gives
telemetry as the worked example: `behavior/telemetry` says "the telemetry
backend", `ops/stack` says PostHog. This pair is the receiving end of that
rule, so it names Commander, PostHog, pnpm, and the GitHub CLI explicitly and
cross-references the behavior locators that depend on them by locator, not by
restating their contracts.

## Risks / Trade-offs

- **[Text-matching bindings are brittle to refactors]** — renaming a helper or
  reformatting `AI_TOOLS` can fail a binding that nothing substantive broke.
  → Each check matches on the smallest stable substring that carries the claim
  (a key name, a dependency name, a path segment), and the failure message
  names the artifact and the missing token so the fix is obvious.
- **[The registry parser assumes one entry per line]** — `AI_TOOLS` entries are
  currently single-line object literals. → The check asserts a minimum entry
  count first, so a reformat that defeats the parser fails loudly instead of
  passing vacuously.
- **[`nix` is not universally installed]** — the flake binding fails on a
  machine without Nix. → Acceptable and intentional: the other four `nix-ci`
  bindings are pure file conformance and still carry the workflow, script, and
  `act` claims without Nix present.
