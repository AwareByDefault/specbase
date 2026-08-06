## 1. Seed clean plane records at init

- [x] 1.1 Update `serializeConfig` in `src/core/config-prompts.ts` to emit clean `specModel.planes:` records — strip `defaultSelected` and omit `crossCutting: false` — writing `id`, `purpose`, `enforcementFlavor`, and `reviewLens` when present.
- [x] 1.2 Update `createConfig` in `src/core/init.ts` to always set `config.specModel = { planes: selection.planes }` for a governed (non-empty) selection; remove the `selectionIsSchemaDefault` shortcut and helper.
- [x] 1.3 Confirm a zero-plane selection still writes a flat config with no `specModel.planes:` list.

> Opt-in plane sync on `openspec update` is DEFERRED to a follow-on change
> (`sync-catalog-planes-on-update`): it must mutate an existing `config.yaml`
> without dropping the user's `context`/`rules`/comments, which needs a
> YAML-preserving editor `serializeConfig` does not provide. Seeding stands alone.

## 2. Tests

- [x] 2.1 Init test: default selection writes an explicit `specModel.planes:` list; records are clean (no `defaultSelected`, no `crossCutting: false`).
- [x] 2.2 Resolution test: a seeded config resolves to exactly its listed planes; removing a plane record drops it from the resolved set even though the schema still declares it.
- [x] 2.3 Resolution test: emptying `specModel.planes:` resolves to the flat/legacy model.
- [x] 2.4 Back-compat test: `planes+:` append and bare (no `specModel`) configs resolve exactly as before; legacy flat init output is byte-identical.

## 3. Verify

- [x] 3.1 Run the full test suite and build; fix any fallout.
- [x] 3.2 Run `openspec validate seed-planes-into-config --strict` and resolve any issues.
