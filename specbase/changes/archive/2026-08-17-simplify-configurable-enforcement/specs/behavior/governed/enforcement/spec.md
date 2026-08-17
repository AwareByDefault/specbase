---
id: behavior.governed.enforcement
---

## Purpose
Governed enforcement is a concise, project-configurable index from normative requirements to the evidence sources that assure them, with declaration, execution, and semantic correspondence reported honestly as separate facts.

## MODIFIED Requirements

### Requirement: Every governed spec is paired with a declaration of how it is assured
**ID:** `paired-enforcement-contract`
The system SHALL require a sibling `enforcement.yaml` beside every governed `spec.md`. The manifest SHALL pair by location with that spec and declare the evidence source for each normative requirement. During migration, a lone legacy `enforcement.md` SHALL satisfy the pair contract, while both filenames together SHALL make the pair invalid.

#### Scenario: Complete compact pair
**ID:** `pair-identity-matches`
- **WHEN** a governed directory contains `spec.md` and `enforcement.yaml`
- **THEN** the files resolve as one pair with the spec's stable identity

#### Scenario: Conflicting enforcement members
**ID:** `pair-identity-mismatch`
- **WHEN** a governed directory contains both supported enforcement filenames
- **THEN** validation reports both source files as an ambiguous pair

### Requirement: Each binding declares a type, covered requirements, and one source
**ID:** `structured-bindings`
Each enforcement binding SHALL use its map key as pair-local stable identity and SHALL declare exactly `type`, `covers`, and `source`. The type SHALL resolve from the project's enforcement type roster, `covers` SHALL name one or more requirements from the paired spec, and `source` SHALL identify the artifact that owns the check or procedure.

#### Scenario: File-backed binding
**ID:** `binding-test-shape`
- **WHEN** a binding uses a configured file-backed type
- **THEN** its source identifies a project-relative evidence file with an optional selector

#### Scenario: Lens-backed binding
**ID:** `binding-review-shape`
- **WHEN** a binding uses a configured lens-backed type
- **THEN** its source names a resolved review lens

#### Scenario: Type vocabulary is project-defined
**ID:** `binding-lint-shape`
- **WHEN** a binding declares a type ID outside Specbase's shipped defaults
- **THEN** it parses and validates when that ID exists in the resolved project roster

### Requirement: Evidence strength is derived from configured types
**ID:** `honest-evidence-strength`
The system SHALL derive each binding's automated, review, manual, or unenforced evidence strength from its resolved enforcement type so a project-defined mechanism is classified without repeating strength in every manifest. A missing type, unresolved source, or unenforced type SHALL leave the requirement unready.

#### Scenario: Project type supplies strength
**ID:** `agentic-review-strength`
- **WHEN** a binding resolves to a type whose strength is `review`
- **THEN** coverage reports review-strength evidence regardless of the type's project-defined ID

#### Scenario: Manual type supplies strength
**ID:** `manual-evidence`
- **WHEN** a binding resolves to a type whose strength is `manual`
- **THEN** coverage reports manual evidence and the source points to its procedure artifact

#### Scenario: Invalid binding blocks readiness
**ID:** `planned-binding-blocks`
- **WHEN** a binding type or source does not resolve
- **THEN** planning may continue
- **AND** verification and archive readiness stay blocked

### Requirement: Drift is detected between requirements and evidence sources
**ID:** `bidirectional-drift`
The system SHALL use stable binding and requirement identities to detect a binding left behind after a requirement is removed, a surviving requirement with no valid binding, and a binding whose configured type or source no longer resolves.

#### Scenario: Removed requirement leaves a stale binding
**ID:** `stale-after-requirement-removal`
- **WHEN** a prepared spec no longer holds a requirement ID a binding still covers
- **THEN** validation reports the binding and stale covered ID

#### Scenario: Removed source leaves a hanging claim
**ID:** `broken-target-hangs-claim`
- **WHEN** an evidence source disappears or its type no longer resolves
- **THEN** validation reports the binding ID, source, and covered requirements
- **AND** those requirements are not reported ready

#### Scenario: Scenario edits do not stale bindings
**ID:** `stale-after-scenario-removal`
- **WHEN** scenarios are added, renamed, or removed under a covered requirement
- **THEN** its requirement-level bindings remain valid

### Requirement: Retired evidence sources are reported, never deleted
**ID:** `retired-target-candidates`
When requirements or bindings are removed, the system SHALL report evidence source files referenced by no surviving binding as cleanup candidates and SHALL NOT delete project files on its own.

