## 1. Schema: unified plane list + design-system record

- [x] 1.1 Merge `planes:` and `optionalPlanes:` in `schemas/spec-driven-governed/schema.yaml` into one list; add `defaultSelected` to every plane record (core four `true`; `agents` `false`).
- [x] 1.2 Add the `design-system` plane record: `purpose`, `enforcementFlavor: "token-lint / contrast + a11y checks + design review"`, `reviewLens: design`, `defaultSelected: false`.
- [x] 1.3 Update the governed schema's `specModel` schema (`src/core/schemas/governed-spec.schema.ts`) to accept the unified list with `defaultSelected` and drop the `optionalPlanes` field.

## 2. Resolution and config loading

- [x] 2.1 Update schema resolution (`src/core/schemas/…`, `schema-resolution` consumers) to expose one offered-plane list with `defaultSelected`; remove the resolved/optional split.
- [x] 2.2 Derive `specModel.kind` from the resolved plane count in config loading (`src/core/project-config.ts`, `config-loading`): non-empty → `governed`, empty → `flat`; a stale/explicit `kind` never overrides the derivation.
- [x] 2.3 Preserve `planes+:` append and `planes:` replace semantics against the unified offered list.

## 3. Init plane picker

- [x] 3.1 Replace the governed yes/no prompt and the separate agentic-review opt-in in `src/core/init.ts` / `src/core/config-prompts.ts` with one multi-select plane picker.
- [x] 3.2 Add a select-all toggle; initialize each plane's checked state from `defaultSelected`.
- [x] 3.3 Write the selected plane set and derived `kind` into the project config; on zero selections produce a legacy flat project with no plane roster.
- [x] 3.4 Plant baseline specs only for selected planes; ensure `agents/spec-driven` plants only when `agents` is selected.

## 4. Design review lens

- [x] 4.1 Add the `design` lens to `DEFAULT_LENSES` in `src/core/governed/lenses.ts` (`scope: 'design-system'`, `crossCutting: false`, the design question).
- [x] 4.2 Verify default-lens routing resolves a `design-system/` pair with no declared lens to `design`.

## 5. Template and guidance

- [x] 5.1 Add `schemas/spec-driven-governed/templates/design-system-spec.md` showing the DESCRIBE direction, both strata (tokens + voice), stable-identity frontmatter, and one `ADDED Requirement` per stratum.
- [x] 5.2 Confirm `src/core/templates/workflows/governed-guidance.ts` interpolates `design-system` from resolved planes with no static-string edits needed; adjust if a plane is hard-coded anywhere.

## 6. Tests

- [x] 6.1 Schema/resolution test: unified plane list exposes `defaultSelected`; `design-system` record present; no `optionalPlanes`.
- [x] 6.2 Config-loading test: derived `kind` for non-empty and empty plane sets; legacy config with explicit `kind: governed` + planes resolves identically.
- [x] 6.3 Init test: picker renders offered planes with correct pre-check state; select-all toggles all; zero selection → flat; baseline planting gated per plane.
- [x] 6.4 Lens test: `design` lens present in `DEFAULT_LENSES`; `design-system/*` routes to it by default.
- [x] 6.5 Flat-output parity test: a project resolving zero planes produces byte-identical legacy flat output.

## 7. Docs and dogfood

- [x] 7.1 Update `openspec-conventions` guidance text (generated/authored) to describe the design-system plane and emergent governance.
- [x] 7.2 Run `openspec validate --strict` on this change and fix any spec/format issues.
