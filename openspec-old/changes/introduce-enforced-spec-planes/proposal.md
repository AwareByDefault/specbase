## Why

OpenSpec preserves behavioral requirements but leaves architectural truth and verification ownership scattered across design documents, tests, linters, and generated skills. Projects such as Kairos already maintain these pieces manually. An opt-in governed workflow can make behavioral and architectural truth first-class and expose stale or missing enforcement without replacing OpenSpec's core model or changing legacy projects.

## What Changes

- Introduce an opt-in governed spec model with two permanent planes: `behavior/` for observable capabilities and `architecture/` for current packages, responsibilities, boundaries, and structural invariants.
- Support nested, plane-qualified spec locators without implicit inheritance; directories organize specs but do not automatically become specs.
- Pair every governed `spec.md` with an `enforcement.md` contract that maps requirements or scenarios to automated checks, structured review, or explicitly justified manual evidence.
- Give each governed spec a project-unique stable ID; give its requirements and scenarios stable IDs scoped to that spec; and give enforcement bindings stable IDs scoped to their paired enforcement file.
- Detect both directions of drift: bindings that cover removed requirements or scenarios become stale enforcement, while missing targets or failing declared checks leave normative claims hanging.
- Report retired binding targets as cleanup candidates when requirements, scenarios, or bindings are removed; never delete tests, lint rules, or other project code automatically.
- Extend discovery, list, show, validation, sync, archive, and JSON output to understand recursive governed spec pairs while preserving the legacy flat path.
- Validate the complete governed pair before synchronization and refuse partial spec-only or enforcement-only promotion.
- Update generated OPSX skills and command templates so explore, propose, continue, fast-forward, update, apply, verify, sync, archive, bulk archive, and onboard understand both planes, stable identity, and the enforcement lifecycle.
- Use declared enforcement coverage and commands as the primary governed verification map while retaining honest review/manual classifications.
- Add an opt-in governed workflow/schema for real-project pilots before considering migration of the default flat behavior-only workflow.
- **BREAKING (governed mode only)**: governed spec locators, change delta paths, metadata, validation, and archive semantics differ from the legacy flat capability layout.

This first version deliberately excludes cross-spec relationship graphs, generated context closure, inheritance, a standalone architecture-review command, a general-purpose task runner, filesystem rollback transactions, and automatic legacy migration.

## Capabilities

### New Capabilities

- `spec-planes`: Opt-in behavioral and architectural spec types, stable scoped identities, nested locators, recursive discovery, and current-truth/history boundaries.
- `spec-enforcement`: Paired enforcement contracts, requirement/scenario coverage, stale-binding and missing-target detection, evidence-strength classification, and pair-coherent synchronization.
- `enforced-spec-workflow`: Cross-skill agent behavior for authoring, applying, verifying, syncing, and archiving governed specs and their enforcement.

### Modified Capabilities

- `openspec-conventions`: Define governed project structure, type-specific authoring rules, stable scoped identity, delta placement, and the distinction between current architecture and archived rationale.
- `cli-artifact-workflow`: Expose governed specification and enforcement artifact paths through schema-driven status and instructions.
- `cli-list`: Recursively discover and display plane-qualified governed specs and enforcement coverage.
- `cli-show`: Resolve governed spec locators or stable spec IDs and show paired metadata and enforcement information.
- `cli-validate`: Validate governed pairs, scoped identities, coverage, declared targets, and deltas with actionable diagnostics.
- `cli-spec`: Support governed pair listing, showing, JSON parsing, and validation through the existing spec command surface.
- `cli-archive`: Validate and apply coherent specification/enforcement pair updates before moving a governed change to archive.
- `specs-sync-skill`: Reconcile nested specification and enforcement deltas together and report retired enforcement targets.
- `opsx-verify-skill`: Run declared enforcement, perform review bindings, and report requirement/scenario coverage before archive.
- `opsx-archive-skill`: Require governed pair and enforcement readiness before archive.
- `opsx-onboard-skill`: Teach behavioral truth, architectural truth, scoped stable identity, enforcement, and archived decision history.

## Impact

- **Schema and templates**: a new governed schema/profile, behavioral/architectural spec templates, enforcement template, artifact instructions, and project configuration.
- **Contained core extension**: schema-aware recursive pair discovery, governed parsing and structural validation, locator/stable-ID resolution, pair-aware delta application, and additive JSON fields. Legacy parsing and archive behavior remain separate and unchanged.
- **CLI**: list/show/validate/spec/archive recognize plane-qualified nested locators and governed pairs.
- **Agent workflows**: canonical workflow templates and every generated skill/command projection become governed-schema aware.
- **Verification**: workflow-driven execution of repository-authored test/lint commands, target existence checks, review/manual evidence reporting, and stale/retired binding diagnostics.
- **Pilot**: a Kairos-style fixture demonstrates a behavioral test binding, architectural lint binding, review-only responsibility, stale enforcement, a hanging claim, and a cross-plane change.
- **Compatibility**: legacy flat projects remain on the existing workflow. Promotion or migration of the default workflow is a separate decision based on pilot evidence.
