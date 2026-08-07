## ADDED Requirements

### Requirement: Coverage reports lens allocation and review-panel gaps
`openspec coverage` SHALL report how review-strength enforcement is distributed across lenses and surface the review-panel gaps, without gating on them. It SHALL report, per lens, how many review claims it covers within its scope; SHALL report a review or manual binding whose `lens` does not resolve to a defined lens as an **un-lensed review** gap; and SHALL surface a **split candidate** when a subtree carries more review claims under a single broad lens than a configured threshold.

#### Scenario: Lens rollup in summary
- **WHEN** `openspec coverage` runs in a governed project that uses review-panel lenses
- **THEN** the output reports each lens and the number of review claims it covers

#### Scenario: Un-lensed review claim surfaced
- **WHEN** a `review` binding names a `lens` that no defined lens provides, or a review claim has no covering lens
- **THEN** coverage reports it as an un-lensed review gap and it does not affect `--strict`

#### Scenario: Split candidate surfaced
- **WHEN** a subtree carries more review claims under one broad lens than the split threshold
- **THEN** coverage surfaces the subtree as a lens split candidate, informational only

#### Scenario: Panel gaps never gate
- **WHEN** un-lensed review claims or split candidates exist
- **THEN** `openspec coverage --strict` still exits zero for them, gating only on structural rot
