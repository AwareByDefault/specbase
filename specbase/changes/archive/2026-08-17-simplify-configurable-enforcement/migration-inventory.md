# Enforcement migration inventory

Migrated the 49 HEAD-backed current self-hosted pairs and the five deltas in this archived change from legacy fenced Markdown to compact YAML. Dated archives outside this change were not changed. This migration preserves structural source linkage; it does not claim semantic correspondence or a fresh execution result.

## Summary

- Governed manifests inventoried: 54 (49 current pairs + 5 archived deltas)
- Legacy bindings: 254
- Compact bindings: 389
- Additional bindings created by one-source splitting and change-delta additions: 135
- Compact cover references: 603 across 308 pair-local requirement IDs
- Compact source references: 389 (one per binding), using 140 distinct source strings
- Shipped template migrations: 5 (`enforcement.md` -> `enforcement.yaml`), containing 9 legacy example bindings and 7 compact example bindings, 10 cover references, and 5 distinct source strings; these illustrative templates are not included in the 54 governed-manifest totals above

Counts are taken from the clean commit scope: HEAD supplies each current pair's legacy manifest, while the scoped compact files supply binding, cover, and source counts. A cover is counted once per binding-to-requirement edge after scalar/list normalization; requirement identity is pair-local. A source reference is counted once per binding, with distinct source strings deduplicated repository-wide.

## Reviewed mappings and exceptions

- Explicit legacy lens declarations (including nested review lens declarations) were preserved as compact review sources.
- Review bindings without an explicit lens use the containing plane's configured review lens: behaviour -> behavioural, architecture -> architectural, ops -> ops, code-quality -> code-quality, and design-system -> design.
- Agents-plane reviews without an explicit lens were inspected as artifact-conformance reviews and mapped to the cross-cutting enforcement lens.
- File-backed bindings with multiple declared targets were split. The first keeps the original binding ID; later IDs use collision-safe target-basename suffixes.
- File-backed sources always come from the legacy declared targets. No executable from an inline run vector became a source.
- No zero-source file/manual binding or undecidable manual procedure was present.
- Two directory-valued legacy sources were resolved to concrete files because compact file sources must name files: the store-validator binding names the governed validator, and the adapter-path binding names the adapter registry module.
- Purpose-only bindings from the separate purpose work were excluded from five current manifests and the workflow-template delta. Four newly introduced STE/baseline pairs and the ignored non-HEAD coverage pair are outside this inventory.

## Per-file inventory

