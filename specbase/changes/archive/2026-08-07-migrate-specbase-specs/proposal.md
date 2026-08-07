## Why

This repository is the Specbase product itself and now self-hosts the governed
spec model, but its spec truth is stranded in a legacy store. `openspec-old/`
holds the flat, pre-governed specbase specs (35 capability specs, ~440
requirements including in-flight delta residue) under the old `openspec/`
layout — invisible to the CLI, unpaired with enforcement, and mixing
user-visible contracts with internal mechanism detail. The live governed store
`specbase/` holds only the two planted `agents` baseline specs, both currently
**broken** because their targets hardcode `openspec/config.yaml` while the
real config lives at `specbase/config.yaml`. The repository's own product
specs should practice the model the product enforces for others: governed,
plane-separated, and paired with honest enforcement.

## What Changes

- **Rewrite the legacy spec truth into governed spec pairs, organized per
  Clean Specbase** (`docs/clean-specbase.md`): planes assigned by the actor
  test, locators grouped by common closure, shared invariants hoisted into
  earned parent pairs, and the stability gradient (rootward dependency,
  leafward ripple) applied within each plane. Each `spec.md` is paired with an
  `enforcement.md`. Mechanism-only claims are demoted out of current truth.
- **Maintain a requirement-level migration manifest** (`mapping.md` in this
  change): one row per old requirement (flat specs ∪ in-flight residue) with
  a keep/promote/demote/drop verdict and destination locator. The manifest is
  the 100%-coverage guarantee; drops are recorded, never implied.
- **Reconcile in-flight delta residue.** The governed-arc residue (planes
  model, enforcement contract, coverage, review panel, governed workflow) is
  folded in as the new `behavior/governed/*` domain. Residue that never
  shipped is dropped with a recorded verdict.
- **Drop the opsx skill specs.** The opsx skill surface is superseded by the
  spcb (specbase) skills; the old `opsx-*-skill` specs are recorded as drops
  in the manifest, not migrated.
- **Repair the planted baseline pairs.** `agents/spec-driven` and
  `agents/review-panel` get their broken `openspec/` targets corrected to
  `specbase/` so `openspec validate` passes.
- **Seed the store's context.** The product-language and cross-platform
  rules from `openspec-old/config.yaml` migrate into `specbase/config.yaml`
  so future authoring gets the same constraints.
- **Add the migration's own durable truth:** `ops/planning-layout` — the
  `specbase/` directory is the planning root; `openspec-old/` is retired
  history, not authoritative.
- **BREAKING (repo-internal):** `openspec-old/` ceases to be a source of spec
  truth. It stays on disk as the dated historical archive (82 archived changes,
  explorations, initiatives, work slices) but is no longer consulted for
  current requirements.
- **Deep rebrand — the repository is Specbase now.** The product brand and its
  command surface fully drop `openspec`/`opsx` naming: the CLI binary, package
  identity (`@awarebydefault/specbase`), covered directory references, and the
  `/opsx:` slash-command family (→ `/spcb:`). Scope is captured in this change;
  the mechanical rename itself lands as the `specbase-dir-rebrand` follow-on
  (a repo-tooling concern tracked separately from spec-content tranches).

  **Naming matrix (rebrand rule):**

  | Source | Target |
  |--------|--------|
  | `openspec` (token) | `specbase` |
  | `OpenSpec` | `Specbase` |
  | `OPENSPEC` (env vars, macros) | `SPECBASE` |
  | `Openspec` | `Specbase` |
  | `@fission-ai/openspec` | `@awarebydefault/specbase` |
  | `openspec-conventions` (capability) | `specbase-conventions` |
  | `bin/openspec.js` + `"bin":"openspec"` | `bin/specbase.js` + `"bin":"specbase"` |
  | `openspec/` (store) | `specbase/` |
  | `/opsx:`, `opsx`, `opsx/` (commands/skills/prompts) | `/spcb:`, `spcb`, `spcb/` |
  | `release-openspec` (skill) | `release-specbase` |

  **Attribution exception (kept verbatim):** `LICENSE` (upstream OpenSpec
  © 2024 copyright), `NOTICE.md` (entirely — derivative-work credit), and
  `README.md`'s "built on OpenSpec by Fission-AI" note / "use OpenSpec
  directly" / NOTICE link. These are legal/derivative credit to the upstream
  Fission-AI project and are NOT rebranded.

  **In-flight state to reconcile before commit/push:** the working tree has
  `openspec/` files staged deleted, a fresh untracked `specbase/` store, an
  archival `openspec-old/` (4 MB), plus `.serena/`+`test-project/` deletions
  and untracked `test-project-2/` — the rename commit must be isolated from
  this unrelated in-flight state.

## Planes

### Behavioral truth
- `behavior.cli` (new, **parent pair**): cross-command invariants hoisted
  from duplicated requirements — verb–noun structure with noun-form
  deprecation, universal `--json` support, interactivity with non-interactive
  fallback, exit codes and actionable errors, delta display symbols,
  completion registration. Universally quantified, enforceable by iteration
  over the command registry.
- `behavior.cli.*` leaves (thin, deduplicated against the parent): init,
  archive, list, show, validate, view, update, config (command surface only),
  feedback, completion, legacy-cleanup. The old `cli-change` and `cli-spec`
  specs dissolve: deprecated noun forms live in the parent's back-compat
  invariant; interactive selection is hoisted; residue merges into `show` and
  `validate`.
