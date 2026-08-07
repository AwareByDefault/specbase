# spec-review-panel Specification

## Purpose
TBD - created by archiving change add-review-panel-enforcement. Update Purpose after archive.
## Requirements
### Requirement: Review is a growing per-codebase panel of blind lenses
Under the governed spec model, non-deterministic enforcement SHALL be executed by a review panel of focused reviewer lenses, each judging exactly one concern and blind to the others. The panel SHALL ship four default lenses — `architectural`, `behavioural`, `enforcement`, and `code-quality` — and SHALL support additional project-specific lenses added through the normal change workflow.

#### Scenario: Default lenses cover the model's structure
- **WHEN** a governed project runs the review panel with no project-specific lenses
- **THEN** the `architectural` lens reviews the `architecture/` plane, the `behavioural` lens reviews the `behavior/` plane, the `enforcement` lens reviews whether bound checks exercise their claims, and the `code-quality` lens reviews cleanliness
- **AND** each lens judges only its own concern and is told which concerns other lenses own

#### Scenario: Enforcement lens audits evidence adequacy
- **WHEN** the `enforcement` lens reviews a binding's declared check
- **THEN** it assesses whether the check actually exercises the covered claim rather than merely running
- **AND** it audits automated bindings as well as review bindings, but does not review its own verdicts

### Requirement: Lens scope is a spec-tree subtree resolved most-specific-first
A lens SHALL declare a scope as a plane-qualified locator subtree; the default lenses SHALL scope to a whole plane or the whole tree, and a lens MAY be split into a scoped lens over a nested subtree. The panel router SHALL assign each affected governed pair to the most-specific lens whose subtree covers it, falling back up the tree to a default lens.

#### Scenario: Scoped lens takes precedence within its subtree
- **WHEN** a scoped lens exists for `architecture/rings/boundaries` and a change touches a pair under it
- **THEN** the router selects the `boundaries` lens for that pair rather than the plane-wide `architectural` lens

#### Scenario: Router scales to the changed surface
- **WHEN** a change touches only a subset of the spec tree
- **THEN** the router spawns only the lenses whose subtrees are touched plus the always-on cross-cutting lenses
- **AND** it logs every lens skipped and why

### Requirement: The panel reviews the residue above the deterministic gate
The panel SHALL run the project's declared deterministic checks before the reviewers and pass each lens the already-covered findings together with the deterministic binding IDs it is blind to (its `covered_by`), so a lens reports only issues the deterministic layer does not already prove. As deterministic bindings are added to a review binding's `covered_by`, the reviewed residue SHALL shrink without editing any lens method.

#### Scenario: Deterministic findings are not re-reviewed
- **WHEN** a review binding declares `covered_by` referencing a sibling automated binding
- **THEN** the lens executing that review binding is told those checks are already covered and does not re-report them

### Requirement: Panel findings are refute-verified, critiqued, and non-gating
The panel SHALL refute-verify high-severity findings with an independent second opinion before reporting, SHALL run a completeness critic that names any lens that should have run but did not, and SHALL emit a read-only severity-grouped report attributed by lens. Panel findings SHALL be reported as `review`-strength evidence and SHALL NOT block archive, verification readiness, or `openspec coverage --strict`.

#### Scenario: A zealous finding is refuted
- **WHEN** a lens reports a high-severity finding
- **THEN** an independent reviewer attempts to refute it and only surviving findings are reported at high severity

#### Scenario: Review evidence never gates
- **WHEN** the panel reports findings for a change
- **THEN** the findings are recorded as `review`-strength and do not fail archive readiness or `--strict`, which gate only on structural rot

### Requirement: Lenses source policy from the specs at review time and grow by proposal
A lens method SHALL contain only its reviewing method; the project policy it applies SHALL be read at review time from the governed specs its scope covers, never copied into the lens method. A new or scoped lens SHALL be added through the normal change workflow, not created automatically.

#### Scenario: A spec edit changes the review with no lens edit
- **WHEN** an architectural spec in a lens's subtree is edited
- **THEN** the next panel run reflects the edited spec without any change to the lens method

#### Scenario: A non-deterministic claim without a lens is proposed, not auto-created
- **WHEN** exploration or verification finds a normative claim that no deterministic check and no existing lens covers
- **THEN** the workflow proposes pointing it at an existing lens or adding a new/scoped lens as a change, and does not create the lens automatically

