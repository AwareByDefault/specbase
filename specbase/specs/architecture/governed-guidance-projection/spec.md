---
id: architecture.governed-guidance-projection
---

## Purpose
Generated governed guidance is a projection of the resolved project model, so agents classify truth and evidence from repository-owned configuration rather than frozen product rosters.

### Requirement: Governed guidance projects the resolved spec model
**ID:** `guidance-projects-resolved-model`
Every governed guidance surface — each workflow's skill projection and command
projection — SHALL derive its plane roster, plane purposes, and enforcement
flavors from the resolved spec model at generation time. No generated surface
SHALL present a plane roster that differs from the model it was generated from.

#### Scenario: A multi-plane repo's surfaces list its full roster
**ID:** `multi-plane-roster-projected`
- **WHEN** governed surfaces are generated for a project whose resolved model
  declares planes beyond the two-plane minimum
- **THEN** every generated surface enumerates exactly the declared planes with
  their declared purposes

#### Scenario: Changing the roster re-projects every surface
**ID:** `roster-change-reprojects-all`
- **WHEN** a plane is added to or removed from the project's roster and the
  surfaces are regenerated
- **THEN** every regenerated surface reflects the new roster
- **AND** no surface retains the prior roster

#### Scenario: Teaching prose follows the roster
**ID:** `pedagogy-follows-roster`
- **WHEN** a guidance surface teaches the governed model as a concept (the
  onboarding lesson)
- **THEN** its lesson enumerates the declared planes
- **AND** it states no fixed plane count that a differing roster would falsify

### Requirement: No guidance surface embeds a frozen roster
**ID:** `no-frozen-roster`
The shared governed-guidance source SHALL expose plane-aware guidance only as a
function of a resolved spec model. It SHALL NOT declare a static plane-roster
constant that a guidance surface can interpolate in place of the resolved model.

#### Scenario: Guidance requires a resolved model
**ID:** `guidance-requires-model`
- **WHEN** a workflow template composes governed guidance into its output
- **THEN** it supplies the resolved spec model to obtain that guidance
- **AND** no back-compat alias yields guidance without one

### Requirement: Default planes carry curated pedagogy, added planes derive theirs
**ID:** `curated-defaults-derived-extras`
The governed primer SHALL supply curated trigger pedagogy for every
default-shipped plane, and SHALL derive a purpose-matched classification block
for any plane the project declares beyond the defaults.

#### Scenario: Every default plane has curated triggers
**ID:** `every-default-plane-curated`
- **WHEN** the primer is built for a model containing the default-shipped planes
- **THEN** each default plane's classifier block carries its curated trigger
  list rather than the generic purpose-matched fallback

#### Scenario: A user-added plane gets a derived block
**ID:** `user-added-plane-derived`
- **WHEN** the primer is built for a model declaring a plane outside the
  shipped defaults
- **THEN** that plane's classifier block is derived from its declared purpose
  and enforcement flavor

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
