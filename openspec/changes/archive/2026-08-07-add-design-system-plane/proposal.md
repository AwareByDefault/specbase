## Why

Governed projects can now carry an arbitrary, project-owned plane taxonomy, but the model has no home for a product's *expressed identity* — its visual design tokens, design principles, and the voice/tone of user-facing copy — even though that identity is exactly the kind of durable truth that drifts silently and benefits from paired enforcement. At the same time, `openspec init` still gates governance behind a binary "governed?" prompt plus bolted-on opt-ins (agentic review), which no longer fits a world where planes are the real unit of opt-in. Both gaps resolve together: make governance emergent from plane selection, and add the design-system plane as one of the planes on offer.

## What Changes

- **Reframe `openspec init` as a plane picker (BREAKING to the init prompt flow).** Replace the binary governed-yes/no prompt and the separate agentic-review opt-in with ONE multi-select of the offered planes, with a select-all toggle at the top. The core four (`behavior`, `architecture`, `ops`, `code-quality`) are pre-checked; `design-system` and `agents` are offered unchecked.
- **Make governance emergent.** Zero planes selected → the project stays legacy **flat**; one or more selected → the project is **governed**. `specModel.kind` is no longer user-set; it is **derived** from the resolved plane count.
- **Collapse the schema's `planes:`/`optionalPlanes:` split** into one offer-able plane list. Each plane record carries a `defaultSelected` boolean (core four = `true`; `design-system`, `agents` = `false`); the init picker reads it for pre-check state and select-all toggles all.
- **Add the `design-system` plane.** Its members are durable truths about the product's expressed identity — visual design tokens (color, type, spacing, radius, motion), design principles, and the voice/tone of user-facing copy. It governs HOW outcomes are presented, orthogonal to `behavior` (WHAT they do), with the same two-strength shape as `code-quality`: deterministic checks for what a tool can verify, review for the residue.
- **Establish the design-system enforcement pattern (DESCRIBE, two strata).** Token truths (`design-system/tokens/…`) DESCRIBE the token artifact (`tailwind.config`, `tokens.json`) — which stays the runtime source of truth — and bind lint / contrast / a11y checks against it. Principle and voice truths (`design-system/voice/…`) bind to a new `design` review lens for the judgment a linter cannot make. The spec asserts invariants about the tokens; it does not master the palette.
- **Add a `design` review lens** to `DEFAULT_LENSES`, scoped to `design-system`, asking "Does the UI and copy honor the design tokens, principles, and voice?"
- **Ship a `design-system-spec.md` per-plane template** alongside the existing plane templates, showing the DESCRIBE pattern and both strata.
- **Consequence handled:** the agents plane's self-host `spec-driven` spec was auto-planted whenever a project became governed. With agents now a plain checkbox, that baseline spec plants only when `agents` is selected; the project `config.yaml` plane roster remains the authoritative governance record regardless.
- **KEEP legacy flat output byte-identical** and existing governed projects untouched until their config is re-resolved; the derived-`kind` and picker changes are additive to the resolved-plane machinery.

## Capabilities

### New Capabilities

- `design-system-plane`: An offered governed plane whose members are durable truths about a product's expressed identity — visual tokens, design principles, and copy voice/tone. Defines plane membership, the two strata (tokens via DESCRIBE + automated checks; voice/principles via the design review lens), the `design` lens, and the per-plane template.
- `plane-selection-governance`: Governance emerges from plane selection rather than a binary gate. Defines the unified init plane picker (select-all + per-plane `defaultSelected`), the derivation of `specModel.kind` from the resolved plane count, and the zero-planes-means-flat rule.

### Modified Capabilities

- `cli-init`: Present the offered planes as one multi-select picker with select-all; write the selected plane set (and derived `kind`) into the project config; plant baseline specs only for selected planes.
- `config-loading`: Derive `specModel.kind` from the resolved plane set; load the single offer-able plane list with `defaultSelected` and append-vs-replace semantics.
- `schema-resolution`: Resolve the collapsed single plane list (with `defaultSelected`) instead of a `planes`/`optionalPlanes` split.
- `openspec-conventions`: Define the `design-system` plane's meaning and authoring rules (identity-not-behavior membership, the two strata, the DESCRIBE direction) and document that governance is emergent from plane selection.

## Impact

- **Schema data**: `schemas/spec-driven-governed/schema.yaml` — merge `planes`/`optionalPlanes` into one list, add `defaultSelected` per plane, add the `design-system` plane record (`purpose`, `enforcementFlavor`, `reviewLens: design`).
- **CLI init**: `src/core/init.ts`, `src/core/config-prompts.ts` — plane-picker prompt, select-all, derived `kind`, per-plane baseline planting.
- **Config**: `src/core/project-config.ts` / config-loading — `kind` derivation from resolved planes; single-list resolution.
- **Lenses**: `src/core/governed/lenses.ts` — add the `design` lens to `DEFAULT_LENSES`.
- **Prompt generation**: `src/core/templates/workflows/governed-guidance.ts` — plane-aware guidance already reads resolved planes; picks up `design-system` automatically.
- **Templates**: new `schemas/spec-driven-governed/templates/design-system-spec.md`.
- **Compatibility**: legacy flat output stays byte-identical; existing governed configs keep working; `design-system` and `agents` remain opt-in.
- **Builds on**: `generalize-spec-planes` (planes-as-data) and `add-agents-plane` (DESCRIBE pattern, optional-plane-at-init).
