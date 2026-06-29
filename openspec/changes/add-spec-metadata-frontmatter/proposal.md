## Why

OpenSpec is evolving from spec-driven development into spec-driven development **with AI guardrails**: specs should carry not just intent but how that intent is enforced, and should distinguish ephemeral *features* from durable *codebase invariants*. Two upcoming capabilities depend on this — requirement enforcement/coverage and the feature/invariant type system — and both need the same thing that does not exist today: a structured, machine-readable metadata home on a spec.

Today a requirement is identified only by its prose name (`normalizeRequirementName`). The change system's `## RENAMED Requirements` operation makes that name explicitly **mutable**, so any external mapping keyed by name (e.g. an enforcement file) is drift-prone by construction. Specs also have no way to declare what *kind* of spec they are.

Rather than invent two bespoke mechanisms later, this change introduces one substrate now: **YAML frontmatter on `spec.md`** carrying stable requirement IDs, a spec `type`, and free-form `labels`.

## What Changes

- Add an optional YAML frontmatter block at the top of `spec.md`, parsed into `Spec.metadata`.
- Introduce a **stable `id` per requirement** that is independent of the requirement's prose name. The name remains the human label; the id is the durable anchor that enforcement and provenance bind to.
- Add a `type` field (`feature` | `invariant`, default `feature`) and a free-form `labels` array (e.g. `invariant.security`). This change only *reserves and validates* the field; behavior of invariants is delivered in a later change.
- Backward compatible: a spec with no frontmatter parses exactly as today, defaulting to `type: feature` with ids derived from requirement order.
- Validation (extends `cli-validate`): requirement ids unique within a spec; `type` is `feature`, `invariant`, or a dotted sub-label thereof.

## Capabilities

### New Capabilities

- `spec-metadata`: Structured frontmatter on specs carrying stable requirement IDs, spec type, and labels, parsed into the spec model and surfaced in `--json` output.

### Modified Capabilities

- `cli-validate`: Validate requirement id uniqueness and the `type`/`labels` fields when frontmatter is present.

## Impact

- `src/core/schemas/base.schema.ts` — add optional `id` to `RequirementSchema`.
- `src/core/schemas/spec.schema.ts` — extend `metadata` with `type` and `labels`; parse frontmatter.
- `src/core/parsers/markdown-parser.ts` / `requirement-blocks.ts` — parse frontmatter and per-requirement id markers; preserve them through delta operations.
- `src/core/validation/*` — id-uniqueness and type validation.
- Open design decision (see design.md): where the requirement id physically lives (inline header marker vs. frontmatter map).
