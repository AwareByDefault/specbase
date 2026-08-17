## Context

Governed pairs currently store enforcement as Markdown containing one authoritative fenced YAML document. A binding repeats an ID, mechanism, evidence strength, lifecycle status, targets, command vector or procedure, and limitations. Core parses the YAML but does not execute the command; generated agent workflows interpret the remaining fields.

The format mixes four owners: Specbase owns claim-to-evidence relationships, source files own assertions or procedures, native project tooling owns execution, and verification receipts own results. It also hardcodes six mechanism names even though projects need domain-specific kinds such as `nix-check`, `nixos-vm-test`, or `live-probe`.

## Goals / Non-Goals

**Goals:**
- Make a binding a typed edge containing exactly `type`, `covers`, and `source`.
- Store the machine contract directly in `enforcement.yaml`.
- Make enforcement types open schema/config data with project replace/append resolution like planes.
- Keep stable binding identity as the YAML map key.
- Let the source artifact own assertions, procedures, execution details, and limitations.
- Preserve the change-time definition of planned enforcement in proposal, design, and task artifacts before the source exists.
- Preserve coverage, drift, source-resolution, review routing, and generated guidance using resolved type metadata.
- Provide a migration path for existing `enforcement.md` projects.

**Non-Goals:**
- Build a universal test runner or encode framework-specific commands in Specbase.
- Infer whether a referenced test semantically proves a claim without review.
- Store verification receipts in `enforcement.yaml`.
- Change legacy flat-spec parsing.

## Decisions

### D1: Direct YAML with a compact binding map

The current pair member becomes `enforcement.yaml`:

```yaml
bindings:
  utility-packages:
    type: nix-check
    covers: utility-packages-enabled
    source: checks/nas/utility-packages.nix
```

The sibling `spec.md` and containing locator establish pair identity, so the manifest does not repeat `version` or `spec`. The project schema selects the document grammar. A binding map key is its pair-local stable ID; each value has exactly the three normative fields. `covers` accepts a scalar requirement ID or a list and normalizes to a list. Scenario coverage derives from requirement coverage.

### D2: Open enforcement types in the resolved spec model

The schema offers enforcement type records under `specModel.enforcement.types`. Project config supports `types:` replacement and `types+:` append semantics. Each type declares:

```yaml
- id: nix-check
  purpose: Deterministic assertions over evaluated Nix state; use for configuration truth.
  strength: automated
  sourceKind: file
```

Type IDs are open kebab-case data. `strength` remains a small core evidence classification (`automated`, `review`, `manual`, `unenforced`) so coverage and review routing remain deterministic. `sourceKind` remains a small resolver capability (`file`, `lens`) so validation knows how to check the source without understanding the project-specific type ID.

The governed schema ships curated defaults equivalent to the current mechanisms, but projects may replace or extend them. Invalid or duplicate project declarations degrade to schema defaults with actionable warnings, matching plane resolution.

### D3: Source owns mechanism details

A `file` source is a project-relative path with an optional `#selector`. Validation resolves the path before the selector and checks that it remains inside the project. A `lens` source resolves against the configured review lens roster. One binding has one source; multiple evidence artifacts use multiple bindings.

Inline `run`, `targets`, `procedure`, `review`, `rationale`, `limitations`, `status`, `strength`, `mechanism`, `lens`, and `covered_by` fields disappear. Planned evidence remains a task until its source exists. Review residue is derived from sibling automated bindings covering the same requirement rather than manually enumerated.

### D4: Coverage and execution are separate states

Coverage means a requirement has a structurally valid binding to a resolvable source. It does not mean that source ran or passed. Generated verification guidance follows the source into the repository's native harness, records execution separately when it can run the evidence, and reports unexecuted evidence honestly. Correspondence between source and claim remains review-strength judgment.

### D5: Transitional reader, new writer

Discovery prefers `enforcement.yaml` and accepts `enforcement.md` only as a legacy fallback during migration. A directory containing both is invalid. The legacy parser remains available long enough for existing stores and archived changes, while templates, init, generated guidance, and new changes write YAML. Archive normalizes touched current pairs to YAML. A migration command is not required for this slice; normal on-touch conversion plus a repository migration covers shipped content.

### D6: Planning artifacts own the pre-implementation enforcement definition

Removing the definition from the permanent manifest does not remove it from the change. The three planning artifacts carry progressively more concrete enforcement intent:

- `proposal.md` names each durable truth, planned type, planned source, and the outcome the source must establish.
- `design.md` defines the source contract: assertions or observations, fixtures/environment, native harness, failure signal, and known boundary.
- `tasks.md` contains separate work to implement or update each source, add the compact manifest link, run it through its native harness, and record the result.

This is deliberate temporal separation, not duplication. The proposal is the commitment, design is the implementation contract, tasks are the delivery checklist, `enforcement.yaml` is the durable graph edge, and the source is the executable or procedural truth.

## Enforcement design

### Compact YAML parser and pair discovery

