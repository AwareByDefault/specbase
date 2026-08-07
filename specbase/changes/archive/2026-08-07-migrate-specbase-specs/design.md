## Context

The repo is mid-transition to self-hosting the governed model it ships:

- The legacy store `openspec-old/` (renamed from the root-level `openspec/`)
  holds the accumulated spec truth of the product: 35 flat capability specs
  (~440 requirements, ~5,300 lines), 82 archived changes (history), 21
  in-flight changes, plus explorations/initiatives/work slices.
- The live governed store `specbase/` holds `config.yaml` (6 planes) and the
  two baseline `agents` pairs planted by init — both **broken** because
  enforcement targets and prose hardcode `openspec/config.yaml` while the
  real path is `specbase/config.yaml`.
- The published CLI (specbase 1.6.0) resolves the planning dir by preferring
  `specbase/`, falling back to `openspec/`. `openspec-old/` is therefore
  invisible to every command: its truth is dead weight.
- The flat specs predate the plane model. A single old capability mixes
  user-visible contracts (behavior), internal mechanisms (often
  implementation detail), tooling choices (ops), and repo agentic instruments
  (agents). The repo's own convention — "specs capture verifiable behavior
  contracts and avoid internal implementation detail" — is the distillation
  rule for the rewrite.
- Enforcement evidence already exists: 139 vitest files under `test/`, Nix
  flake + GitHub Actions, eslint config, and the review panel's six lenses
  (`architectural`, `behavioural`, `ops`, `code-quality`, `design`,
  `enforcement`) in `src/core/governed/lenses.ts`.

## Goals

- `specbase/` becomes the single, authoritative, validated governed spec tree
  for this repo (`openspec validate` and `openspec coverage --strict` pass).
- Every old capability's durable truth is preserved — relocated, not lost —
  and the in-flight governed-arc delta residue is folded in.
- Enforcement is honest: automated bindings only where a real check exists;
  review/manual bindings used openly for the residue. `degraded` is factual.
- Mechanism-only prose is demoted out of current truth so the spec surface
  shrinks to what must remain true.

## Non-Goals

- **Not** migrating the 82 archived changes, explorations, initiatives, or
  work slices into specbase — they stay in `openspec-old/` as dated history.
- **Not** rewiring the CLI code or merging the `specbase-dir-migration`
  branch in this change (a repo-tooling concern, tracked separately). The
  deep rebrand is captured in the proposal; its mechanical rename lands as
  `specbase-dir-rebrand`.
- **Not** rewriting application code; enforcement targets existing tests/lint.
- **Not** inventing hollow tests to inflate coverage.

## Decisions

### D1. Migration source of truth = flat specs ∪ in-flight delta residue

The 35 flat specs are the accumulated current truth, but 15 of the 21
in-flight change deltas contain requirements the flat specs never absorbed
(the governed-arc in particular: agents plane, review panel, coverage, plane
generalization, config seeding). Source = flat `specs/*/spec.md` plus the
requirements in `openspec-old/changes/*/specs/**` not already present in the
flat tree. Superseded or reverted claims are dropped. The 82 archived changes
are evidence of history only — never re-mined for current truth.

### D2. Distillation rule: keep what must remain true now

Each old requirement is classified:

| Verdict | Meaning | Example |
|---|---|---|
| **keep** | durable user-visible, structural, ops, or agentic truth | `validate` reports file paths |
| **promote** | internal mechanism that is a real structural invariant | `ToolCommandAdapter` interface → `architecture/command-generation` |
| **demote** | "how it works" detail with no contract to guard | "compute a valid topological build order" → design docs |
| **drop** | superseded, reverted, or aspiration never shipped | legacy cleanup remnants already gone |

Demoted claims are not lost to history — the code and tests embody them, and
`openspec-old/` preserves the prose. The permanent specs state only current
truth.

### D3. Locator grouping: Clean Specbase tree (actor test + common closure)

Old capability granularity (35 files) is too fine for plane-organized truth
and mixes planes within one file. The target tree applies the Clean Specbase
rules (`docs/clean-specbase.md`): planes assigned by the actor test, locators
grouped by common closure, shared invariants hoisted into earned parent
pairs, thin leaves deduplicated against their parents:

