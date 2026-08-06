## ADDED Requirements

### Requirement: Paired enforcement contract
Every governed `spec.md` SHALL have a sibling `enforcement.md` that identifies the paired spec by stable ID and declares how its normative requirements and scenarios are assured.

#### Scenario: Complete governed pair
- **WHEN** a governed pair is parsed
- **THEN** the stable spec ID referenced by `enforcement.md` matches `spec.md`
- **AND** both files share one plane-qualified locator

#### Scenario: Mismatched pair identity
- **WHEN** `enforcement.md` references a different stable spec ID
- **THEN** validation reports both source files and the mismatched values

### Requirement: Structured enforcement bindings
Each enforcement binding SHALL declare a stable pair-local binding ID, covered pair-local requirement or scenario IDs, mechanism, evidence strength, lifecycle status, concrete targets or review procedure, and any explicit limitations.

#### Scenario: Automated test binding
- **WHEN** a behavioral requirement or scenario is covered by a test
- **THEN** the binding declares the test target and executable argument vector
- **AND** classifies its strength as automated

#### Scenario: Architectural lint binding
- **WHEN** an architectural invariant is checked by a linter or static analysis rule
- **THEN** the binding declares the relevant configuration, rule or conformance target, and executable argument vector

#### Scenario: Structured review binding
- **WHEN** an architectural responsibility cannot be fully checked mechanically
- **THEN** the binding declares the review procedure and required inputs
- **AND** classifies its strength as review rather than automated

### Requirement: Honest evidence-strength classification
OpenSpec SHALL distinguish automated, review, manual, and unenforced evidence so human or probabilistic judgment is not presented as deterministic enforcement.

#### Scenario: AI architecture review
- **WHEN** an AI agent completes a declared architecture review procedure
- **THEN** the result is reported with review strength
- **AND** it is not labeled as automated fitness evidence

#### Scenario: Manual evidence
- **WHEN** a binding requires human or external observation
- **THEN** it includes a repeatable procedure and rationale
- **AND** reports manual strength

#### Scenario: Planned or unenforced binding
- **WHEN** a binding remains planned or unenforced
- **THEN** planning may continue
- **AND** governed verification and archive readiness remain blocked

### Requirement: Normative coverage
Every SHALL or MUST requirement in a governed spec SHALL have at least one binding, and every scenario SHALL be covered directly or explicitly accounted for by a requirement-level binding.

#### Scenario: Complete requirement-level coverage
- **WHEN** a requirement binding explicitly declares full scenario coverage
- **THEN** its scenarios count as covered by that binding

#### Scenario: Missing requirement coverage
- **WHEN** a normative requirement has no complete binding
- **THEN** validation reports a hanging claim using the stable spec and requirement IDs

#### Scenario: Unaccounted scenario
- **WHEN** a scenario is neither covered directly nor included by full requirement-level coverage
- **THEN** validation reports its pair-local scenario ID as uncovered

### Requirement: Bidirectional enforcement drift detection
OpenSpec SHALL use stable scoped identities to detect stale enforcement after normative removal and broken or missing enforcement for surviving normative claims.

#### Scenario: Removed requirement leaves stale binding
- **WHEN** a prepared spec no longer contains an ID still listed by a binding
- **THEN** validation reports the binding and stale covered ID
- **AND** synchronization does not promote the pair until coverage is reconciled

#### Scenario: Removed scenario leaves stale binding
- **WHEN** a scenario is removed while a binding still covers its stable ID
- **THEN** validation reports that binding as stale enforcement

#### Scenario: Removed target leaves hanging claim
- **WHEN** an active binding targets a file that no longer exists
- **THEN** validation reports the missing target, binding ID, and covered normative IDs
- **AND** the covered claims are not reported as ready

### Requirement: Retired enforcement cleanup candidates
OpenSpec SHALL report no-longer-referenced enforcement targets as cleanup candidates when requirements, scenarios, or bindings are removed, without deleting project code automatically.

#### Scenario: Binding removed with its requirement
- **WHEN** a change removes a normative ID and its binding
- **THEN** synchronization reports the binding's former test, lint, fixture, or review targets as retired candidates

#### Scenario: Target remains shared
- **WHEN** another surviving binding references a retired candidate
- **THEN** the candidate is reported as still shared
- **AND** apply guidance does not treat it as safe automatic cleanup

### Requirement: Resolvable enforcement targets
OpenSpec SHALL validate active binding paths and working directories inside the selected project root before reporting enforcement readiness.

#### Scenario: Existing target
- **WHEN** every active target and working directory resolves inside the project root
- **THEN** structural target validation passes

#### Scenario: Missing target
- **WHEN** an active target does not exist
- **THEN** validation reports the binding ID, structured field, missing path, and covered IDs

#### Scenario: Escaping target
- **WHEN** a target or working directory resolves outside the selected project root
- **THEN** validation rejects it without accessing the external location

### Requirement: Workflow-executed automated enforcement
Governed verification SHALL run affected automated bindings using their declared executable and argument vector, associate results with covered IDs, and fail readiness when a mandatory check fails or cannot run.

#### Scenario: Automated check passes
- **WHEN** an affected binding's declared command exits successfully
- **THEN** verify records a passing automated result for its covered IDs

#### Scenario: Automated check fails
- **WHEN** a mandatory declared command exits unsuccessfully or cannot start
- **THEN** verify reports the failure output and affected stable IDs
- **AND** marks governed archive not ready

### Requirement: Semantic correspondence review
Governed verification SHALL distinguish executable success from review of whether a changed binding plausibly proves the normative claim it covers.

#### Scenario: Passing check asserts the wrong contract
- **WHEN** an automated command passes but the changed check does not plausibly correspond to its covered requirement or scenario
- **THEN** verify reports a review-strength correspondence issue separately from command status

### Requirement: Pair-coherent synchronization
OpenSpec SHALL prepare and validate each governed specification and enforcement update together before promoting that pair to current specs.

#### Scenario: Pair validation fails
- **WHEN** a prepared pair contains a duplicate ID, stale binding, hanging mandatory claim, unresolved status, or missing active target
- **THEN** neither member of that pair is promoted
- **AND** actionable diagnostics identify the conflict

#### Scenario: Pair validation succeeds
- **WHEN** both prepared files and their coverage validate
- **THEN** synchronization updates the complete pair and reports requirement, scenario, binding, and retired-target changes together

### Requirement: Governed workflow archive gate
The governed archive workflow SHALL block when required enforcement is missing, planned, stale, broken, or failing, except through the existing explicit validation-bypass path.

#### Scenario: Enforcement ready
- **WHEN** all affected mandatory bindings are active, structurally valid, and successfully verified
- **THEN** the governed archive workflow may proceed

#### Scenario: Explicit validation bypass
- **WHEN** the user deliberately invokes the supported validation bypass with required confirmation
- **THEN** archive records that enforcement validation was skipped
- **AND** does not present the archive as fully verified
