## Why

Governed enforcement files are machine-owned YAML wrapped in repetitive Markdown, and each binding duplicates execution details that belong to its test, lens, or runbook. This makes enforcement verbose, encourages inline commands instead of real checks, and freezes mechanism names in Specbase rather than letting each project describe its own evidence model.

## What Changes

- **BREAKING:** Replace paired `enforcement.md` documents with concise `enforcement.yaml` manifests.
- **BREAKING:** Replace the fixed binding shape with a stable binding map whose entries contain exactly `type`, `covers`, and `source`.
- **BREAKING:** Resolve enforcement types from `specModel.enforcement.types` in schema and project configuration, using the same replace/append model as planes.
- Let each enforcement type declare its purpose, evidence strength, and source kind so agents know when to use it and core can validate and classify it without hardcoding project mechanism names.
- Make requirement IDs the binding boundary; scenarios inherit the enforcement of their requirement.
- Treat the source artifact as authoritative for execution and procedure details. Remove inline commands, targets, lifecycle status, limitations, and review/manual procedure fields from the manifest.
- Require every governed proposal to state its enforcement intent, every design to define what each planned source must assert or observe, and every task plan to include implementing, linking, and executing those sources.
- Project the resolved enforcement-type roster into generated governed guidance.
- Migrate shipped templates, planted baseline pairs, current governed pairs, tests, and documentation to the new format.

## Planes

### Behavioral truth
- `behavior.governed.enforcement`: concise typed source bindings, requirement-level coverage, and validation semantics (modified).
- `behavior.config.project`: schema defaults plus project replace/append declarations resolve the enforcement-type roster (modified).
- `behavior.store.format`: governed enforcement files use direct YAML and the compact binding-map structure (modified).
- `behavior.workflow.templates`: proposal, design, and task templates carry the change-time definition of planned enforcement sources (modified).

### Architectural truth
- `architecture.governed-guidance-projection`: every generated governed surface derives enforcement types and their purposes from the resolved model rather than a frozen mechanism roster (modified).

## Spec pairs

- `behavior.governed.enforcement` -> paired enforcement via the existing governed parser, coverage, drift, and target-validation suites.
- `behavior.config.project` -> paired enforcement via project-config and resolved-model tests.
- `behavior.store.format` -> paired enforcement via parser, discovery, merge, archive, and schema tests.
- `behavior.workflow.templates` -> paired enforcement via template-loading and generated-guidance tests.
- `architecture.governed-guidance-projection` -> paired enforcement via generated-surface parity tests.

## Enforcement intent

| Durable truth | Planned type | Planned source | What the source must establish |
|---|---|---|---|
| Compact YAML parsing and pairing | `test` | `test/core/governed/enforcement-yaml.test.ts` | Direct YAML parses; map keys supply binding identity; scalar/list coverage normalizes; legacy-only fields fail; Markdown fallback and dual-file conflict behave as specified. |
| Configurable type resolution | `test` | `test/core/governed/enforcement-types.test.ts` | Schema defaults and project replace/append declarations resolve deterministically; malformed and duplicate records degrade safely. |
| Coverage, drift, and source validation | `test` | `test/core/governed/coverage.test.ts` and `test/core/governed/target-validation.test.ts` | Strength comes from the resolved type; requirement coverage derives scenario coverage; file and lens sources resolve; stale and retired sources are reported. |
| Native-harness verification semantics | `test` | `test/core/templates/governed-guidance.test.ts` | Generated verification separates source linkage, execution outcome, and semantic correspondence and never treats a link as a passing run. |
| Enforcement planning across artifacts | `test` | `test/core/templates/enforcement-planning.test.ts` | Proposal, design, and task templates require enforcement intent, source definitions, and implementation/execution tasks. |
| Resolved roster projection | `test` | `test/governed-guidance-projection.test.ts` | All governed authoring surfaces project custom enforcement type IDs and purposes and omit removed types. |

## Impact

- Affects governed discovery, parsing, runtime schemas, coverage, drift, diagnostics, archive merge, show/list/context output, templates, baseline planting, generated workflow guidance, and config serialization.
- Changes the governed on-disk contract from `enforcement.md` version 1 to `enforcement.yaml` compact bindings.
- Requires migration of this repository's current governed pairs and archived/current templates; legacy flat specs remain unchanged.
- No new runtime dependency is required; YAML remains the parser format.
