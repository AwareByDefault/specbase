## Context

OpenSpec currently treats permanent specs as flat behavioral capabilities at `openspec/specs/<capability>/spec.md`. Requirement headings act as mutable identity, current-spec discovery and archive application assume different directory depths, and verification primarily asks an agent to search for plausible implementation. Projects such as Kairos already maintain architectural documents, ESLint fitness functions, conformance tests, property tests, and CI, but no durable contract says which normative claim each mechanism protects.

The first governed version should prove that two truth planes, nested organization, and paired enforcement improve real development practice. It should not turn OpenSpec core into a knowledge graph, generalized command runner, or transactional filesystem.

## Goals / Non-Goals

**Goals:**
- Represent behavioral and current architectural truth as distinct permanent spec planes.
- Pair every governed spec with a machine-validated enforcement contract.
- Keep enforcement references stable when titles or locators change.
- Detect stale bindings after requirements or scenarios are removed.
- Detect hanging claims when enforcement targets disappear or declared checks fail.
- Support nested plane-qualified locators through existing CLI surfaces.
- Keep governed behavior opt-in and the legacy flat workflow unchanged.
- Teach every relevant OPSX workflow how to maintain both truth and enforcement.

**Non-Goals:**
- Cross-spec relationship graphs or computed context closure.
- Requirement inheritance or override semantics.
- Automatically inferring package ownership, relationships, or enforcement.
- A general-purpose core command-execution engine.
- A filesystem rollback journal or cross-file ACID guarantees.
- A separate architecture-review command or skill.
- Automatic legacy-spec migration.
- Generating or owning project `ARCHITECTURE.md` files.
- Requiring one test per requirement or scenario.

## Decisions

### 1. Add an opt-in governed schema

**Decision:** Add a bundled schema selected through the existing project `schema` setting. Resolved schema metadata declares the model explicitly rather than making core code branch on a schema name:

```yaml
specModel:
  kind: governed
  version: 1
  planes: [behavior, architecture]
  pairedEnforcement: true
```

The artifact graph is:

```text
proposal ──▶ specs ───────────────┐
     └────▶ design ──▶ enforcement├──▶ tasks ──▶ apply
                      ▲            │
                      └────────────┘
```

- `specs` generates governed `spec.md` deltas.
- `enforcement` generates paired `enforcement.md` deltas after specs and design clarify the intended mechanism.
- `tasks` requires specs, design, and enforcement.
- A binding may be `planned` during planning but must become `active` before governed verification and archive readiness.

**Rationale:** An opt-in schema isolates the new repository format and permits a real-project pilot without compatibility shims in the legacy parser.

### 2. Use two top-level planes with simple nested locators

**Decision:** Governed current specs live at:

```text
openspec/specs/behavior/<locator>/spec.md
openspec/specs/behavior/<locator>/enforcement.md
openspec/specs/architecture/<locator>/spec.md
openspec/specs/architecture/<locator>/enforcement.md
```

Behavioral locators follow cohesive capabilities. Architectural locators may follow current packages, components, or cross-cutting structural policies because changing them during refactors is intentional. A directory without a pair is only a namespace. A directory may contain both a pair and children. Ancestry provides navigation only; it does not inherit requirements.

Discovery supports arbitrary safe depth. Validation rejects absolute paths, empty segments, dot segments, parent traversal, and hidden control directories. JSON emits normalized slash-separated locators; filesystem access uses native path operations.

**Rationale:** This implements the requested organization while avoiding a second semantic hierarchy hidden inside the filesystem.

### 3. Retain stable identity, but scope it narrowly

**Decision:** Stable IDs exist at four levels:

- A spec ID is project-unique and remains unchanged when its title or locator moves.
- Requirement and scenario IDs are unique within their spec.
- Binding IDs are unique within the paired enforcement file.
- Enforcement coverage references only requirement/scenario IDs from its paired spec in version 1.

A governed `spec.md` begins with minimal frontmatter:

```yaml
---
id: architecture.domain
---
```

Type comes from the containing plane rather than duplicated metadata. Requirements and scenarios declare IDs immediately below their headings:

```markdown
### Requirement: Domain determinism
**ID:** `domain-determinism`
The domain MUST obtain time and randomness through injected ports.

#### Scenario: Ambient time is rejected
**ID:** `ambient-time-rejected`
- **WHEN** a domain module reads ambient time
- **THEN** architectural enforcement reports the violation
```

IDs are immutable human-readable slugs. Titles and locators remain mutable presentation. Project-wide indexing is required only for spec IDs; normative and binding identity is validated inside each pair.