**Source:** `test/core/governed/enforcement-yaml.test.ts`
**Type:** `test`
**Covers:** compact manifest shape, pair identity, legacy fallback, and dual-file conflict.

The suite must demonstrate that direct YAML parses without Markdown fences; binding map keys become stable IDs; scalar and list `covers` normalize identically; only requirement IDs are accepted; extra legacy fields are rejected; `enforcement.yaml` is preferred over a lone legacy file; and both filenames produce an ambiguity diagnostic. It runs under Vitest and fails through ordinary assertions. It does not judge whether a referenced source semantically proves its requirement.

### Enforcement type resolution

**Source:** `test/core/governed/enforcement-types.test.ts`
**Type:** `test`
**Covers:** schema defaults, project replacement, project append, type validation, and safe degradation.

The suite must construct schema and project configurations with default and custom type records. It must assert ordered resolution, unique kebab IDs, required purposes, closed evidence strengths and source kinds, omission under replacement, inclusion under append, and fallback to defaults for ambiguous, malformed, or duplicate declarations. It must also prove the resolved model—not the schema name—is passed to downstream consumers.

### Coverage, drift, and source validation

**Sources:** `test/core/governed/coverage.test.ts`, `test/core/artifact-graph/governed-coverage.test.ts`, and `test/core/governed/target-validation.test.ts`
**Type:** `test`
**Covers:** derived strength, requirement-level scenario inheritance, unknown types, stale bindings, broken sources, escaping sources, lens sources, and retired-source candidates.

Fixtures must use compact bindings and resolved type records. Assertions must prove that structural coverage is present only for a valid type/source relation; every scenario under a covered requirement inherits coverage; scenario edits do not stale bindings; file selectors resolve the path portion; lens sources resolve against the lens roster; and linkage never implies an execution pass.

### Native-harness verification guidance

**Source:** `test/core/templates/governed-guidance.test.ts`
**Type:** `test`
**Covers:** separation of linkage, execution, and correspondence.

The suite must assert that generated verify/apply/archive guidance starts from compact bindings, follows each source into the repository's native harness, reports unavailable execution honestly, and preserves semantic-correspondence review. It must reject the former command-vector, planned-status, target, and inline-procedure instructions.

### Planning-artifact enforcement definitions

**Source:** `test/core/templates/enforcement-planning.test.ts`
**Type:** `test`
**Covers:** proposal, design, and task template responsibilities.

The suite must assert that the governed proposal template asks for planned type, source, covered truth, and intended proof; the design template asks for source behavior, harness/environment, failure signal, and boundary; and the tasks template asks separately to implement the source, link it from `enforcement.yaml`, execute it, and record the result. Generated authoring guidance must preserve those responsibilities without copying execution detail back into the permanent manifest.

### Resolved roster projection

**Source:** `test/governed-guidance-projection.test.ts`
**Type:** `test`
**Covers:** custom type pedagogy and absence of a frozen mechanism roster.

The suite must generate every governed skill and command surface from a model containing a synthetic custom type and from a replacement roster omitting a default. It must assert that authoring surfaces contain the custom ID and purpose, omit removed IDs, and show the compact three-field binding shape.

### Current-store and template migration

**Sources:** existing schema-template, baseline-planting, discovery, archive, and strict-validation suites.
**Type:** `test`
**Covers:** new writers emit YAML, touched pairs normalize to YAML, and shipped examples remain valid.

Migration assertions must inspect actual generated files rather than string constants alone. Historical Markdown fixtures remain only where they prove the fallback reader.

## Risks / Trade-offs

- **[Large migration surface]** -> Keep a legacy reader, migrate templates and current pairs mechanically, and add mixed-format fixtures.
- **[A source path does not prove semantic correspondence]** -> Keep correspondence as a separate review concern; never call a valid link an executed proof.
- **[Custom type names reduce ecosystem uniformity]** -> Preserve fixed strength and source-kind capabilities while leaving public mechanism vocabulary open.
- **[Removing inline commands prevents direct generic execution]** -> Native test harnesses own execution; generated verification follows project conventions and reports when it cannot execute a source.
- **[Both filenames create ambiguity]** -> Prefer neither silently; validation reports a conflict when both exist.
- **[Dirty repository already contains related governed-parser work]** -> Make targeted edits, preserve unrelated work, and validate focused suites before the full suite.

## Migration Plan

1. Add enforcement type records to the schema model, project config parser, and resolved model.
2. Add compact YAML binding schemas and parser while retaining the legacy Markdown reader.
3. Update discovery, coverage, drift, diagnostics, show/list/context, and archive merge to use `enforcement.yaml` and resolved type metadata.
4. Update templates, baseline planting, generated guidance, documentation, and fixtures.
5. Convert current governed pairs and active change deltas mechanically to compact YAML where safe; retain dated legacy archives as historical input fixtures when needed.
6. Run focused parser/config/discovery/archive/guidance tests, then the full suite and strict Specbase validation.

Rollback keeps the legacy reader and can restore Markdown templates and discovery preference without changing legacy flat specs.
