---
id: agents.workflow
---

## Purpose

This spec governs the repo's own spec-driven workflow instruments: the feature skills
(`spcb:explore`, `spcb:propose`) and the enforcement skills (`spcb:explore-enforce`,
`spcb:propose-enforce`). It exists to make the enforcement phase a deliberate, first-class
stage rather than a lazy byproduct of the feature pass, so bindings are decided and honest
instead of hollow. The operational artifacts are the SKILL.md files and the workflow
templates; this spec describes them and asserts conformance rather than generating them.

## ADDED Requirements

### Requirement: Enforcement is an explicit phase after the feature
**ID:** enforcement-own-phase
The repo SHALL split proposal formation into a feature pass and a separate enforcement pass.
The feature pass (`spcb:explore` + `spcb:propose`) SHALL produce the proposal, the spec
deltas, and the design, and SHALL NOT write `enforcement.yaml` nor fill the proposal's
`Enforcement intent` or the design's `Enforcement design` sections, leaving them as explicit
TO-BE-FILLED placeholders. The enforcement pass (`spcb:explore-enforce` + `spcb:propose-enforce`)
SHALL subsequently fill those sections and write `enforcement.yaml` on the same change.

#### Scenario: The feature pass stops before enforcement
**ID:** feature-stops-before-enforcement
- **WHEN** `spcb:propose` runs on a change in feature mode
- **THEN** it writes `proposal.md`, the spec deltas, and `design.md`, with the enforcement
  and testing sections left as TO-BE-FILLED
- **AND** it does not create `enforcement.yaml`

#### Scenario: The enforcement pass completes the change
**ID:** enforcement-completes-change
- **WHEN** `spcb:propose-enforce` runs on the same change after `explore-enforce`
- **THEN** it writes `enforcement.yaml`, fills the proposal's `Enforcement intent`, fills the
  design's `Enforcement design`, and updates `tasks.md` with the evidence-delivery tasks

### Requirement: Explore-enforce is a verification-only pass
**ID:** explore-enforce-skill
The repo SHALL ship an `spcb:explore-enforce` skill that accepts the feature spec deltas as
given input and, for each requirement, explores how it could be observed and verified,
choosing the highest-leverage check among the resolved enforcement types and flagging any
requirement that cannot be honestly verified. The pass SHALL be focused on verification and
SHALL NOT re-explore the feature's scope or rationale.

#### Scenario: A requirement is appraised for verifiability
**ID:** requirement-appraised
- **WHEN** `spcb:explore-enforce` runs with a feature spec's requirements
- **THEN** it proposes a highest-leverage check (or an honest review/manual conclusion) for
  each requirement and flags any requirement too vague to observe

### Requirement: Propose-enforce may return testability-driven revisions
**ID:** verifiability-feedback
The repo SHALL ship an `spcb:propose-enforce` skill that, on the same change, writes
`enforcement.yaml` and fills the testing sections, and MAY emit `MODIFIED` deltas into the
existing spec or design when exploration revealed a requirement too vague to observe or a
design too coupled to test. Such revisions SHALL be limited to what verifiability requires
and SHALL NOT expand the feature's scope.

#### Scenario: An unverifiable requirement is rewritten toward observability
**ID:** rewrite-toward-verifiability
- **WHEN** `spcb:propose-enforce` finds a requirement that cannot be honestly verified
- **THEN** it MAY restate that requirement so a check can fail it, via a `MODIFIED` delta in
  the same change
- **AND** the revision does not broaden the feature for its own sake