```
behavior/
  cli/                ← PARENT PAIR: verb–noun structure + noun-form
                        deprecation, universal --json, interactivity +
                        non-interactive fallback, exit codes / actionable
                        errors, delta display symbols, completion
                        registration (registry-iteration enforcement)
    init/ archive/ list/ show/ validate/ view/ update/
    config/ feedback/ completion/ legacy-cleanup/
                        (cli-change and cli-spec dissolve: noun forms →
                        parent back-compat; interactive selection → hoisted;
                        residue → show/, validate/)
  store/              layout (product store structure),
                      format (spec format, header IDs, delta storage,
                      renames) — from openspec-conventions; archive-apply
                      semantics merge into cli/archive
  governed/           ← PARENT PAIR: opt-in model, planes-as-data,
                        locators, pair resolution
    enforcement/ coverage/ review-panel/ workflow/
  schemas/            ← PARENT PAIR: resolution precedence
    manage/ (fork|init|validate|which)  structure/ (dirs + overrides,
                      absorbed from artifact-graph)
  workflow/           status (incl. graceful empty + artifact state
                      detection), new-change (change-creation + propose),
                      instructions (command + context/rules injection +
                      template loading), templates
  config/             project (config-loading), global (global-config),
                      profiles, install-scope
  telemetry           (worked example, this change)
architecture/
  command-generation  (+ template-artifact-pipeline residue)
  completion          (narrowed: generator interface + single registry)
  artifact-graph      (narrowed: DAG invariants only)
ops/
  planning-layout     (new — this change)
  nix-ci
  tool-paths
  stack
code-quality/
  spec-authoring      (craft only: progressive rigor, behavior-first
                      boundary, lightweight default)
design-system/
  cli-voice
agents/
  spec-driven, review-panel   (repaired — this change)
  agent-docs
```

### D4. Enforcement mechanism per plane (highest-leverage check first)

- **behavior** → existing vitest suites by module (`test/core/*`); bind at the
  requirement level, note in `limitations` when a suite exercises only part of
  the claim; `review` (behavioural lens) where no test honestly covers it.
- **architecture** → conformance where a test/lint already enforces the edge
  (e.g. `test/core/command-generation/*`); otherwise `review` (architectural
  lens) with the residue above the deterministic gate named via `covered_by`.
- **ops** → `command` bindings: `nix flake check` / workflow-file existence
  for `nix-ci`; path/config assertions for `tool-paths`; `package.json`
  dependency audit for `stack`; a resolve-and-compare script for
  `planning-layout`.
- **code-quality** → eslint conformance where a rule exists, plus `review`
  (code-quality lens) for judgment claims (names reveal intent, no cruft).