**Rationale:** The enforcement lifecycle requires durable references, but globally indexing every node and adding cross-spec edges is unnecessary. Scoped IDs support removal detection with much less core machinery.

### 4. Keep `enforcement.md` structured and pair-local

**Decision:** `enforcement.md` is readable Markdown containing one authoritative fenced YAML document. Conceptually:

````markdown
# Enforcement: Domain Architecture

```yaml
version: 1
spec: architecture.domain
bindings:
  - id: import-boundary
    covers: [domain-import-boundary, ambient-import-rejected]
    mechanism: lint
    strength: automated
    status: active
    targets:
      - tools/lint/boundaries.test.ts
    run:
      command: pnpm
      args: [vitest, run, tools/lint/boundaries.test.ts]
      cwd: .
```
````

Binding fields:
- `id`: stable ID scoped to the pair.
- `covers`: local requirement or scenario IDs.
- `mechanism`: `test`, `lint`, `static-analysis`, `command`, `review`, or `manual`.
- `strength`: `automated`, `review`, `manual`, or `unenforced`.
- `status`: `planned` or `active`.
- `targets`: explicit project-relative files and optional human-readable rule/test selectors.
- `run`: executable, argument vector, and project-relative working directory for automated bindings.
- `review`: procedure and required inputs for review bindings.
- `procedure` and `rationale`: required for manual bindings.
- `limitations`: optional statement of what the evidence does not prove.

Commands use an executable and argument vector rather than an opaque shell string. Core parses and reports them; governed workflows execute them with available process tools.

**Rationale:** A structured pair-local document is sufficient for coverage and drift detection without introducing cross-spec graph semantics or a reusable core execution subsystem.

### 5. Make bidirectional drift visible

**Decision:** Pair validation calculates four states:

```text
Normative ID exists + complete binding + target exists  → covered
Normative ID exists + no complete binding                → hanging claim
Normative ID missing + binding still covers it           → stale binding
Binding active + declared target missing                 → broken enforcement
```

Every SHALL/MUST requirement needs at least one binding. A scenario must either be covered directly or be explicitly included by a requirement-level binding claiming full scenario coverage. `planned`, `unenforced`, unresolved, and missing-target bindings are allowed while authoring but block verification and archive readiness.

When a requirement, scenario, or binding is removed, synchronization compares the old and prepared pair and reports its no-longer-referenced targets as cleanup candidates. It never deletes project code because a target can be shared or intentionally retained. Apply guidance checks whether any surviving binding still references each candidate before removing a test, rule, or fixture.

A declared path disappearing is deterministic. A command failing is deterministic. OpenSpec cannot prove that a surviving test or linter still checks the intended semantics merely because its file exists and command passes; review bindings and verifier correspondence review remain honest, weaker evidence for that case.

**Rationale:** Stable IDs earn their cost by making both spec cruft and enforcement cruft observable while avoiding unsafe automatic cleanup.

### 6. Contain core changes behind a governed repository path

**Decision:** Resolve the project schema first, then dispatch:

```text
CLI / artifact workflow
          │
          ▼
  resolved spec model
       ├── legacy   ──▶ existing flat parser/discovery/archive
       └── governed ──▶ recursive paired repository
```

The governed repository owns:
- Recursive pair discovery.
- Plane-qualified locator normalization.
- Governed spec and enforcement parsing.
- Project-unique spec-ID lookup.
- Pair-local identity and coverage validation.
- Preparation and application of paired deltas.

Shared CLI commands consume a normalized record rather than learning the governed file format independently. Legacy parsing and legacy archive behavior remain intact.

**Rationale:** This is an additive repository implementation, not a replacement universal spec graph.

### 7. Require pair coherence without building a filesystem transaction engine

**Decision:** Governed sync/archive:

1. Discovers every explicit spec/enforcement delta pair from schema paths.
2. Builds prospective current pairs in memory.
3. Validates all affected pairs and the project-wide spec-ID index before writing.
4. Writes each validated pair together using the existing filesystem/update conventions.
5. Moves the change only after every pair update succeeds.

An incomplete delta pair, duplicate spec ID, stale coverage reference, hanging mandatory claim, missing active target, or unresolved planned binding blocks ordinary archive. The existing explicit validation bypass remains available with existing confirmation semantics and is reported as unverified.

Version 1 does not promise rollback after an operating-system write failure. It prevents known semantic partial updates through complete pre-validation and pair ordering. If the pilot demonstrates unacceptable I/O failure risk, a rollback mechanism becomes a focused follow-up.

