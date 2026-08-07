---
id: architecture.review-panel-projection
---

## ADDED Requirements

### Requirement: The review-panel skill is projected from the resolved review model
**ID:** skill-is-projection
The generated review-panel skill SHALL derive its lens set from the resolved
review model at generation time and SHALL hold no lens data that is not present
in that model's projection. The lens vocabulary SHALL come from the plane
roster's `reviewLens` fields (plus the cross-cutting `enforcement` lens and any
declared augmentation); no lens SHALL be hardcoded in the skill body or its
template.

#### Scenario: A declared lens appears; an undeclared one does not
**ID:** no-hardcoded-lens
- **WHEN** the skill is generated for a project whose roster declares a set of
  `reviewLens` ids
- **THEN** the generated skill names exactly those lenses (plus `enforcement` and
  declared augmentation) and no lens absent from the projection

#### Scenario: The generator consumes the resolved model
**ID:** generator-takes-model
- **WHEN** the skill-generation entry point is invoked
- **THEN** it receives the resolved review model as input and its output varies
  with that model, rather than ignoring it

### Requirement: The skill is regenerated on init and update for every model
**ID:** regenerated-every-model
`specbase init` and `specbase update` SHALL generate the review-panel skill for
every project regardless of spec model — flat or governed — and SHALL regenerate
it so a later change to the resolved review model re-projects the skill.
Re-projection SHALL be idempotent: regenerating against an unchanged model
produces an unchanged skill.

#### Scenario: A flat project receives the skill
**ID:** flat-project-registered
- **WHEN** `init` or `update` runs in a project with no governed planes
- **THEN** the review-panel skill is generated, carrying the general
  spec-conformance reviewer over the flat specs

#### Scenario: Changing the roster re-projects the skill
**ID:** roster-change-reprojects
- **WHEN** a plane is added to or removed from the roster and `update` runs
- **THEN** the regenerated skill's lens set reflects the new roster

#### Scenario: Re-projection is idempotent
**ID:** reprojection-idempotent
- **WHEN** `update` regenerates the skill against an unchanged resolved model
- **THEN** the generated skill is byte-identical to the prior generation
