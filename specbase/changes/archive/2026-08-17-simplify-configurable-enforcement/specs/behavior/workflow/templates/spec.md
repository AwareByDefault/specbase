---
id: behavior.workflow.templates
---

## Purpose
Governed planning templates carry an enforcement idea from commitment through design and delivery, so a compact permanent manifest never leaves an implementer to invent what its referenced source must do.

## ADDED Requirements

### Requirement: Governed planning artifacts define enforcement before its source exists
**ID:** `planning-artifacts-define-enforcement`
The governed proposal, design, and task templates SHALL carry the planned enforcement for every affected durable truth at the level appropriate to that artifact. Removing execution detail from `enforcement.yaml` SHALL NOT remove the change-time definition of what evidence must be built.

#### Scenario: Proposal states enforcement intent
**ID:** `proposal-states-enforcement-intent`
- **WHEN** a governed change proposes new or modified durable truth
- **THEN** its proposal names the planned enforcement type and source for each affected claim family
- **AND** states the outcome that source must establish

#### Scenario: Design defines the source contract
**ID:** `design-defines-enforcement-source`
- **WHEN** a planned source needs implementation or material revision
- **THEN** the design states what it must assert or observe, its native harness or environment, its failure signal, and its known boundary

#### Scenario: Tasks deliver and execute the source
**ID:** `tasks-deliver-enforcement-source`
- **WHEN** implementation work is planned
- **THEN** tasks separately cover implementing or updating the source, linking it from `enforcement.yaml`, executing it through its native harness, and recording the outcome

### Requirement: Permanent manifests do not absorb planning detail
**ID:** `manifest-remains-an-index`
The templates SHALL keep assertion design, execution procedure, rationale, and delivery steps in proposal, design, tasks, and source artifacts while keeping each permanent manifest binding limited to `type`, `covers`, and `source`.

#### Scenario: Planning detail has one temporal home
**ID:** `planning-detail-stays-out-of-manifest`
- **WHEN** an author follows the governed templates from proposal through implementation
- **THEN** the planning artifacts explain what evidence will be built and the source implements it
- **AND** the resulting manifest contains only the durable claim-to-source relationship
