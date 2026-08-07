## Why

The foundation tranche (`migrate-specbase-specs`, archived) established the
governed store, the target tree (design **D3**), and the 451-row migration
manifest (`mapping.md`, design **D7**). It landed one worked behavior pair —
`behavior/telemetry` — as the pattern every later tranche copies.

The behavior plane is where most of the legacy truth lives: **342 of the 451
manifest rows** carry a `behavior/*` destination. Until they land, the
product's user-visible promises stay stranded in `openspec-old/` — flat,
unpaired with enforcement, invisible to the CLI, and mixing user-visible
contracts with internal mechanism narration.

This change is **Migration Plan step 2**: the behavior tranche.

## What Changes

- **Author the 29 remaining `behavior/*` pairs** from D3 (telemetry already
  landed), covering the 312 behavior-destined manifest rows that are neither
  telemetry nor re-verdicted to `drop` at the archive gate (see below).
  Each pair is a `spec.md` + `enforcement.md` written in the
  `behavior/telemetry` house style: frontmatter `id`, `**ID:**` slugs on every
  requirement and scenario, and a `version: 1` enforcement block whose
  bindings name real, existing `test/` suites.
- **Hoist the cross-command invariants into an earned parent pair,
  `behavior/cli`** (Clean Specbase §4, quantification test). Verb–noun command
  structure with deprecated noun-form back-compat, universal `--json`,
  interactivity with non-interactive fallback, exit codes and actionable
  errors, delta display symbols, and completion registration are stated **once**
  on the parent as universally quantified claims. The eleven command leaves
  never restate them.
- **Dissolve `cli-change` and `cli-spec`** (D3). Their noun-form back-compat
  becomes parent truth; their interactive-selection residue merges into
  `behavior/cli/show` and `behavior/cli/validate`.
- **Fold the governed-arc delta residue into `behavior/governed/*`** (D8) —
  the opt-in model and planes-as-schema-data on the parent, with
  `enforcement`, `coverage`, `review-panel`, and `workflow` leaves. The
  review-panel pair here is the **product feature**, distinct from this repo's
  own `agents/review-panel` instrument.
- **Separate store truth from command truth**: `behavior/store/layout` (the
  product store's directory structure) and `behavior/store/format` (structured
  spec format, header-based requirement identity, delta storage, renames) take
  the `openspec-conventions` rows; the archive-apply semantics merge into
  `behavior/cli/archive` per D3.
- **Demote mechanism narration** per D2 — the rows the manifest marks `demote`
  (topological build order, function-level query APIs, single-predicate
  internals) do not become requirements. The code and its tests embody them.
- **State the project-config contract against the resolved planning root**,
  not a hardcoded `openspec/config.yaml`, so the pair survives the store
  rename (manifest note on `config-loading` row 1).

## Source capabilities absorbed (per D3)

| Target pair | Legacy sources |
|---|---|
| `behavior/cli` (parent) | hoisted rows from `cli-archive`, `cli-artifact-workflow`, `cli-change`, `cli-completion`, `cli-feedback`, `cli-init`, `cli-list`, `cli-show`, `cli-spec`, `cli-validate`, `cli-view`, `openspec-conventions`, `schema-*` |
| `behavior/cli/{init,update,validate,archive,list,show,view,config,feedback,completion,legacy-cleanup}` | `cli-*` leaves, `legacy-cleanup`, plus the in-flight `cli-init`/`cli-update` deltas |
| `behavior/store/{layout,format}` | `openspec-conventions`, `cli-spec`, `cli-validate`, `fix-spec-parser-fidelity` |
| `behavior/governed` (+ 4 leaves) | `spec-planes`, `spec-enforcement`, `cli-coverage`, `spec-review-panel`, `enforced-spec-workflow`, `plane-selection-governance`, `agents-plane`, `design-system-plane` |
| `behavior/schemas` (+ 2 leaves) | `schema-resolution`, `schema-fork/init/validate/which-command`, `artifact-graph` (Schema Directory Structure) |
| `behavior/workflow/{status,new-change,instructions,templates}` | `cli-artifact-workflow`, `artifact-graph` (State Detection), `graceful-status-empty`, `change-creation`, `propose-workflow`, `context-injection`, `rules-injection`, `instruction-loader` |
| `behavior/config/{project,global,profiles}` | `config-loading`, `global-config`, `profiles` |

## Re-verdicts at the archive gate

