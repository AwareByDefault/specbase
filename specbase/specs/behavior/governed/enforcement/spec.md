---
id: behavior.governed.enforcement
---

### Requirement: Every governed spec is paired with a declaration of how it is assured
**ID:** paired-enforcement-contract
The system SHALL require a sibling `enforcement.md` beside every governed `spec.md`
that names its paired spec by stable ID and declares how each normative requirement
and scenario is assured. A pair whose two members disagree on identity SHALL be
reported rather than accepted.

#### Scenario: Complete pair
**ID:** pair-identity-matches
- **WHEN** a governed pair is parsed
- **THEN** the stable spec ID declared by `enforcement.md` matches the one in `spec.md`
- **AND** both files share one locator

#### Scenario: Mismatched pair identity
**ID:** pair-identity-mismatch
- **WHEN** `enforcement.md` names a different stable spec ID
- **THEN** validation reports both source files and the mismatched values

### Requirement: Each binding declares what it covers and how
**ID:** structured-bindings
Each enforcement binding SHALL declare the pair-local requirement or scenario IDs it
covers, its mechanism, its evidence strength, its lifecycle status, concrete targets
or a review procedure with its inputs, and any limitations the author accepts.

#### Scenario: Automated test binding
**ID:** binding-test-shape
- **WHEN** a requirement or scenario is covered by a test
- **THEN** the binding declares the test target and the executable argument vector
- **AND** classifies its strength as automated

#### Scenario: Lint or static-analysis binding
**ID:** binding-lint-shape
- **WHEN** an invariant is checked by a linter or static-analysis rule
- **THEN** the binding declares the configuration, rule or conformance target, and the executable argument vector

#### Scenario: Structured review binding
**ID:** binding-review-shape
- **WHEN** a claim cannot be checked mechanically
- **THEN** the binding declares the review procedure and its required inputs
- **AND** classifies its strength as review rather than automated

### Requirement: Evidence strength is classified honestly
**ID:** honest-evidence-strength
The system SHALL distinguish automated, review, manual, and unenforced evidence so
human or probabilistic judgment is never presented as deterministic proof. A binding
that remains planned or unenforced SHALL leave planning open while holding
verification and archive readiness closed.

#### Scenario: Agentic review is review evidence
**ID:** agentic-review-strength
- **WHEN** an agent completes a declared review procedure
- **THEN** the result is reported at review strength and is not labelled automated evidence

#### Scenario: Manual evidence
**ID:** manual-evidence
- **WHEN** a binding needs human or external observation
- **THEN** it carries a repeatable procedure and rationale and reports manual strength

#### Scenario: Planned binding blocks readiness
**ID:** planned-binding-blocks
- **WHEN** a binding remains planned or unenforced
- **THEN** planning may continue
- **AND** verification and archive readiness stay blocked

### Requirement: A non-deterministic binding may name its lens and its deterministic residue
**ID:** review-lens-and-residue
A binding whose mechanism is non-deterministic MAY declare the review lens that
executes it and MAY declare the sibling binding IDs whose deterministic checks
already own part of its territory. Both fields SHALL be optional and additive, and
their absence SHALL NOT change how a binding parses or how coverage and drift are
computed.

#### Scenario: Review binding names its lens
**ID:** binding-names-lens
- **WHEN** a review binding declares a lens
- **THEN** the binding parses with that lens recorded and its covered claims route to that lens

#### Scenario: Covered-by names the deterministic residue
**ID:** binding-covered-by
- **WHEN** a review binding names sibling binding IDs as already covering part of its territory
- **THEN** those IDs are recorded so the executing lens reviews only the remaining residue

#### Scenario: Absent fields are backward compatible
**ID:** lens-fields-optional
- **WHEN** a binding declares neither field
- **THEN** it parses as before and coverage, drift, and validation are unchanged

### Requirement: Drift is detected in both directions
**ID:** bidirectional-drift
The system SHALL use stable identities to detect enforcement left behind after a
normative claim is removed, and enforcement that is broken or missing for a claim
that survives.

#### Scenario: Removed requirement leaves a stale binding
**ID:** stale-after-requirement-removal
- **WHEN** a prepared spec no longer holds an ID a binding still covers
- **THEN** validation reports the binding and the stale covered ID
- **AND** the pair is not promoted until coverage is reconciled

#### Scenario: Removed scenario leaves a stale binding
**ID:** stale-after-scenario-removal
- **WHEN** a scenario is removed while a binding still covers its stable ID
- **THEN** validation reports that binding as stale enforcement

#### Scenario: Removed target leaves a hanging claim
**ID:** broken-target-hangs-claim
- **WHEN** an active binding targets a file that no longer exists
- **THEN** validation reports the missing target, the binding ID, and the covered normative IDs
- **AND** the covered claims are not reported as ready

