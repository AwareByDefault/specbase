# Tasks: migrate-specbase-specs

Foundation tranche of the specbase migration. This change repairs the planted
agents pairs, adds `ops/planning-layout` and the worked-example
`behavior/telemetry` pair, seeds store context, and prepares the follow-on
tranches (which are separate changes, each archiving its own spec pairs).

## 1. Truth: repair and author foundation spec pairs

- [x] 1.1 Repair `agents/spec-driven` delta (spec.md) — point requirement and
      scenario prose at `specbase/config.yaml` instead of `openspec/config.yaml`
      (done in this change's delta).
      *Verified: the MODIFIED requirement body and the `governed-schema-declared`
      scenario both reference `specbase/config.yaml`. Note: the planted HTML
      comment in the baseline `specbase/specs/agents/spec-driven/spec.md` still
      says `openspec/config.yaml`; it is non-normative and survives archive
      (see task 3.1).*
- [x] 1.2 Repair `agents/review-panel` delta (spec.md) — keep the lens-per-plane
      and lenses-conform requirements; correct any store-path references.
      *Verified: both requirements/scenarios kept verbatim; the spec.md body
      contains no store-path references, so the repair is entirely in
      enforcement.md (the `panel-review` binding that targeted
      `openspec/config.yaml` is removed — task 2.2).*
- [x] 1.3 Author `ops/planning-layout` spec.md — `specbase/` is the planning
      root; `openspec-old/` is retired history (done in this change's delta).
      *Verified: two ADDED requirements (`specbase-is-planning-root`,
      `openspec-old-inert`) with four scenarios.*
- [x] 1.4 Author `behavior/telemetry` spec.md — the distilled telemetry contract
      as the worked-example pair every later tranche copies (done in this
      change's delta).
      *Verified: 9 ADDED requirements / 21 scenarios, matching the 9 requirements
      of the legacy `telemetry` capability one-for-one (mapping.md Part A).*
- [x] 1.5 Add `openspec-old/README.md` marking the legacy store as retired
      historical archive (needed by the legacy-store-retired review binding).
- [x] 1.8 Author the migration manifest `mapping.md` in this change (per
      design D7): one row per old requirement across the 35 flat specs and
      the unarchived change deltas — source, header, verdict
      (keep/promote/demote/drop), destination locator per the D3 tree.
      Record the D8 drops (opsx skills → superseded by spcb,
      change-stacking-workflow, developer-qa-workflow) with reasons, and
      resolve the `oh-my-pi-tool` verdict by checking the tool registry in
      `src/`.
      *Done: `mapping.md` holds 451 rows — 246 (flat, 36 files) + 205
      (unarchived deltas, 77 files); keep 367 / promote 16 / demote 10 /
      drop 58. `oh-my-pi-tool` resolved **keep**: omp support shipped
      (`src/core/config.ts:45` AI_TOOLS entry, `adapters/oh-my-pi.ts`,
      `registry.ts:65`).*
- [x] 1.6 Seed `specbase/config.yaml` `context:` with the product-language and
      cross-platform rules from `openspec-old/config.yaml` (verbatim migration).
- [x] 1.7 Verify the merged current pairs by simulating archive:
      run `openspec status --change migrate-specbase-specs --json` and confirm
      the delta files parse; then run `openspec validate --strict` to confirm
      the store is well-formed with the repaired targets.
      *Done. `openspec status --change migrate-specbase-specs --json` resolves
      all four spec/enforcement pairs and reports `isComplete: true`;
      `openspec validate --changes --strict` → `✓ change/migrate-specbase-specs`.
      `openspec validate --strict` against the **live** store still reports the
      two planted agents pairs as broken — expected, because the repairs only
      land at archive. Simulated archive in a scratch mirror (deltas applied by
      hand, repo otherwise symlinked): `openspec validate --strict` → all four
      specs pass, exit 0. Note: the repo-local `node bin/openspec.js` cannot be
      used — this branch's `src/` still hardcodes `openspec` as the planning dir
      name; the installed `@awarebydefault/specbase` 1.6.0 CLI (which prefers
      `specbase/`) is the one that resolves this store.*

## 2. Evidence: paired enforcement goes active

- [x] 2.1 Update `agents/spec-driven` enforcement.md — upsert the
      `openspec-validates` and `governed-schema-declared` bindings with
      `specbase/config.yaml` targets (done in this change's delta).
      *Verified: both bindings target `specbase/config.yaml`; no
      `openspec/config.yaml` remains in the delta.*
      *Discrepancy found and fixed: the `governed-schema-declared` binding
      inherited `run: openspec config --json` from the planted baseline. That
      invocation exits 1 (`error: unknown option '--json'`) and `openspec config`
      reads the **global** config, not this project's store — a hollow binding by
      the change's own enforcement philosophy. Replaced with a node
      conformance one-liner asserting `specbase/config.yaml` declares
      `schema: spec-driven-governed` and a non-empty `specModel` plane roster
      (exits 0, verified).*
- [x] 2.2 Update `agents/review-panel` enforcement.md — retire the
      `panel-review` binding, add the `lens-conformance` test binding targeting
      `test/core/governed/lenses.test.ts` +
      `test/core/governed/review-panel.conformance.test.ts` (done in this
      change's delta). Run both suites to confirm green.
      *Verified: `remove: [panel-review]` plus the automated `lens-conformance`
      test binding. Suites green —
      `pnpm test -- test/core/governed/lenses.test.ts
      test/core/governed/review-panel.conformance.test.ts` → 2 files, 14 tests
      passed.*
- [x] 2.3 Author `ops/planning-layout` enforcement.md — layout-conformance
      command binding, cli-discovery-inertness command binding, and the
      legacy-store-retired review binding (done in this change's delta). Run
      the node conformance one-liner to confirm it passes.
      *Verified: all three bindings present. The `layout-conformance` node
      one-liner exits 0 (specbase/config.yaml + specbase/specs exist, no root
      `openspec/`). The `cli-discovery-inertness` binding runs
      `openspec coverage --json --strict`, which passes only after archive
      (it fails today on the two still-broken planted pairs) — confirmed
      passing in the archive simulation.*
- [x] 2.4 Author `behavior/telemetry` enforcement.md — bind requirements to
      `test/telemetry/index.test.ts` and `test/telemetry/config.test.ts`, with
      the behavioural-lens review binding `e2e-event-emission` as residue above
      the gate (done in this change's delta). Run the two suites to confirm green.
      *Verified: five automated test bindings + the `e2e-event-emission` review
      binding with `covered_by: [tracking-and-privacy-tests]`. Suites green —
      `pnpm test -- test/telemetry/index.test.ts test/telemetry/config.test.ts`
      → 2 files, 32 tests passed.*
- [x] 2.5 Run `openspec coverage --json` and confirm: agents/spec-driven and
      agents/review-panel leave the `broken` state; the new pairs report their
      real state (hanging/degraded only where evidence is honestly review-strength).
      *Actual states recorded. **Live store (pre-archive):** 2 specs, both
      `broken` (2 hanging requirements, 4 uncovered scenarios, 0 bindings of any
      strength) — the deltas have not been applied yet, so this is the expected
      pre-archive reading, not a regression. **Post-archive (simulated):** 4
      specs, states `complete: 4`, `broken: 0`, `hanging: 0`, `degraded: 0`,
      `stale: 0`, `incomplete-pair: 0`; 13/13 requirements and 29/29 scenarios
      covered; binding strengths automated 10 / review 2 / manual 0. Per plane:
      agents 2 complete (3 automated), behavior 1 complete (5 automated +
      1 review), ops 1 complete (2 automated + 1 review). The two review-strength
      bindings are `ops.planning-layout@legacy-store-retired` and
      `behavior.telemetry@e2e-event-emission` — both honest residue above
      automated gates.*

## 3. Cleanup and follow-on tranches

- [x] 3.1 Confirm no surviving binding targets the old `openspec/config.yaml`
      path; the planted HTML comments in the agents specs still mention
      `openspec/` — optionally clean them in a later change (non-normative).
      *Confirmed. `grep -rn "openspec/config.yaml|openspec/specs|openspec/changes"`
      over the post-archive store returns exactly one hit: the non-normative
      planted HTML comment at
      `specbase/specs/agents/spec-driven/spec.md:9`. Zero binding `targets:`,
      `inputs:` or requirement bodies reference the legacy path. (In the
      pre-archive store the baseline enforcement files still carry the old
      targets — that is what this change's deltas replace.)*
- [ ] 3.2 Create follow-on change `migrate-specbase-behavior` — author and
      archive the `behavior/*` pairs per the D3 tree: the `cli` parent pair
      plus thin leaves, then the `store`, `governed`, `schemas`, `workflow`,
      and `config` domains — using the telemetry pair as the pattern, binding
      against existing `test/core/*` suites (registry-iteration conformance
      for parent-pair invariants).
- [ ] 3.3 Create follow-on change `migrate-specbase-architecture` — the
      `architecture/command-generation`, `architecture/completion`,
      `architecture/artifact-graph` pairs.
- [ ] 3.4 Create follow-on change `migrate-specbase-ops` — the
      `ops/nix-ci`, `ops/tool-paths`, `ops/stack` pairs with command bindings
      against `flake.nix`, `.github/workflows/`, `package.json`.
- [ ] 3.5 Create follow-on change `migrate-specbase-agents` — the
      `agents/agent-docs` pair; seed the root `AGENTS.md` (currently 0 bytes)
      from `openspec-old/work/AGENTS.md` + the docs-agent-instructions
      content. (No opsx-skills pair — dropped per design D8; spcb is the
      current skill surface.)
- [ ] 3.6 Create follow-on change `migrate-specbase-quality-design` — the
      `code-quality/spec-authoring` and `design-system/cli-voice` pairs.
- [ ] 3.7 Final retire check: `openspec coverage --json` shows the full
      surface; record in the dated archive that `openspec-old/` is frozen
      history; note the repo-code dirname migration (specbase-dir-migration
      branch, `src/core/planning-dir.ts`) as a separate tracked item.
- [ ] 3.8 Create follow-on change `specbase-dir-rebrand` — the mechanical
      deep rebrand captured in this change's proposal: swap `openspec`→
      `specbase`/`OpenSpec`→`Specbase`/`OPENSPEC`→`SPECBASE` across `src/`,
      `test/`, `docs/`, `website/`, `.github/`, `.pi/`, `.agents/`; rename
      `bin/openspec.js` → `bin/specbase.js` + `"bin":"specbase"`;
      `@fission-ai/openspec` → `@awarebydefault/specbase`;
      `openspec-conventions` → `specbase-conventions`; the `/opsx:` command
      family → `/spcb:` (and `opsx` → `spcb` in skills/prompts);
      `release-openspec` → `release-specbase`. KEEP verbatim the
      attribution: `LICENSE` upstream copyright, `NOTICE.md` in full, and
      `README.md`'s "built on OpenSpec" credit note. Reconcile in-flight
      git state (staged `D` openspec store files vs untracked `specbase/`,
      `.serena/`+`test-project/` deletions, `test-project-2/`) so the rename
      commits separately; then commit and push to `origin/rebrand-specbase`.