**Rationale:** Semantic coherence is essential; cross-platform transactional filesystem infrastructure is not necessary to test the product model.

### 8. Execute enforcement through governed workflows

**Decision:** `/opsx:verify` and governed archive guidance execute each affected automated binding's declared command using agent process tools, then associate results with covered IDs. They apply structured review procedures for review bindings and report manual evidence separately. Core validation checks declaration shape, coverage, lifecycle state, and target existence but does not own a general runner.

A passing command and a semantically matching check are separate claims. Verify inspects changed bindings for plausible correspondence and labels that conclusion as review, not deterministic automation.

**Rationale:** Repository-authored test and lint commands already run through agent workflows. Keeping execution there minimizes core surface while retaining deterministic command feedback.

### 9. Extend existing CLI context, not a new context graph

**Decision:** Governed list/show/spec/validate expose:
- Stable spec ID.
- Plane and normalized locator.
- Paired native source paths.
- Requirement/scenario IDs.
- Binding and coverage summaries.
- Stale, hanging, broken, and planned states.

Show resolves either a plane-qualified locator or a stable spec ID. No relationships, incoming edges, inferred closure, or new context command ship in version 1. Skills load the selected pair and any other pair explicitly affected by the current change.

**Rationale:** These fields satisfy discovery and drift diagnosis without a graph subsystem.

### 10. Update all workflow projections from their canonical source

**Decision:** Update the canonical workflow source established by `unify-template-generation-pipeline` if present at implementation time, then regenerate and parity-check every supported skill and command projection.

| Workflow | Governed responsibility |
|---|---|
| explore | Distinguish behavioral truth, architectural truth, enforcement, and change design |
| new/propose/ff/continue | Classify plane targets and create specs then enforcement artifacts from schema instructions |
| update | Keep scoped IDs, requirements, scenarios, bindings, design, and tasks coherent |
| apply | Implement code and evidence; resolve planned bindings; assess retired-target cleanup candidates |
| verify | Validate coverage, run declared commands, perform review procedures, and report evidence strength |
| sync | Reconcile nested pairs together and report stale/retired enforcement |
| archive/bulk archive | Require pair readiness and report explicit bypasses honestly |
| onboard | Teach both truth planes, stable scoped identity, enforcement, and historical rationale |

**Rationale:** Most of the product behavior belongs in schema-aware workflow guidance, allowing the core extension to stay narrow.

### 11. Keep architectural rationale in change archives

**Decision:** Architectural specs describe what must remain true now. Proposal and design explain why the transition occurred and remain in the dated archive. No dedicated ADR file or supersession graph ships in version 1.

**Rationale:** This preserves current truth separately from historical decision rationale without adding a third permanent artifact model.

### 12. Pilot before migration or ontology expansion

**Decision:** Exercise the governed schema on a Kairos-style fixture containing:
- A behavioral spec enforced by tests or property checks.
- A package-oriented architectural spec enforced by lint and conformance checks.
- A review-only architectural responsibility.
- A removed scenario that leaves a stale binding and cleanup candidate.
- A removed target that leaves a hanging normative claim.
- A cross-cutting change modifying both planes.

No automatic migration ships. Pilot findings record taxonomy ambiguity, identity maintenance, enforcement drift, context usefulness, and archive friction. Relationships, generated context, core execution, rollback, or default-workflow migration require separate evidence-backed proposals.

## Risks / Trade-offs

**Risk: Stable IDs add authoring overhead.**
→ Mitigation: IDs are human-readable and scoped locally except for spec IDs; templates and validation provide exact diagnostics.

**Risk: A surviving target can be semantically useless while still passing.**
→ Mitigation: distinguish path/command validity from semantic review; do not claim deterministic proof where none exists.

**Risk: Workflow execution can be bypassed through direct low-level CLI use.**
→ Mitigation: CLI archive still blocks structurally incomplete, planned, stale, hanging, and missing-target pairs; full command execution is reported as workflow verification in version 1. The pilot determines whether a dedicated core verification command is warranted.

**Risk: Pair writes can partially fail at the operating-system layer.**
→ Mitigation: pre-validate all affected pairs and write each pair coherently; explicitly defer rollback infrastructure until failure evidence justifies it.

**Risk: Nested paths recreate spec sprawl.**
→ Mitigation: directories are namespaces, no parent spec is mandatory, no inheritance exists, and specs split by reason to change rather than line count.

**Risk: Workflow template work overlaps the active template-pipeline refactor.**
→ Mitigation: implement against the canonical source present at execution time and retain projection parity as an acceptance gate.