- **design-system** → deterministic sub-rules (stderr prefixes, "Error: "
  framing) as test/lint where checkable; voice judgments ("terse", "never
  blames") as `review` (design lens) — the pattern proven in the
  `test-project-2` dogfood.
- **agents** → conformance/drift bindings per the agents-plane pattern: each
  spec DESCRIBES an operational artifact (`specbase/config.yaml`, skill
  files, `DEFAULT_LENSES`, `AGENTS.md`) and binds a check that the artifact
  conforms; the artifact stays the runtime source of truth.

### D5. Foundation tranche carries repair + one worked example

This change's own spec deltas are: repaired `agents/spec-driven` and
`agents/review-panel` (targets → `specbase/…`), new `ops/planning-layout`,
and — as the pattern every later tranche copies — one fully worked pair from a
different plane (see Migration Plan). All remaining pairs are authored and
archived in follow-on changes so each tranche stays reviewable.

### D6. Seed context, fix AGENTS.md rot

`openspec-old/config.yaml`'s context (product language, cross-platform rules)
migrates verbatim into `specbase/config.yaml`. The empty root `AGENTS.md`
gets seeded from the best of `openspec-old/work/AGENTS.md` (product-lens
guidance) plus quick-reference content the `agents.agent-docs` pair requires
— authored through a change, not directly.

### D7. The migration manifest is the coverage guarantee

Every old requirement — the ~246 in the flat specs plus the ~199 in
unarchived change deltas — gets one row in this change's `mapping.md`:
source locator, requirement header, verdict (keep/promote/demote/drop),
destination locator, and new requirement ID for keep/promote. Drops are
recorded with a reason, never implied. Each follow-on tranche's review checks
its diff against the manifest before archive; the manifest is the mechanical
answer to "did anything leak."

### D8. Residue verdicts

- **Keep**: the governed-arc (`spec-planes`, `spec-enforcement`,
  `cli-coverage`, `spec-review-panel`, `enforced-spec-workflow`,
  `plane-selection-governance`) → `behavior/governed/*`; `profiles` and
  `installation-scope` → `behavior/config/*`; `propose-workflow` and
  `graceful-status-empty` → `behavior/workflow/*`;
  `template-artifact-pipeline` → `architecture/command-generation`.
- **Drop (recorded)**: the `opsx-*-skill` specs (onboard, verify, archive,
  sync, explore, update) — the opsx skill surface is superseded by the spcb
  (specbase) skills; `change-stacking-workflow` (no stacking code shipped);
  `developer-qa-workflow` (no Makefile exists).
- **Verify then decide**: `oh-my-pi-tool` — check the tool registry in
  `src/` for shipped omp support before the final verdict.

## Risks / Trade-offs

- **[Claims drift during rewriting]** — the distillation judgment loses a
  requirement's intent. → Every old requirement is accounted for in the
  mapping table (keep/promote/demote/drop + destination locator); review each
  tranche's diff against the source before archive.
- **[Hollow enforcement]** — bindings pointing at test files that don't
  actually exercise the claim. → Follow the enforcement philosophy: bind at
  requirement level, write honest `limitations`, and prefer `review` with a
  real lens over a fake automated check. `degraded` is acceptable and visible
  in coverage.
- **[Plane misclassification]** — e.g. an ops claim landing in behavior. →
  The mapping table is reviewed per tranche with the plane-purpose classifier
  from the explore flow; the review panel's per-plane lenses catch residue.
- **[Follow-on tranches stall]** — the program spans several changes and
  momentum is lost. → Tranches are small enough to land one at a time; each
  archives independently and the store stays valid between them.
- **[Merging specbase-dir-migration later conflicts with rewritten pairs]** —
  the code-level dirname migration touches templates and tests, not the
  spec-content pairs. → Sequence it after the spec tranches or in parallel;
  conflict surface is minimal (paths inside enforcement targets).

## Migration Plan

1. **Foundation (this change)**: repair `agents/spec-driven` +
   `agents/review-panel` to `specbase/` targets; add `ops/planning-layout`;
   seed `specbase/config.yaml` context; one worked example pair (tranche
   pattern). Archive → `openspec validate` passes.
2. **Tranche behavior** (change `migrate-specbase-behavior`): author and
   archive the `behavior/*` pairs from D3 — the `cli` parent pair and thin
   leaves, then the `store`, `governed`, `schemas`, `workflow`, and `config`
   domains — with bindings against `test/core/*`; may split into two changes
   (cli / domains) if the diff grows past comfortable review size.
3. **Tranche architecture** (`migrate-specbase-architecture`): the three
   structural pairs.
4. **Tranche ops** (`migrate-specbase-ops`): `nix-ci`, `tool-paths`, `stack`
   with command bindings.
5. **Tranche agents** (`migrate-specbase-agents`): `agent-docs`; seed root
   `AGENTS.md` via the change. (The opsx skill specs are dropped per D8 —
   the spcb skills are the current surface.)
6. **Tranche quality/design** (`migrate-specbase-quality-design`):
   `code-quality/spec-authoring`, `design-system/cli-voice`.
7. **Retire**: confirm `openspec coverage` shows the full surface healthy;
   freeze `openspec-old/` with a README stating it is historical archive;
   note the repo-code dirname migration as a separate tracked item.

Rollback: each archived tranche is a dated archive entry; a bad tranche is
reverted by a corrective change (or `git` on the store). `openspec-old/`
remains untouched until the final retire step, so nothing is ever destroyed.

## Open Questions

- Should `openspec-old/changes/archive` move into `specbase/changes/archive`
  for a single-store history, or stay as git-preserved history in
  `openspec-old/`? (Default: stay — specbase starts clean; git has it.)
- Where do `explorations/`, `initiatives/`, and `work/` live long-term? They
  are process history, not spec truth — keep in `openspec-old/` unless the
  team wants them promoted to repo docs.
- Which worked-example pair should the foundation carry — a behavior pair
  (`behavior/telemetry`, self-contained, real test evidence) or an agents
  pair? (Default: `behavior/telemetry`.)
