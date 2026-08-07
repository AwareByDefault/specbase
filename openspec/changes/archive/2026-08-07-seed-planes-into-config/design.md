## Context

Emergent-governance init resolves a project's plane set from the schema's single offer-able list (`defaultSelected` subset) merged with config overrides (`planes+:` append, `planes:` replace) in `mergeProjectPlanes`. Today init only writes `specModel.planes:` when the selection differs from the schema defaults (`selectionIsSchemaDefault` shortcut in `createConfig`), so a default project's config omits its planes and inherits them from the schema. That split — some planes in config, some implicit in the schema — is what this change removes.

## Goals / Non-Goals

**Goals**
- `config.yaml` is the single authoritative source for a project's planes.
- Editing the `planes:` list is the only dial: add to gain, remove to drop, empty to go flat.
- No change to resolution semantics or to existing configs.

**Non-Goals**
- No change to `mergeProjectPlanes` resolution logic — the `planes:` replace path is already authoritative; this change only changes what init *writes*.
- No migration of existing configs (they keep resolving as-is).
- No auto-application of catalog planes on update (offer only).

## Decisions

- **Always seed via `planes:` (replace), not `planes+:` (append).** Replace is the only mode where the resolved set equals the config list exactly, which is what makes "delete a line to drop a plane" work. Append can never subtract a schema default, so it cannot be authoritative. Drop the `selectionIsSchemaDefault` shortcut and always serialize the full selected set.
- **Seed clean records.** `defaultSelected` is a picker-only concept (initial checkbox state) and is meaningless in a resolved config; `crossCutting` defaults to false. `serializeConfig` strips both, writing `id`, `purpose`, `enforcementFlavor`, and `reviewLens` (when present). Resolution already tolerates missing `defaultSelected` (treated as selected) and missing `crossCutting` (defaults false), so clean records round-trip.
- **Schema stays as catalog, not default source.** The init picker still reads the schema's offered list to render its menu, and `openspec update` reads it to find planes the config lacks. What changes is that a seeded project's *resolved* set no longer flows from the schema — it flows from config.
- **Update sync is offer-only.** Auto-adding a new governed plane on a library bump would silently expand a project's governance surface (and its coverage gaps). Update instead reports catalog planes missing from config and offers to add them; declining leaves config untouched. This may land as a fast follow-on if it grows; the seeding stands alone.

## Risks / Trade-offs

- **[Verbose config]** A seeded config is longer (~all planes with multi-line purposes) than today's compact file. Accepted — it is the cost of legibility, and the file is the source of truth users are meant to read and edit.
- **[Frozen plane metadata]** Seeded records no longer pick up improved `purpose`/`enforcementFlavor` wording from schema upgrades. Low stakes (prompt-flavor text); the update sync can offer refreshes later if wanted.
- **[Removing a plane orphans its specs]** Dropping a plane from config leaves any `specs/<plane>/…` on disk undiscovered, not deleted. This is existing behavior of the replace path; documented, not changed here.

## Migration Plan

1. `serializeConfig`: emit clean `planes:` records (strip `defaultSelected`, `crossCutting: false`).
2. `createConfig`: always set `config.specModel = { planes: selection.planes }` for a governed selection; remove `selectionIsSchemaDefault`.
3. Add the opt-in plane sync to the update flow (or split to a follow-on).
4. Tests: seeded-config resolution equals the selection; removing a plane drops it; empty → flat; back-compat for `planes+` and bare configs; serialized records are clean.

## Open Questions

- Should `openspec update` also offer to refresh drifted `purpose`/`enforcementFlavor` text on already-listed planes, or only add missing planes? Add-only for this change.
