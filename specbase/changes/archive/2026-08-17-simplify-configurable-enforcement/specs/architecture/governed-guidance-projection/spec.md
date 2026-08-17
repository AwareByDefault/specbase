---
id: architecture.governed-guidance-projection
---

## Purpose
Generated governed guidance is a projection of the resolved project model, so agents classify truth and evidence from repository-owned configuration rather than frozen product rosters.

## ADDED Requirements

### Requirement: Governed guidance projects the resolved enforcement types
**ID:** `guidance-projects-enforcement-types`
Every governed guidance surface that authors, applies, verifies, or reviews enforcement SHALL derive its enforcement type IDs, purposes, strengths, and source kinds from the resolved spec model at generation time. No generated surface SHALL present a fixed mechanism roster that differs from the model it was generated from.

#### Scenario: Custom types appear in generated guidance
**ID:** `custom-enforcement-types-projected`
- **WHEN** a project resolves an enforcement type not selected by the schema defaults
- **THEN** every enforcement-authoring surface names that type and its declared purpose

#### Scenario: Removed types disappear from generated guidance
**ID:** `removed-enforcement-types-not-projected`
- **WHEN** project config replaces the default types and omits one
- **THEN** regenerated guidance does not instruct agents to use the omitted type

### Requirement: Guidance treats a binding as a typed source edge
**ID:** `guidance-teaches-compact-binding`
Governed guidance SHALL teach authors that one binding map entry contains `type`, `covers`, and `source`, that the binding key supplies stable identity, and that the referenced source owns execution or procedure details. Guidance SHALL bind at requirement level and SHALL derive scenario coverage from the requirement.

#### Scenario: Authoring guidance shows the compact shape
**ID:** `compact-shape-projected`
- **WHEN** a governed proposal or continuation surface explains enforcement authoring
- **THEN** its example uses `enforcement.yaml` with the compact three-field binding shape
- **AND** it does not request inline commands, targets, procedures, or limitations