- `specbase/specs/agents/agent-docs/enforcement.yaml`: 4 -> 4 bindings; 9 cover references; 2 distinct sources
- `specbase/specs/agents/clean-manifesto/enforcement.yaml`: 5 -> 7 bindings; 7 cover references; 5 distinct sources
- `specbase/specs/agents/idea-lifecycle/enforcement.yaml`: 2 -> 2 bindings; 2 cover references; 2 distinct sources
- `specbase/specs/agents/review-panel/enforcement.yaml`: 2 -> 2 bindings; 3 cover references; 2 distinct sources
- `specbase/specs/agents/spec-driven/enforcement.yaml`: 2 -> 2 bindings; 2 cover references; 1 distinct sources
- `specbase/specs/architecture/artifact-graph/enforcement.yaml`: 3 -> 4 bindings; 6 cover references; 4 distinct sources
- `specbase/specs/architecture/command-generation/enforcement.yaml`: 7 -> 11 bindings; 15 cover references; 10 distinct sources
- `specbase/specs/architecture/completion/enforcement.yaml`: 5 -> 11 bindings; 12 cover references; 11 distinct sources
- `specbase/specs/architecture/governed-guidance-projection/enforcement.yaml`: 3 -> 5 bindings; 5 cover references; 2 distinct sources
- `specbase/specs/architecture/ideas/enforcement.yaml`: 2 -> 2 bindings; 2 cover references; 2 distinct sources
- `specbase/specs/architecture/review-panel-projection/enforcement.yaml`: 2 -> 2 bindings; 2 cover references; 2 distinct sources
- `specbase/specs/behavior/cli/archive/enforcement.yaml`: 4 -> 5 bindings; 11 cover references; 4 distinct sources
- `specbase/specs/behavior/cli/completion/enforcement.yaml`: 8 -> 14 bindings; 23 cover references; 13 distinct sources
- `specbase/specs/behavior/cli/config/enforcement.yaml`: 6 -> 7 bindings; 12 cover references; 4 distinct sources
- `specbase/specs/behavior/cli/enforcement.yaml`: 12 -> 25 bindings; 38 cover references; 17 distinct sources
- `specbase/specs/behavior/cli/feedback/enforcement.yaml`: 6 -> 6 bindings; 8 cover references; 3 distinct sources
- `specbase/specs/behavior/cli/init/enforcement.yaml`: 14 -> 21 bindings; 27 cover references; 10 distinct sources
- `specbase/specs/behavior/cli/legacy-cleanup/enforcement.yaml`: 5 -> 6 bindings; 9 cover references; 4 distinct sources
- `specbase/specs/behavior/cli/list/enforcement.yaml`: 4 -> 4 bindings; 10 cover references; 4 distinct sources
- `specbase/specs/behavior/cli/review-panel-availability/enforcement.yaml`: 1 -> 1 bindings; 2 cover references; 1 distinct sources
- `specbase/specs/behavior/cli/show/enforcement.yaml`: 3 -> 5 bindings; 10 cover references; 5 distinct sources
- `specbase/specs/behavior/cli/update/enforcement.yaml`: 10 -> 15 bindings; 16 cover references; 9 distinct sources
- `specbase/specs/behavior/cli/validate/enforcement.yaml`: 7 -> 10 bindings; 24 cover references; 9 distinct sources
- `specbase/specs/behavior/cli/view/enforcement.yaml`: 3 -> 3 bindings; 8 cover references; 3 distinct sources
- `specbase/specs/behavior/config/global/enforcement.yaml`: 4 -> 6 bindings; 13 cover references; 4 distinct sources
- `specbase/specs/behavior/config/profiles/enforcement.yaml`: 5 -> 8 bindings; 15 cover references; 8 distinct sources
- `specbase/specs/behavior/config/project/enforcement.yaml`: 4 -> 6 bindings; 12 cover references; 5 distinct sources
- `specbase/specs/behavior/governed/enforcement.yaml`: 8 -> 13 bindings; 26 cover references; 11 distinct sources
- `specbase/specs/behavior/governed/enforcement/enforcement.yaml`: 10 -> 26 bindings; 42 cover references; 13 distinct sources
- `specbase/specs/behavior/governed/review-panel/enforcement.yaml`: 3 -> 4 bindings; 8 cover references; 4 distinct sources
- `specbase/specs/behavior/governed/workflow/enforcement.yaml`: 6 -> 7 bindings; 18 cover references; 5 distinct sources
- `specbase/specs/behavior/ideas/enforcement.yaml`: 2 -> 2 bindings; 5 cover references; 2 distinct sources
- `specbase/specs/behavior/schemas/enforcement.yaml`: 4 -> 5 bindings; 6 cover references; 5 distinct sources
- `specbase/specs/behavior/schemas/manage/enforcement.yaml`: 6 -> 6 bindings; 14 cover references; 3 distinct sources
- `specbase/specs/behavior/schemas/structure/enforcement.yaml`: 4 -> 5 bindings; 5 cover references; 5 distinct sources
- `specbase/specs/behavior/store/format/enforcement.yaml`: 10 -> 28 bindings; 29 cover references; 13 distinct sources
- `specbase/specs/behavior/store/layout/enforcement.yaml`: 5 -> 7 bindings; 7 cover references; 7 distinct sources
- `specbase/specs/behavior/telemetry/enforcement.yaml`: 6 -> 6 bindings; 10 cover references; 3 distinct sources
- `specbase/specs/behavior/workflow/idea-graduation/enforcement.yaml`: 1 -> 1 bindings; 1 cover references; 1 distinct sources
- `specbase/specs/behavior/workflow/instructions/enforcement.yaml`: 6 -> 8 bindings; 16 cover references; 7 distinct sources
- `specbase/specs/behavior/workflow/new-change/enforcement.yaml`: 4 -> 5 bindings; 8 cover references; 5 distinct sources
- `specbase/specs/behavior/workflow/status/enforcement.yaml`: 7 -> 11 bindings; 14 cover references; 10 distinct sources
- `specbase/specs/behavior/workflow/templates/enforcement.yaml`: 4 -> 5 bindings; 6 cover references; 5 distinct sources
- `specbase/specs/code-quality/spec-authoring/enforcement.yaml`: 4 -> 4 bindings; 6 cover references; 2 distinct sources
- `specbase/specs/design-system/cli-voice/enforcement.yaml`: 6 -> 10 bindings; 12 cover references; 7 distinct sources
- `specbase/specs/ops/nix-ci/enforcement.yaml`: 5 -> 9 bindings; 11 cover references; 5 distinct sources
- `specbase/specs/ops/planning-layout/enforcement.yaml`: 3 -> 3 bindings; 3 cover references; 2 distinct sources
- `specbase/specs/ops/stack/enforcement.yaml`: 3 -> 7 bindings; 16 cover references; 5 distinct sources
- `specbase/specs/ops/tool-paths/enforcement.yaml`: 3 -> 6 bindings; 9 cover references; 6 distinct sources
- `specbase/changes/archive/2026-08-17-simplify-configurable-enforcement/specs/architecture/governed-guidance-projection/enforcement.yaml`: 2 -> 2 bindings; 2 cover references; 2 distinct sources
- `specbase/changes/archive/2026-08-17-simplify-configurable-enforcement/specs/behavior/config/project/enforcement.yaml`: 1 -> 1 bindings; 1 cover references; 1 distinct sources
- `specbase/changes/archive/2026-08-17-simplify-configurable-enforcement/specs/behavior/governed/enforcement/enforcement.yaml`: 5 -> 10 bindings; 20 cover references; 8 distinct sources
- `specbase/changes/archive/2026-08-17-simplify-configurable-enforcement/specs/behavior/store/format/enforcement.yaml`: 2 -> 3 bindings; 3 cover references; 2 distinct sources
- `specbase/changes/archive/2026-08-17-simplify-configurable-enforcement/specs/behavior/workflow/templates/enforcement.yaml`: 1 -> 1 bindings; 2 cover references; 1 distinct sources
