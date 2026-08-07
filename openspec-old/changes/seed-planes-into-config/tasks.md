## 1. Seed clean plane records at init

- [ ] 1.1 Update `serializeConfig` in `src/core/config-prompts.ts` to emit clean `specModel.planes:` records — strip `defaultSelected` and omit `crossCutting: false` — writing `id`, `purpose`, `enforcementFlavor`, and `reviewLens` when present.
- [ ] 1.2 Update `createConfig` in `src/core/init.ts` to always set `config.specModel = { planes: selection.planes }` for a governed (non-empty) selection; remove the `selectionIsSchemaDefault` shortcut and helper.
- [ ] 1.3 Confirm a zero-plane selection still writes a flat config with no `specModel.planes:` list.

## 2. Opt-in plane sync on update

- [ ] 2.1 In the `openspec update` flow, compute the schema catalog planes absent from the project config's resolved plane set.
- [ ] 2.2 Offer to add each missing catalog plane (interactive prompt); on accept, append its clean record to the config `planes:` list; on decline, leave the config unchanged.
- [ ] 2.3 Make the sync a no-op (no prompt, no change) when the config already lists every catalog plane.

## 3. Tests

- [ ] 3.1 Init test: default selection writes an explicit `specModel.planes:` list; records are clean (no `defaultSelected`, no `crossCutting: false`).
- [ ] 3.2 Resolution test: a seeded config resolves to exactly its listed planes; removing a plane record drops it from the resolved set even though the schema still declares it.
- [ ] 3.3 Resolution test: emptying `specModel.planes:` resolves to the flat/legacy model.
- [ ] 3.4 Back-compat test: `planes+:` append and bare (no `specModel`) configs resolve exactly as before; legacy flat init output is byte-identical.
- [ ] 3.5 Update test: a catalog plane missing from config is offered and added on accept, left out on decline; no prompt when nothing is missing.

## 4. Verify

- [ ] 4.1 Run the full test suite and build; fix any fallout.
- [ ] 4.2 Run `openspec validate seed-planes-into-config --strict` and resolve any issues.
