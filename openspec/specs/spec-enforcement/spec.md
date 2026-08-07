# spec-enforcement Specification

## Purpose
TBD - created by archiving change add-review-panel-enforcement. Update Purpose after archive.
## Requirements
### Requirement: Review bindings name a lens and their deterministic residue
A governed enforcement binding whose mechanism is non-deterministic (`review` or `manual`) MAY declare a `lens` naming the review-panel lens that executes it, and MAY declare a `covered_by` list of sibling binding IDs whose deterministic checks already own part of its territory. Both fields SHALL be optional and additive; their absence SHALL NOT change how any existing binding parses or how coverage and drift are computed.

#### Scenario: Review binding names its lens
- **WHEN** a `review` binding declares `lens: architectural`
- **THEN** the binding parses with that lens recorded, and the review panel routes the binding's covered claims to that lens

#### Scenario: Covered-by lists the deterministic residue
- **WHEN** a `review` binding declares `covered_by` referencing sibling binding IDs in the same pair
- **THEN** those IDs are recorded so the executing lens reviews only the residue those deterministic checks do not already prove

#### Scenario: Fields are optional and backward-compatible
- **WHEN** a binding declares neither `lens` nor `covered_by`
- **THEN** it parses exactly as before and coverage, drift, and validation are unchanged

