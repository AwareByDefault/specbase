## 1. Un-freeze the plane enum

- [x] 1.1 Replace `SPEC_PLANES = ['behavior','architecture'] as const` in `src/core/artifact-graph/types.ts` with a `PlaneSchema` (`{id, purpose, enforcementFlavor?, reviewLens?, crossCutting?}`) and an open `z.array(PlaneSchema)`; widen `SpecPlane` from a closed union to `string`
- [x] 1.2 Update `SpecModelSchema` so `planes` accepts the open `PlaneSchema` array instead of `z.enum(SPEC_PLANES)`; keep `LEGACY_SPEC_MODEL` with an empty plane array
- [x] 1.3 Generalize `src/core/schemas/governed-spec.schema.ts` `SpecPlaneSchema` from the closed enum to the open plane record
- [x] 1.4 Update `resolveSpecModel` and any `z.enum`/`Record<SpecPlane, …>` consumers to treat planes as a resolved array keyed by id

## 2. Default plane set and schema data

- [x] 2.1 Add `ops` and `code-quality` default plane records (with `purpose`, `enforcementFlavor`, `reviewLens`) to `schemas/spec-driven-governed/schema.yaml` `specModel.planes`, alongside the existing `behavior` and `architecture`
- [x] 2.2 Mark `enforcement` as a cross-cutting plane (`crossCutting: true`, no storage home) in the default lens set, keeping the existing `code-quality` lens
- [x] 2.3 Add an `ops` default lens to `src/core/governed/lenses.ts` `DEFAULT_LENSES` parallel to `behavioural`/`architectural`
- [x] 2.4 Add per-plane template examples `schemas/spec-driven-governed/templates/ops-spec.md` and `code-quality-spec.md` alongside the existing `behavioral-spec.md`/`architectural-spec.md`, clearly marked as default examples

## 3. Config: append and replace planes

- [x] 3.1 Extend the project config schema to accept `specModel.planes+` (append) and `specModel.planes:` (replace) in `openspec/config.yaml`
- [x] 3.2 Implement resolution: resolved planes = schema defaults (append) or the declared list (replace); one final array, no duplicates
- [x] 3.3 Surface resolved planes through `openspec config get specModel.planes`
- [x] 3.4 Add validation: kebab-case ids, no duplicate ids in the resolved set, `purpose` required, `enforcementFlavor` required, reserved words (`spec`, `specs`, `enforcement`) rejected, and append collisions with defaults rejected

## 4. Generate governed awareness from resolved planes

- [x] 4.1 Convert `GOVERNED_PRIMER` and the `GOVERNED_*_GUIDANCE` const strings in `src/core/templates/workflows/governed-guidance.ts` into functions of the resolved plane set (`buildGovernedGuidance(specModel)`)
- [x] 4.2 Interpolate each resolved plane's `id`, `purpose`, `enforcementFlavor`, and curated trigger list into the explore, propose, apply, verify, archive, and onboard guidance
- [x] 4.3 Keep the legacy flat prompt base byte-identical when `specModel.kind` is not `governed` (the existing `withGovernedGuidance` gate)
- [x] 4.4 Update `getSkillTemplates`/`getCommandTemplates` callsites in `src/core/init.ts` and `src/core/update.ts` to pass the resolved spec model so generation interpolates the project's planes
- [x] 4.5 Add `--regenerate` (or confirm that `openspec update` always regenerates from config) and ensure `openspec update` rewrites skill/command files to reflect the current plane roster
- [ ] 4.6 Add a drift flag to `openspec status` reporting when the resolved planes differ from a hash embedded in the generated skill file, suggesting `openspec update`

## 5. Curated trigger lists for the new defaults

- [x] 5.1 Write the `ops` trigger list (selection/run triggers: adopt/replace/remove a dependency, env, or infra resource) to the standard of the existing architectural structural-trigger list
- [x] 5.2 Write the `code-quality` trigger list (smell/quality triggers: ambient time, coupling, naming, test-shape) to the same standard
- [x] 5.3 Write the `behavior` outcome-trigger list and confirm the `architecture` structural-trigger list remains the curated reference
- [x] 5.4 Add a plane-agnostic classifier procedure to the generated explore guidance: "fetch `specModel.planes` from `openspec status --json`; match the claim to the plane whose `purpose` best fits" for user-added planes beyond the defaults

## 6. Generalize governed core to open planes

- [x] 6.1 Update `src/core/governed/discovery.ts` to iterate the resolved plane set (not `SPEC_PLANES`) for recursive pair discovery
- [x] 6.2 Update `src/core/governed/locator.ts` `isPlane`/locator parsing to validate the first segment against the resolved plane set rather than the closed enum
- [x] 6.3 Update `src/core/governed/spec-id-index.ts` to accept any declared plane id as a spec-ID prefix and reject unknown prefixes
- [x] 6.4 Update `src/core/governed/pair-resolver.ts` to resolve plane-qualified locators and stable spec IDs for arbitrary declared planes
- [x] 6.5 Update `src/core/artifact-graph/governed-coverage.ts` rollups from `Record<SpecPlane, …>` to a map keyed by declared plane id; omit planes with no specs

## 7. CLI surfaces

- [x] 7.1 `openspec status --json`: emit `specModel.planes` with each plane's `id`, `purpose`, `enforcementFlavor`, and optional `reviewLens`
- [x] 7.2 `openspec list --specs`: recursively discover pairs under every declared plane root; show plane-qualified locators
- [x] 7.3 `openspec show` / `openspec spec show`: resolve plane-qualified locators and stable spec IDs with arbitrary plane prefixes
- [x] 7.4 `openspec validate` / `openspec spec validate`: validate plane declarations, unknown plane roots, and unknown spec-ID prefixes
- [x] 7.5 `openspec init`: write the default plane set into the generated skills for governed projects
- [x] 7.6 `openspec update`: regenerate governed skill/command files from the current resolved plane set; legacy projects stay byte-identical

## 8. Tests and parity

- [x] 8.1 Add tests that the legacy flat workflow output is byte-identical before and after the change
- [x] 8.2 Add tests that a governed two-plane project resolves identically to the prior snapshots (the four-default set is a superset)
- [x] 8.3 Add tests for a governed project with a user-appended plane (`security`) and a replaced plane set
- [x] 8.4 Add tests for plane-declaration validation: non-kebab id, duplicate id, missing purpose, reserved word, append collision
- [x] 8.5 Add tests that generated explore guidance contains the four default planes' trigger lists and the plane-agnostic procedure for the tail
- [x] 8.6 Add cross-platform path tests using `path.join` for nested locators under non-default planes on macOS, Linux, and Windows CI