### Requirement: Retired enforcement targets are reported, never deleted
**ID:** retired-target-candidates
When requirements, scenarios, or bindings are removed, the system SHALL report the
enforcement targets nothing references any more as cleanup candidates, and SHALL NOT
delete project code on its own.

#### Scenario: Binding removed with its requirement
**ID:** retired-candidate-reported
- **WHEN** a change removes a normative ID and its binding
- **THEN** synchronization reports the binding's former targets as retired candidates

#### Scenario: Target still shared
**ID:** shared-target-not-retired
- **WHEN** a surviving binding still references a candidate target
- **THEN** the candidate is reported as still shared and is not offered as safe cleanup

### Requirement: Active binding targets resolve inside the project
**ID:** resolvable-targets
The system SHALL check that every active binding's targets and working directories
exist and resolve inside the selected project root before reporting enforcement
readiness, and SHALL reject an escaping path without reading the external location.

#### Scenario: Targets resolve
**ID:** targets-resolve
- **WHEN** every active target and working directory exists inside the project root
- **THEN** structural target validation passes

#### Scenario: Missing target
**ID:** missing-target-reported
- **WHEN** an active target does not exist
- **THEN** validation reports the binding ID, the structured field, the missing path, and the covered IDs

#### Scenario: Escaping target
**ID:** escaping-target-rejected
- **WHEN** a target or working directory resolves outside the project root
- **THEN** validation rejects it without accessing the external location

### Requirement: Automated bindings are executed, and their fit is judged separately
**ID:** automated-execution-and-correspondence
The system SHALL run an affected automated binding through its declared executable
and argument vector, attach the result to the IDs it covers, and fail readiness when
a mandatory check fails or cannot start. Executable success SHALL be reported
separately from the judgment of whether a changed check plausibly proves the claim
it covers.

#### Scenario: Automated check passes
**ID:** automated-check-passes
- **WHEN** an affected binding's declared command exits successfully
- **THEN** a passing automated result is recorded for its covered IDs

#### Scenario: Automated check fails
**ID:** automated-check-fails
- **WHEN** a mandatory declared command exits unsuccessfully or cannot start
- **THEN** the failure output and the affected stable IDs are reported
- **AND** governed archive is marked not ready

#### Scenario: A passing check asserts the wrong contract
**ID:** semantic-mismatch-reported
- **WHEN** a command passes but the changed check does not plausibly correspond to its covered claim
- **THEN** the mismatch is reported as a review-strength correspondence issue, separate from command status

### Requirement: A pair is validated and promoted as one unit
**ID:** pair-coherent-sync
The system SHALL prepare and validate a governed specification and its enforcement
together, and SHALL promote both members or neither.

#### Scenario: Pair validation fails
**ID:** pair-not-promoted-on-failure
- **WHEN** a prepared pair holds a duplicate ID, a stale binding, a hanging mandatory claim, an unresolved status, or a missing active target
- **THEN** neither member is promoted
- **AND** actionable diagnostics name the conflict

#### Scenario: Pair validation succeeds
**ID:** pair-promoted-together
- **WHEN** both prepared files and their coverage validate
- **THEN** synchronization updates the complete pair and reports requirement, scenario, binding, and retired-target changes together

### Requirement: A spec over an operational artifact binds a conformance check to it
**ID:** conformance-binding-pattern
When a governed spec states durable truth about an operational artifact an agent or
runtime reads — a project config, a resolved lens set, a skill file, a hook
configuration, or a token file — its paired enforcement SHALL bind a normative claim
to a check that the artifact conforms to the spec. The pattern SHALL reuse the
existing binding mechanisms and SHALL NOT introduce a new one.

#### Scenario: Spec bound to its operational artifact
**ID:** artifact-conformance-bound
- **WHEN** a governed spec declares durable truth about an operational artifact
- **THEN** its enforcement binds a claim to a check that the artifact conforms to the spec

#### Scenario: No new mechanism
**ID:** no-new-mechanism
- **WHEN** enforcement is authored for such a spec
- **THEN** its bindings use only the existing mechanisms

### Requirement: A spec describes the artifact the runtime reads and never generates it
**ID:** describe-direction-of-truth
A governed spec over an artifact the runtime already reads SHALL describe that
artifact and assert conformance to it; the artifact SHALL remain the runtime source
of truth and the spec SHALL NOT be treated as its generator. Planting a baseline
spec as setup scaffolding SHALL be the one documented exception to the
proposal-to-spec flow, and every later edit to a planted spec SHALL go through a
change.

#### Scenario: Config stays the runtime source
**ID:** artifact-stays-source
- **WHEN** a spec governs the project config the runtime reads
- **THEN** the spec describes the config and its enforcement asserts conformance, while the runtime keeps reading the config as the source of truth

#### Scenario: Planted baseline is the only exception
**ID:** scaffold-exception
- **WHEN** a baseline spec is planted as setup scaffolding
- **THEN** it is the only spec created outside the change flow
- **AND** a later edit to it is authored through a change
