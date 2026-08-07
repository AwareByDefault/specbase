---
id: code-quality.spec-authoring
---

### Requirement: Spec ceremony scales to risk
**ID:** progressive-rigor
Spec ceremony SHALL be proportional to the risk and coordination cost of the
change it governs. A local, reversible change SHALL be specified with concise
behavior-first requirements and minimal ceremony. A change that breaks a
contract, migrates data or layout, crosses a team or repository boundary, or
touches security or privacy SHALL carry proportionally more detail and explicit
validation expectations.

#### Scenario: Routine change stays thin
**ID:** routine-change-stays-thin
- **WHEN** a change is local, low-risk, and reversible
- **THEN** its requirements stay concise and behavior-first
- **AND** no extra artifact is demanded for ceremony's sake

#### Scenario: High-risk change earns detail
**ID:** high-risk-change-earns-detail
- **WHEN** a change breaks an API contract, is migration-heavy, crosses a team
  or repository boundary, or is security/privacy sensitive
- **THEN** the spec states edge cases and explicit validation expectations in
  proportion to that risk

#### Scenario: Ceremony is traceable to a risk
**ID:** ceremony-traceable-to-risk
- **WHEN** a reviewer asks why a requirement carries heavy ceremony
- **THEN** the risk that justifies it is identifiable from the change itself,
  not from habit or from a template's shape

### Requirement: Requirements state verifiable contracts, not mechanism
**ID:** behavior-first-boundary
A requirement SHALL state an externally checkable contract — an observable
outcome, interface, error, or constraint — and SHALL NOT narrate the mechanism
that produces it. Concrete library choices, class or function structure, and
execution mechanics SHALL be recorded in `design.md`, `tasks.md`, or the code.

#### Scenario: Observable outcome required
**ID:** observable-outcome-required
- **WHEN** an author writes a requirement in a `spec.md`
- **THEN** the requirement names what an outside observer can check
- **AND** each of its scenarios is testable or explicitly verifiable

#### Scenario: Mechanism is routed out of the spec
**ID:** mechanism-routed-out
- **WHEN** a detail is a concrete library choice, a class/function structure, or
  an execution mechanic
- **THEN** it is recorded in `design.md`, `tasks.md`, or the code
- **AND** it is not authored as a requirement

#### Scenario: Structural truth is authored as an invariant
**ID:** structural-truth-as-invariant
- **WHEN** a claim is about package responsibility, allowed dependency
  direction, composition ownership, or another structural invariant
- **THEN** it is authored on the architecture plane
- **AND** it states what must remain true rather than the temporary plan that
  gets there

#### Scenario: Tool behavior is itself observable
**ID:** tool-behavior-is-observable
- **WHEN** a repo-owned test or lint tool exposes durable user-visible behavior
- **THEN** that behavior is specified on the plane whose actor demands it
- **AND** the structural claim binds the tool through enforcement rather than
  embedding the tool's implementation in a spec

### Requirement: The default spec is the smallest one still testable and reviewable
**ID:** lightweight-by-default
Authoring SHALL default to the smallest spec that remains testable and
reviewable. A requirement SHALL earn its place by guarding a contract that could
otherwise break silently. A claim that already has a home locator SHALL NOT be
restated in another pair or another plane.

#### Scenario: Smallest testable spec wins
**ID:** smallest-testable-spec
- **WHEN** an author drafts a pair
- **THEN** the pair carries the fewest requirements and scenarios that still make
  the contract checkable

#### Scenario: A requirement earns its place
**ID:** requirement-earns-its-place
- **WHEN** a candidate requirement guards nothing that could break silently
- **THEN** it is not authored, and the code and its tests carry the detail

#### Scenario: Truth is stated once
**ID:** no-restatement
- **WHEN** a claim already has a home locator
- **THEN** other pairs reference that locator instead of restating the claim

### Requirement: Specs state current truth; history stays in the archive
**ID:** current-truth-only
A spec SHALL describe what is true now, not the transition that produced it.
Rationale, superseded claims, and migration narratives SHALL live in archived
proposals and designs.

#### Scenario: Refactor rewrites current truth
**ID:** refactor-updates-current-truth
- **WHEN** a responsibility or a contract moves
- **THEN** the current pair is rewritten to describe the new structure
- **AND** the archived proposal and design preserve why the transition occurred

#### Scenario: No migration narrative in a spec
**ID:** no-migration-narrative
- **WHEN** a requirement would describe a temporary or in-progress state
- **THEN** it is authored as the end state, or it is not authored until the end
  state is known

#### Scenario: Superseded claims are removed
**ID:** superseded-claims-removed
- **WHEN** a claim is no longer true
- **THEN** it is removed from the spec rather than kept with a historical note
