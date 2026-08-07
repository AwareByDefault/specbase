## Why

After emergent-governance init, a project's plane set is split between two files: the four core planes are implicit (inherited from the schema) and only opt-in planes appear in `openspec/config.yaml`. To answer "what planes govern this repo?" you must read the schema *and* the config, and to drop a core plane you cannot simply edit config — it isn't listed there. Making `config.yaml` the single, authoritative source of truth for planes is more legible, more portable, and matches the project's own philosophy (the `agents/spec-driven` spec already treats `config.yaml` as the governance record it describes).

## What Changes

- **Seed full plane records at init.** `openspec init` writes every SELECTED plane's full record into `config.yaml` under `specModel.planes:` (replace mode), instead of omitting the core four when the selection matches the schema defaults. Config now fully describes the project's governance.
- **Config becomes authoritative.** Because `planes:` is replace, the resolved plane set equals exactly what config lists. Adding a line gains a plane; **deleting a line drops that plane even though the schema still defines it in the codebase**; emptying the list resolves to the flat/legacy model via the existing emergent-governance rule. This is the intended behavior and the point of the change.
- **The schema's role narrows.** `schemas/spec-driven-governed/schema.yaml` keeps its plane list, but it is now only: (a) the init picker's menu/catalog, (b) the seed source init copies from, and (c) an opt-in sync source — no longer the resolved-default source for a seeded project.
- **Clean seeded records.** Seeded planes omit picker-only noise: no `defaultSelected` (meaningless once selected) and no `crossCutting: false` default; each record writes `id`, `purpose`, `enforcementFlavor`, and `reviewLens` when present.
- **Opt-in plane sync on update.** `openspec update` detects planes present in the schema catalog but absent from the project config and OFFERS to add them — never silently. This recovers the wanted part of the upgrade path now that config is frozen at init. *(May ship as a fast follow-on if it grows large; the seeding itself stands alone.)*
- **KEEP back-compat.** Existing configs using `specModel.planes+:` (append) or omitting `specModel` (schema defaults) resolve exactly as today; only new init OUTPUT changes. Legacy flat output stays byte-identical.

## Capabilities

### New Capabilities

- `plane-config-seeding`: `openspec init` seeds the selected planes as full, clean records into `config.yaml`'s authoritative `specModel.planes:` list, so config is the single source of truth for a project's plane set; editing the list is the dial (add to gain, remove to drop, empty to go flat).

### Modified Capabilities

- `cli-init`: On init, always write the selected planes as full `specModel.planes:` records (drop the "omit when selection equals schema defaults" shortcut); serialize clean records without picker-only fields.
- `cli-update`: Add an opt-in plane sync that offers to add schema-catalog planes missing from the project config, never applying them silently.
- `config-loading`: Document that a project-declared `specModel.planes:` list is authoritative — the resolved set equals it exactly, and removing an entry drops that plane regardless of the schema.

## Impact

- **CLI init**: `src/core/init.ts` (`createConfig` always seeds full records; remove `selectionIsSchemaDefault` shortcut), `src/core/config-prompts.ts` (`serializeConfig` emits clean plane records).
- **CLI update**: the update flow gains the opt-in plane-sync prompt.
- **Resolution**: `src/core/shared/skill-generation.ts` (`mergeProjectPlanes` / `resolveProjectSpecModel`) is unchanged — the `planes:` replace path is already authoritative; this change relies on it, it does not alter it.
- **Config files**: newly-initialized `openspec/config.yaml` files carry a full `specModel.planes:` list; existing configs are untouched.
- **Compatibility**: `planes+:` append and bare (schema-default) configs keep working; legacy flat output unchanged.
- **Builds on**: the merged design-system-plane / emergent-governance work (single offer-able plane list, derived `kind`).
