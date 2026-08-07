---
id: architecture.baseline-planting
---

<!--
  Architectural invariant over the init seam. It states WHAT must remain true of
  baseline planting (plane-parametric, idempotent, non-destructive, opt-in), not
  HOW the planter is coded. If a broader init/scaffolding architecture pair lands
  in `migrate-specbase-specs`, this folds into it rather than standing alone.
-->

## ADDED Requirements

### Requirement: Baseline planting is plane-parametric
**ID:** planting-is-plane-parametric
The init baseline planter SHALL plant a declared set of baseline spec pairs across
whichever planes each pair names, not a single hardcoded plane. A baseline pair
SHALL be planted from the schema's baseline templates at
`templates/baseline/<plane>/<locator>` into the project's
`specs/<plane>/<locator>`, so that one selection can plant pairs in more than one
plane.

#### Scenario: A multi-plane selection plants pairs in each named plane
**ID:** plants-across-planes
- **WHEN** a baseline selection names pairs in more than one plane
- **THEN** each pair is planted under its own plane's `specs/<plane>/<locator>`

### Requirement: Planting is idempotent and never overwrites a customization
**ID:** planting-is-idempotent
Baseline planting SHALL leave an already-present baseline file untouched. Running
init again SHALL NOT overwrite, reset, or duplicate a baseline pair a user has
edited, so a customized baseline survives re-initialization.

#### Scenario: An existing baseline file is preserved
**ID:** existing-file-preserved
- **WHEN** init plants a baseline whose target file already exists
- **THEN** the existing file content is left unchanged

#### Scenario: Re-running init changes nothing already planted
**ID:** rerun-is-noop
- **WHEN** init runs again after a baseline was already planted
- **THEN** no already-planted file is rewritten or duplicated

### Requirement: Baseline bundles are planted only when selected
**ID:** planting-is-opt-in
A baseline bundle SHALL be planted only when its init selection is accepted. When
the selection is declined, the planter SHALL plant none of that bundle's pairs, so
a consumer is never given a baseline it did not opt into.

#### Scenario: A declined bundle plants nothing
**ID:** declined-bundle-plants-nothing
- **WHEN** an init run declines a baseline bundle's selection
- **THEN** none of that bundle's pairs appear in the project's specs