#### Scenario: Binding removal retires a source
**ID:** `retired-candidate-reported`
- **WHEN** a change removes the final binding that references a file source
- **THEN** synchronization reports that source as a retired candidate

#### Scenario: Source remains shared
**ID:** `shared-target-not-retired`
- **WHEN** a surviving binding still references a candidate source
- **THEN** the source is reported as shared and is not offered as safe cleanup

### Requirement: Binding sources resolve according to their configured type
**ID:** `resolvable-targets`
The system SHALL resolve every binding source using its enforcement type's source kind. File sources SHALL resolve inside the selected project root before readiness; lens sources SHALL name a configured review lens. Validation SHALL reject an escaping path without reading the external location.

#### Scenario: File source resolves
**ID:** `targets-resolve`
- **WHEN** a file-backed source exists inside the project root
- **THEN** structural source validation passes

#### Scenario: Missing source is reported
**ID:** `missing-target-reported`
- **WHEN** a configured source cannot be resolved
- **THEN** validation reports the binding ID, source, type, and covered requirements

#### Scenario: Escaping source is rejected
**ID:** `escaping-target-rejected`
- **WHEN** a file source resolves outside the project root
- **THEN** validation rejects it without accessing the external location

### Requirement: Evidence linkage, execution, and correspondence are reported separately
**ID:** `automated-execution-and-correspondence`
The system SHALL report structural linkage when a binding resolves, execution only when its source is run through the project's native evidence harness, and semantic correspondence only when the source plausibly exercises the covered requirement. A valid source link alone SHALL NOT be reported as a passing execution result.

#### Scenario: Evidence source passes
**ID:** `automated-check-passes`
- **WHEN** verification runs an automated source through the project harness and it succeeds
- **THEN** a passing execution result is attached to its covered requirements

#### Scenario: Evidence source cannot run
**ID:** `automated-check-fails`
- **WHEN** an automated source fails, cannot start, or has no available harness
- **THEN** verification reports that outcome separately from structural coverage
- **AND** does not claim the source passed

#### Scenario: Source asserts the wrong contract
**ID:** `semantic-mismatch-reported`
- **WHEN** a source exists or passes but does not plausibly correspond to its covered requirement
- **THEN** the mismatch is reported as a review-strength correspondence issue

### Requirement: A pair is validated and promoted as one unit
**ID:** `pair-coherent-sync`
The system SHALL prepare and validate a governed `spec.md` and its enforcement manifest together, and SHALL promote both members or neither. Promotion SHALL write the current enforcement member as `enforcement.yaml`.

#### Scenario: Pair validation fails
**ID:** `pair-not-promoted-on-failure`
- **WHEN** a prepared pair holds a duplicate ID, stale binding, hanging requirement, unknown type, or unresolved source
- **THEN** neither member is promoted
- **AND** actionable diagnostics name the conflict

#### Scenario: Pair validation succeeds
**ID:** `pair-promoted-together`
- **WHEN** both prepared members and their coverage validate
- **THEN** synchronization updates the complete pair and reports requirement, binding, and retired-source changes together

### Requirement: A spec over an operational artifact binds a conformance source to it
**ID:** `conformance-binding-pattern`
When a governed spec states durable truth about an operational artifact, its paired enforcement SHALL bind the requirement to a source that checks the artifact's conformance. The binding SHALL use a configured enforcement type and SHALL keep the operational artifact as the runtime source of truth.

#### Scenario: Spec bound to its operational artifact
**ID:** `artifact-conformance-bound`
- **WHEN** a governed spec declares durable truth about an operational artifact
- **THEN** its enforcement source checks that artifact against the requirement

#### Scenario: Project vocabulary is reused
**ID:** `no-new-mechanism`
- **WHEN** enforcement is authored for such a spec
- **THEN** its binding selects a type from the resolved project roster

## REMOVED Requirements

### Requirement: A non-deterministic binding may name its lens and its deterministic residue
**ID:** `review-lens-and-residue`
**Reason:** The compact binding's type determines source resolution, a lens-backed source names the lens directly, and deterministic sibling bindings covering the same requirement define the residue without a manual `covered_by` list.

**Migration:** Replace `lens` with the binding's configured lens-backed `type` and `source`; remove `covered_by` and let coverage derive sibling automated evidence.
