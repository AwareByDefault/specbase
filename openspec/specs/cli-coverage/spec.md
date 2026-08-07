# cli-coverage Specification

## Purpose
TBD - created by archiving change add-review-panel-enforcement. Update Purpose after archive.
## Requirements
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

### Requirement: Repository coverage summary
`openspec coverage` SHALL report, for a governed project, per-plane and per-spec enforcement coverage: requirement and scenario counts, covered and hanging requirements, an evidence-strength histogram (automated, review, manual), and one deterministic per-spec state drawn from `complete | degraded | hanging | stale | broken | incomplete-pair`.

#### Scenario: Summary over a governed repository
- **WHEN** `openspec coverage` runs in a governed project with no target
- **THEN** every governed pair appears with its locator, stable spec ID, plane, requirement counts, strength mix, and derived state
- **AND** per-plane and repository totals are reported

#### Scenario: Degraded state is factual
- **WHEN** every requirement of a spec is covered but at least one requirement's only evidence is review or manual
- **THEN** the spec's state is `degraded`
- **AND** the state derivation priority is `incomplete-pair > broken > stale > hanging > degraded > complete`

#### Scenario: Legacy project
- **WHEN** `openspec coverage` runs in a project whose resolved spec model is legacy
- **THEN** the command explains that coverage requires the governed spec model and exits non-zero
- **AND** no legacy CLI surface changes output

### Requirement: Spec drill-down
`openspec coverage <target>` SHALL resolve a governed spec by plane-qualified locator or stable spec ID and report per-requirement and per-scenario coverage: the covering bindings, each binding's mechanism, strength, status, targets, and declared limitations.

#### Scenario: Drill-down by stable ID
- **WHEN** the user requests coverage for a stable spec ID
- **THEN** each requirement lists its covering bindings with strength and targets
- **AND** hanging requirements and uncovered scenarios are identified by pair-local ID

### Requirement: Orphaned enforcement detection
`openspec coverage --orphans` SHALL report prune candidates: stale bindings together with the removed IDs they still cover, enforcement-only pairs, and active bindings whose declared targets are missing; it SHALL NOT delete anything.

#### Scenario: Stale binding surfaces as a prune candidate
- **WHEN** a binding covers a requirement or scenario ID absent from its paired spec
- **THEN** the orphan view lists the binding, its spec, and the removed IDs

#### Scenario: Unbound evidence scan
- **WHEN** `--evidence <glob>` is provided
- **THEN** files matching the glob that appear in no binding's targets are reported as unbound evidence
- **AND** unbound evidence is informational and never affects exit codes

### Requirement: Agent-consumable JSON
Every coverage view SHALL support `--json` with a stable, documented, deterministic shape: summary totals, per-spec records sorted by locator carrying stable IDs, and orphan classes, so agents can evaluate spec-surface health programmatically and join records against `validate` and `show` output.

#### Scenario: Deterministic JSON
- **WHEN** `openspec coverage --json` runs twice on an unchanged repository
- **THEN** the output is byte-identical and arrays are sorted by locator or stable ID

### Requirement: Strict gating
`openspec coverage --strict` SHALL exit non-zero when any spec state is neither `complete` nor `degraded`, or when any orphan class other than unbound evidence is non-empty; without `--strict` the command SHALL be read-only reporting with exit 0.

#### Scenario: CI rot gate
- **WHEN** `--strict` runs against a repository containing a hanging requirement or a stale binding
- **THEN** the exit code is non-zero and the offending specs and bindings are named

