# Tasks: migrate-specbase-behavior

Behavior tranche of the specbase migration (design D3 / Migration Plan step 2).
Authors the 29 remaining `behavior/*` pairs and their enforcement, covering the
312 behavior-destined manifest rows that are neither `behavior/telemetry`
(landed in the foundation tranche) nor re-verdicted to `drop` at the archive
gate (task 8.2).

Every pair is a `spec.md` + `enforcement.md` written in the `behavior/telemetry`
house style: frontmatter `id`, `**ID:**` slugs on every requirement and
scenario, and a `version: 1` enforcement block binding real `test/` suites, with
honest `review` bindings where no suite exercises the claim.

## 1. The `cli` domain — parent pair and its leaves

- [x] 1.1 Author `behavior/cli` (parent pair). Hoist the universally quantified
      cross-command invariants: verb-first structure, deprecated noun-form
      back-compat, `--json`, interactive selection, non-interactive fallback,
      exit codes, actionable errors, delta display symbols, completion
      registration, output framing.
      *33 manifest rows → 10 requirements, 21 scenarios, 12 bindings.
      The headline binding is the registry-iteration conformance suite
      `test/core/completions/command-registry.test.ts`, per the quantification
      rule (Clean Specbase §4).*
- [x] 1.2 Author `behavior/cli/init` — first-run scaffolding, tool selection and
      generation, plane picker, baseline planting, extend mode.
      *32 rows (40 assigned, 8 re-verdicted `drop` at the archive gate).*
- [x] 1.3 Author `behavior/cli/update` — refresh of an existing project,
      delivery enforcement, profile sync, migrations.
      *16 rows (22 assigned, 6 re-verdicted `drop` at the archive gate).*
- [x] 1.4 Author `behavior/cli/validate` — remediation, locations, item type
      detection, governed spec/change validation. *14 rows.*
- [x] 1.5 Author `behavior/cli/archive` — task gate, delta application order,
      confirmation, validation gate, governed readiness. Absorbs the
      `openspec-conventions` archive-apply semantics (D3). *12 rows.*
- [x] 1.6 Author `behavior/cli/list` — listing, task counting, sorting, empty
      state, governed listing. *8 rows.*
- [x] 1.7 Author `behavior/cli/show` — item type auto-detection, ambiguity,
      explicit type override, governed pair display. Absorbs the `cli-change` /
      `cli-spec` interactive-show residue. *3 rows.*
- [x] 1.8 Author `behavior/cli/view` — dashboard, summary, active/completed/draft
      changes, spec display, task progress resolution. *7 rows.*
- [x] 1.9 Author `behavior/cli/config` — command surface only: `get`, `set`,
      `unset`, `list`, `edit`, `reset`, path, key naming (D3). *10 rows.*
- [x] 1.10 Author `behavior/cli/feedback` — issue filing, metadata, fallback when
      the external filing tool is unavailable, agent skill. *5 rows.*
- [x] 1.11 Author `behavior/cli/completion` — generate/install/uninstall, shell
      detection, dynamic completions, script output. *8 rows.*
- [x] 1.12 Author `behavior/cli/legacy-cleanup` — detection, confirmation,
      surgical config edits, directory removal, reporting. *7 rows.*
- [x] 1.13 Confirm `cli-change` and `cli-spec` dissolve cleanly: their noun-form
      back-compat sits on the parent, their interactive-selection residue in
      `show` and `validate`, and no leaf restates a parent invariant.

## 2. The `store` domain

- [x] 2.1 Author `behavior/store/layout` — planning root shape, change directory
      shape, dated archive, governed plane roots. Stated against the resolved
      planning root, never a hardcoded store directory name. *3 rows.*
- [x] 2.2 Author `behavior/store/format` — structured spec format, requirement
      identity (stable IDs governed, normalized headers legacy), delta storage,
      rename semantics, proposal format, schema validation, line endings, body
      extraction, fenced-block fidelity. *12 rows.*

## 3. The `governed` domain — parent pair and its leaves

- [x] 3.1 Author `behavior/governed` (parent pair) — opt-in governed model,
      planes as schema data, plane metadata records, open locators, stable
      scoped identities, namespace directories without inheritance, pair
      resolution, plane declaration validation. *19 rows.*
- [x] 3.2 Author `behavior/governed/enforcement` — paired enforcement contract,
      structured bindings, honest evidence strength, drift, retired targets,
      resolvable targets, semantic correspondence, pair-coherent sync, the
      conformance-binding pattern. *14 rows.*
- [x] 3.3 Author `behavior/governed/coverage` — repository summary, drill-down,
      orphan detection, JSON payload, strict gating, lens allocation. *8 rows.*
- [x] 3.4 Author `behavior/governed/review-panel` — the **product** feature:
      blind lenses, lens scoping, residue above the gate, refute-verify,
      non-gating findings, lens growth. Distinct from this repo's own
      `agents/review-panel` instrument. *6 rows.*
- [x] 3.5 Author `behavior/governed/workflow` — governed behavior of explore,
      propose, apply, verify, sync, and archive, plus generated-workflow parity.
      *13 rows.*

## 4. The `schemas` domain — parent pair and its leaves

- [x] 4.1 Author `behavior/schemas` (parent pair) — resolution precedence,
      project-local resolution, config default, backwards compatibility.
      *6 rows.*
