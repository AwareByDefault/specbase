## 0. Governed-model prompt at init (default constant unchanged)

- [x] 0.1 Add a "use the governed model?" prompt to `openspec init`; on yes, write `schema: spec-driven-governed` into the project `config.yaml`. Leave the global `DEFAULT_SCHEMA` constant flat.
- [x] 0.2 On no, produce the flat `spec-driven` setup byte-identical to today (parity test)
- [x] 0.3 Gate the agentic-tooling / agentic-review prompts on a yes to the governed prompt

## 1. Offer-able agents plane record (optionalPlanes)

- [x] 1.1 Add an `optionalPlanes:` key to `schemas/spec-driven-governed/schema.yaml` holding the `agents` record (`id: agents`, `purpose`, `enforcementFlavor: "instrument conforms to its spec (config / lens / frontmatter / hook checks)"`, no `reviewLens`)
- [x] 1.2 Surface `optionalPlanes` through schema resolution as structured data alongside `planes`; confirm the resolved default set (behavior/architecture/ops/code-quality) is unchanged
- [x] 1.3 Validate that appending `agents` via `specModel.planes+:` resolves cleanly through the existing plane resolution (kebab id, unique, has purpose/enforcementFlavor)

## 2. Init prompts and config append

- [x] 2.1 Add the agentic-tooling prompt to governed `openspec init`; on accept, append the `agents` record from `optionalPlanes` to `openspec/config.yaml` under `specModel.planes+:`
- [x] 2.2 Add the agentic-review sub-prompt, gated on the plane being enabled
- [x] 2.3 On decline of the agentic-tooling prompt, leave `config.yaml` and the resolved plane set unchanged (parity test)

## 3. Baseline spec planting

- [x] 3.1 Add the plant-baseline-specs step to `init`: write `specs/agents/spec-driven/` (spec + enforcement) whenever the plane is enabled
- [x] 3.2 Plant `specs/agents/review-panel/` (spec + enforcement) only when agentic review is accepted
- [x] 3.3 Make planting idempotent: never overwrite an existing baseline spec the user has customized; write directly under `specs/agents/` with no `openspec/changes/` entry

## 4. Baseline spec authoring

- [x] 4.1 Author the `spec-driven` baseline spec: declares the repo practices spec-driven development via opsx and that `config.yaml` declares the resolved plane roster
- [x] 4.2 Author the `spec-driven` enforcement: `command` binding asserting `openspec validate` passes plus a check that the resolved roster matches the spec
- [x] 4.3 Author the `review-panel` baseline spec against the resolved lenses (the panel is the lens set judging the governed planes), keyed to `src/core/governed/lenses.ts`
- [x] 4.4 Author the `review-panel` enforcement: `test` binding asserting the resolved lens set conforms to the lenses the spec declares

## 5. Conventions

- [x] 5.1 Extend the governed conventions with the `agents` plane: instruments-not-behavior membership and its opt-in, per-project nature
- [x] 5.2 Document the spec↔operational-artifact conformance pattern (existing mechanisms only) and the DESCRIBE-not-generate direction
- [x] 5.3 Document the init-scaffold exception and that later baseline edits use the change flow

## 6. Dogfood and verification (in a governed test project)

- [x] 6.1 In a governed test project (`test-project-2/` or the cohorts webapp), run `openspec init` and enable the `agents` plane + agentic review
- [x] 6.2 Confirm the planted `specs/agents/spec-driven/` and `specs/agents/review-panel/` (spec + enforcement) are written directly, with no `openspec/changes/` entry
- [x] 6.3 Add and run the lens-conformance test against the resolved `DEFAULT_LENSES`; confirm it passes
- [x] 6.4 Run `openspec validate` in the test project and confirm the `spec-driven` baseline's binding passes
- [x] 6.5 Verify flat `spec-driven` projects produce byte-identical output, and governed projects that decline the plane get no `agents` plane
- [x] 6.6 Re-run `openspec init` in the test project and confirm customized baseline specs are not overwritten (idempotence)
