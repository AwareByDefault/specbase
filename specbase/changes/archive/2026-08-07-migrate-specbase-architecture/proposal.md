# Proposal: migrate-specbase-architecture

## Why

The foundation tranche (`migrate-specbase-specs`, archived) moved the repo's
spec truth into `specbase/` and left a requirement-level manifest
(`mapping.md`) naming a destination for every legacy requirement. This change
lands the **architecture plane** of that manifest: the three structural pairs
the product's maintainers own. Until they exist, the boundaries that keep tool
support, shell support, and schema loading extensible live only in code
comments and in `openspec-old/`, where the CLI cannot see them.

## What Changes

- Author three governed spec pairs under `specs/architecture/`, rewritten
  tight from the legacy sources rather than copied:
  - `architecture/command-generation` — the tool-agnostic content boundary,
    the `ToolCommandAdapter` boundary, the single adapter registry, the
    generator composition, and one shared command body. Absorbs the residue of
    `template-artifact-pipeline` **only where it shipped** (one workflow
    source projecting into skills and commands; every writer routing through
    the registry and generator).
  - `architecture/completion` — narrowed hard to the two boundary invariants:
    a common generator/installer interface per shell, and one command registry
    every shell consumes. Class names, factory switch statements, and the
    provider's TTL cache are demoted.
  - `architecture/artifact-graph` — narrowed to the DAG invariants: cycles,
    dangling `requires` references, and duplicate artifact IDs are rejected at
    the single parse boundary. Build-order and query APIs are demoted;
    state detection and schema-directory structure belong to the behavior
    tranche.
- Pair each `spec.md` with an `enforcement.md` binding **existing** suites
  under `test/core/`. Structural claims no test honestly covers bind the
  `architectural` review lens with the deterministic residue named via
  `covered_by`.
- Record the manifest rows whose claim **never shipped**, so no fabricated
  invariant enters current truth (see Impact).

## Planes

Architectural truth only (`specs/architecture/<locator>/`). No behavior, ops,
or code-quality deltas: user-visible command behavior from the same legacy
files is the behavior tranche's, and this change restates none of it.

## Spec pairs

| Spec ID | Locator | New/Modified |
|---|---|---|
| `architecture.command-generation` | `architecture/command-generation` | new |
| `architecture.completion` | `architecture/completion` | new |
| `architecture.artifact-graph` | `architecture/artifact-graph` | new |

Each implies its paired `enforcement.md` in the same directory.

## Impact

- **Store only.** No `src/`, `test/`, or `docs/` edits: every binding targets a
  suite that already exists and already asserts the claim.
- **Manifest rows flagged, not migrated.** Three
  `unify-template-generation-pipeline` rows the manifest marks
  *promote → architecture/command-generation* describe a refactor that was
  never implemented (all of that change's tasks are unchecked and no symbol
  exists in `src/`):
  - **Tool Profile Registry** — no `ToolProfileRegistry`; tool capability facts
    remain split across `AI_TOOLS` and `CommandAdapterRegistry`.
  - **Ordered Transform Pipeline** — no phase/priority transform runner;
    `init.ts` and `update.ts` still apply `transformToHyphenCommands` through
    an inline per-tool conditional.
  - **Shared Artifact Sync Engine** — no `ArtifactSyncEngine`; `init` and
    `update` still run their own write loops over the shared content and
    adapters.

  Two clauses of the `add-global-install-scope` MODIFIED rows are likewise
  unshipped: adapters take a command id and nothing else, so neither path
  resolution nor the generator "receives install context". The Codex clause of
  the same rows *did* ship — a globally scoped tool's adapter returns an
  absolute path it resolves itself — and is migrated as the adapter's
  path-scope scenario.

  Two pipeline rows are migrated **narrowed** to their shipped remainder:
  *Canonical Workflow Manifest* → one shared workflow-template source with
  skill/command projection parity; *Fidelity Guardrails* → the parity and
  registry-iteration tests that already guard projection drift. The three
  unshipped rows stay unmigrated with this reason recorded; they are aspiration
  (D2 `drop`), not current truth.
