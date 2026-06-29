## Why

A spec captures *intent* but says nothing about how that intent is *enforced*. We want to map each requirement to the thing that proves it — a unit test, a lint rule, a type, a CI job, or a human attestation — so that intent becomes traceable to enforcement. This is the data model behind `openspec coverage` (delivered in a follow-up change).

The hard part is avoiding a test-factory: a naive "one test per requirement" model causes test bloat. The design deliberately makes enforcement records **references** with a **many-to-many** relationship, so one integration test can cover several requirements and coverage counts *satisfied intent*, not *tests written*.

Depends on `add-spec-metadata-frontmatter` for stable requirement ids (the binding anchor).

## What Changes

- Introduce an **enforcement record** schema: a tagged union over `kind ∈ {test, lint, type, ci, manual}`, each with kind-specific fields, plus an `enforces: [requirementId...]` array (many-to-many).
- Define the **storage location**: enforcement records live in the spec's frontmatter under an `enforcement:` key, bound to requirements by id (not name). A paired-file option is documented in design.md but not adopted for v1.
- Define **resolution depth** as a property of each kind: `declared` (mapping exists), `resolvable` (the referenced test/rule can be located), and — for runnable kinds — eligibility for `run` verification (executed by the coverage command later).
- `manual` enforcement is *attestable* but never *verifiable*; it carries an owner and a rationale.
- Validation: every `enforces` id resolves to a requirement in the same spec; `kind`-specific required fields are present.

## Capabilities

### New Capabilities

- `enforcement-model`: The schema and binding rules for enforcement records that map requirements (by id) to tests, lint rules, types, CI jobs, or manual attestations, with explicit many-to-many semantics and resolution depth.

### Modified Capabilities

- `cli-validate`: Validate enforcement records — id resolution, kind-specific required fields, and a warning for requirements with an unusually high enforcement count (over-enforcement smell).

## Impact

- `src/core/schemas/` — new `enforcement.schema.ts`; reference it from the spec metadata schema.
- `src/core/parsers/` — parse the `enforcement:` frontmatter block.
- `src/core/validation/` — id resolution + kind field validation + over-enforcement warning.
- No code is *executed* by this change; running enforcements is scoped to the coverage command.