- `behavior.store.*` (new): `layout` (the product's store directory
  structure) and `format` (structured spec format, header-based requirement
  identification, delta storage and rename semantics) — distilled from
  `openspec-conventions`, whose archive-apply semantics merge into
  `behavior.cli.archive`.
- `behavior.governed.*` (new): parent pair carrying the opt-in governed
  model, planes-as-schema-data, locator rules, and pair resolution; leaves
  `enforcement` (binding contract, evidence strength, drift), `coverage`,
  `review-panel` (the product feature, distinct from the repo's own
  `agents/review-panel` instrument), and `workflow` (governed behavior of
  explore/propose/apply/archive).
- `behavior.schemas.*`: parent pair = resolution precedence (the invariant
  every schema command obeys); leaves `manage` (fork | init | validate |
  which) and `structure` (schema directories and override precedence,
  absorbed from `artifact-graph`).
- `behavior.workflow.*`: `status` (including graceful empty state and
  artifact state detection), `new-change` (change creation + propose flow),
  `instructions` (command surface + context/rules injection + template
  loading), `templates`.
- `behavior.config.*` (new, consolidated preference-model domain): `project`
  (config loading), `global` (global config storage), `profiles`,
  `install-scope`.
- `behavior.telemetry` (new): the privacy-preserving telemetry contract
  (this change's worked-example pair).

### Architectural truth
- `architecture.command-generation` (new): the `ToolCommandAdapter`
  boundary, registry, and command-body construction; absorbs the
  `template-artifact-pipeline` residue.
- `architecture.completion` (new, narrowed): the common generator/installer
  interface and single-registry invariant; class-level pattern detail is
  demoted.
- `architecture.artifact-graph` (new, narrowed): DAG structural invariants
  only (cycles, dangling references, duplicates rejected); state-detection
  semantics move to `behavior.workflow.status`, schema directories to
  `behavior.schemas.structure`, and function-level API scenarios are demoted.

### Ops
- `ops.planning-layout` (new): `specbase/` is the planning root;
  `openspec-old/` is retired history.
- `ops.nix-ci` (new): Nix flake build, update script, CI job and local
  testing requirements.
- `ops.tool-paths` (new): supported AI tools, their install paths, and
  cross-platform path handling.
- `ops.stack` (new): the runtime/toolchain the repo mandates (Node ≥20.19,
  pnpm, Commander, PostHog telemetry dependency).

### Code-quality
- `code-quality.spec-authoring` (new, craft only): progressive rigor,
  behavior-first specification boundary, lightweight-by-default. Format and
  structure contracts move to `behavior.store.format`; this pair shrinks to
  the judgment claims a linter cannot make.

### Design-system
- `design-system.cli-voice` (new): the CLI's expressed voice — terse, calm
  user-facing copy, non-blaming errors, consistent output framing (distilled
  from scattered copy requirements in `cli-validate`, `cli-archive`,
  `cli-feedback`, `cli-view`, `cli-completion`).

### Agents
- `agents.spec-driven` (modified): repaired `specbase/config.yaml` targets.
- `agents.review-panel` (modified): repaired `specbase/` targets.
- `agents.agent-docs` (new): what `AGENTS.md` and agent-instruction docs must
  contain (replaces `docs-agent-instructions`; seeds the currently-empty root
  `AGENTS.md`).

### Dropped (recorded in the manifest)
- `opsx-onboard/verify/archive/sync-skill` — superseded by the spcb skill
  surface; not migrated.
- `change-stacking-workflow` — never shipped (no stacking code in `src/`).
- `developer-qa-workflow` — never shipped (no Makefile exists).
- `oh-my-pi-tool` — verify against the tool registry before final verdict.

## Spec pairs

- `behavior.*`, `architecture.*` → paired enforcement via existing vitest
  suites where they genuinely exercise the claim; parent-pair invariants
  prefer registry-iteration conformance tests; honest `review` (behavioural /
  architectural lenses) and `manual` bindings elsewhere.
- `ops.planning-layout` → `command` binding (a script asserting `specbase/`
  resolves as the planning root and `openspec-old/` is not authoritative).
- `ops.nix-ci`, `ops.tool-paths`, `ops.stack` → `command`/config-conformance
  bindings against `flake.nix`, `.github/workflows/`, `package.json`.
- `code-quality.spec-authoring` → `review` (code-quality lens) + eslint
  conformance where a rule exists.
- `design-system.cli-voice` → `review` (design lens) for voice judgments;
  deterministic sub-rules (stderr prefixes) as lint/test where checkable.
- `agents.*` → conformance/drift bindings against the artifacts they describe
  (`specbase/config.yaml`, `DEFAULT_LENSES`, `AGENTS.md`), per the
  agents-plane pattern.

## Impact

- **Affected code**: none in this change beyond the planning store itself;
  enforcement targets reference existing tests, config, and CI files. The
  mechanical `specbase-dir-rebrand` follow-on (not this change) rewires the
  `bin/`, `src/`, `test/`, `docs/`, `package.json`, and skill/prompt dirs per
  the naming matrix in the What Changes section.
- **Stores**: `specbase/` gains the full governed spec tree;
  `openspec-old/` is frozen as historical archive.
- **Dependencies**: none added. Config gains a `context` field.
- **Repo health**: fixes the broken planted pairs, seeds the empty root
  `AGENTS.md`, and de-stales the spec surface that drives `openspec coverage`.