The governed archive gate blocked this change on `planned` / `unenforced`
bindings. Every one of them described a capability with **no implementation in
`src/` and no suite in `test/`**. Per design **D2** ("aspiration never shipped =
drop"), the level above re-verdicted those rows from the manifest's `keep` to
`drop`. The claims are removed from this change rather than carried as
permanently unmet truth.

**Read the archived manifest (`2026-08-07-migrate-specbase-specs/mapping.md`)
with this addendum.** Twenty-one rows destined for `behavior/*` change verdict:

| Source capability → requirement | Manifest destination | Re-verdict |
|---|---|---|
| `installation-scope` → Install scope preference model | `behavior/config/install-scope` | drop |
| `installation-scope` → Effective scope resolution by tool surface | `behavior/config/install-scope` | drop |
| `installation-scope` → Effective scope reporting | `behavior/config/install-scope` | drop |
| `installation-scope` → Cleanup safety for scope transitions | `behavior/config/install-scope` | drop |
| `cli-config` → Install scope configuration via profile flow | `behavior/config/install-scope` | drop |
| `cli-config` → Install scope visibility in config output | `behavior/config/install-scope` | drop |
| `global-config` → Install scope field in global config | `behavior/config/global` | drop |
| `cli-init` → Init install scope selection | `behavior/cli/init` | drop |
| `cli-init` → Init uses effective scope resolution | `behavior/cli/init` | drop |
| `cli-update` → Update install scope selection | `behavior/cli/update` | drop |
| `cli-update` → Scope-aware sync and drift detection | `behavior/cli/update` | drop |
| `cli-init` → Command surface capability resolution | `behavior/cli/init` | drop |
| `cli-init` → Delivery compatibility by tool command surface | `behavior/cli/init` | drop |
| `cli-init` → Init compatibility signaling | `behavior/cli/init` | drop |
| `cli-update` → Delivery sync by command surface capability | `behavior/cli/update` | drop |
| `cli-update` → Configured-tool detection for skills-invocable command surfaces | `behavior/cli/update` | drop |
| `cli-update` → Update summary reflects effective per-tool delivery | `behavior/cli/update` | drop |
| `seed-planes-into-config` → Init seeds selected planes as authoritative config records | `behavior/cli/init` | drop |
| `seed-planes-into-config` → Init always writes selected planes into config | `behavior/cli/init` | drop |
| `seed-planes-into-config` → Seeded records omit picker-only fields | `behavior/cli/init` | drop |
| `seed-planes-into-config` → Update offers to sync new catalog planes | `behavior/cli/update` | drop |

Reason for every row: **aspiration never shipped (D2), re-verdicted from
manifest `keep` to `drop` at the archive gate.**

Consequences for this change's scope:

- The `behavior/config/install-scope` pair is **not authored** — the D3 target
  tree loses that locator. `behavior/config` now holds `project`, `global`, and
  `profiles`.
- Two shipped facts that the dropped requirements happened to carry are
  **retained**, folded into pairs that were already stating them: "an empty
  plane selection writes a configuration with no plane list" moves onto
  `behavior/cli/init`'s plane-picker requirement, and "commands-only delivery
  removes managed skills" is already stated by `behavior/cli/update`'s
  delivery-sync requirement.
- `openspec-old/` still preserves the dropped prose; nothing is destroyed.

## Impact

- **Affected specs**: 29 new `behavior/*` pairs under `specbase/specs/`. No
  existing pair is modified; `behavior/telemetry` stands unchanged.
- **Affected code**: none. Enforcement binds existing `test/` suites, existing
  `src/` files for review bindings, and adds no test or source file.
- **Manifest**: 312 of the 342 behavior-destined rows. The other 30 are the 9
  `behavior/telemetry` rows (landed in the foundation tranche) and the 21 rows
  re-verdicted to `drop` above.
- **Remaining tranches after this one**: `-architecture`, `-ops`, `-agents`,
  `-quality-design`, then retire `openspec-old/`.

## Non-Goals

- **Not** authoring the `architecture/`, `ops/`, `code-quality/`,
  `design-system/`, or `agents/` pairs — later tranches own those, including
  the voice clauses split out of behavior rows into `design-system/cli-voice`.
- **Not** changing product code or adding tests to inflate coverage. Where no
  existing suite honestly exercises a claim, the binding is a `review` binding
  with the behavioural lens and a concrete procedure.
- **Not** re-mining `openspec-old/changes/archive/` (D1).
- **Not** renaming the store directory or touching `openspec-old/`.