- [x] 4.2 Author `behavior/schemas/manage` — `fork`, `init`, `validate`, `which`
      and the listing surface. *16 rows.*
- [x] 4.3 Author `behavior/schemas/structure` — self-contained schema
      directories, override precedence, apply block, project-local names.
      *3 rows.*

## 5. The `workflow` domain (sibling pairs, no parent — parents are earned)

- [x] 5.1 Author `behavior/workflow/status` — status output, artifact state
      detection, next-artifact discovery, JSON planning and action context,
      graceful empty state. *9 rows.*
- [x] 5.2 Author `behavior/workflow/new-change` — change creation, name
      validation, propose flow. *6 rows.*
- [x] 5.3 Author `behavior/workflow/instructions` — instructions and apply
      instructions, template enrichment, context injection, rules injection,
      artifact-ID validation, governed spec context. *15 rows.*
- [x] 5.4 Author `behavior/workflow/templates` — templates command and template
      loading, per-plane authoring templates. *3 rows.*

## 6. The `config` domain (sibling pairs, no parent)

- [x] 6.1 Author `behavior/config/project` — project config contract stated
      against the resolved planning root (never a hardcoded store path),
      resilient parsing, context limit, declared plane set, derived kind.
      *9 rows.*
- [x] 6.2 Author `behavior/config/global` — global config storage, path
      resolution, load/save, defaults, schema evolution.
      *7 rows (8 assigned, 1 re-verdicted `drop` at the archive gate).*
- [x] 6.3 Author `behavior/config/profiles` — profile definitions, delivery
      independence, interactive configuration, storage, application via update.
      *8 rows.*
- [x] 6.4 ~~Author `behavior/config/install-scope`~~ — **withdrawn at the archive
      gate.** No implementation exists for install scope, so its six rows were
      re-verdicted `keep` → `drop` under D2 and the pair was removed from this
      change. See "Re-verdicts at the archive gate" in `proposal.md` and task
      8.2 below.

## 7. Validation

- [x] 7.1 Check every pair mechanically: frontmatter `id` matches the
      enforcement `spec:`, every requirement carries at least one scenario,
      every requirement and scenario `**ID:**` slug is unique within its pair,
      every slug is covered by at least one binding, no binding covers a slug
      that does not exist, and every `targets:` path resolves on disk.
- [x] 7.2 Run every bound test suite and confirm it passes.
- [x] 7.3 Run `openspec validate migrate-specbase-behavior --strict` and confirm
      it passes. Parse every enforcement YAML block with a real YAML parser and
      confirm zero parse failures. Confirm every binding's status is `active`.
- [x] 7.4 Cross-check the authored pairs against `mapping.md`: every
      behavior-destined row except the nine `behavior/telemetry` rows and the
      21 rows re-verdicted `drop` is represented, and every re-verdict is
      recorded with its reason in `proposal.md`.

## 8. Review notes carried to the archiving session

- [x] 8.1 Record the enforcement honesty position: `review` bindings are used
      wherever no existing suite exercises a claim, `limitations` state what
      each suite does not prove, and no test file was created to inflate
      coverage.
- [x] 8.2 **Resolved — unshipped capabilities re-verdicted to `drop`.** Three
      manifest clusters described behavior with no implementation in `src/` and
      no suite in `test/`: install scope (`installation-scope`, plus its
      `cli-config`, `global-config`, `cli-init`, and `cli-update` deltas), tool
      command-surface capabilities
      (`add-tool-command-surface-capabilities`), and plane seeding and catalog
      sync (`seed-planes-into-config`). They were authored with honest
      `planned` / `unenforced` bindings, which the governed archive gate then
      blocked. Per D2 ("aspiration never shipped = drop") the level above
      re-verdicted all 21 rows from the manifest's `keep` to `drop`. The
      `behavior/config/install-scope` pair was removed entirely; four
      requirements left `behavior/cli/init`, three requirements plus one
      scenario left `behavior/cli/update`, and one requirement left
      `behavior/config/global`. Every remaining binding in the change is
      `active`. The re-verdict table is the manifest addendum in `proposal.md`.
- [x] 8.3 Record the three places where the shipped behavior **contradicts** the
      legacy spec text, and where this tranche wrote the shipped truth:
      legacy cleanup now auto-cleans instead of aborting in a non-interactive
      session; instruction context is wrapped in a `project_context` tag, not a
      `context` tag; and `update` no longer manages an `AGENTS.md` file at all —
      the legacy copy is an artifact it removes, which is
      `behavior/cli/legacy-cleanup`'s truth. Two further contradictions were
      **resolved by task 8.2's re-verdicts**: the claim that a skills-invoked
      tool keeps its skills under commands-only delivery, and the claim that
      init always writes the plane list explicitly. Both were aspiration, both
      are dropped, and the shipped behavior each contradicted is now stated
      once — by `behavior/cli/update`'s delivery-sync requirement and by
      `behavior/cli/init`'s plane-picker requirement respectively.
- [x] 8.4 Record the enforcement gap in `behavior/schemas/manage`:
      `test/commands/schema.test.ts` re-implements the behavior it claims to
      test (it copies files inline "to simulate fork" and declares its own name
      regex) and so was **not** bound for the command bodies. That pair is
      review-heavy on purpose; its real automated evidence comes from the
      schema parser and resolver suites the commands delegate to.
