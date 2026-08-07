---
id: behavior.governed.review-panel
---

### Requirement: Non-deterministic enforcement is executed by a panel of blind lenses
**ID:** blind-lens-panel
The system SHALL execute non-deterministic enforcement through a panel of focused
reviewer lenses. Each lens SHALL judge exactly one concern, SHALL be blind to the
others, and SHALL be told which concerns the other lenses own. The panel SHALL be a
per-codebase set that grows as the codebase earns new concerns. A cross-cutting
enforcement lens SHALL judge whether a bound check actually exercises the claim it
covers, auditing automated and review bindings alike, and SHALL NOT review its own
verdicts.

#### Scenario: A lens judges one concern only
**ID:** lens-single-concern
- **WHEN** the panel runs over a change
- **THEN** each lens judges only its own concern and is told which concerns the other lenses own

#### Scenario: The enforcement lens audits evidence adequacy
**ID:** enforcement-lens-audits-evidence
- **WHEN** the enforcement lens reviews a binding's declared check
- **THEN** it assesses whether the check exercises the covered claim rather than merely running
- **AND** it audits automated bindings as well as review bindings, but never its own verdicts

### Requirement: A lens claims a spec-tree subtree, and the most specific one wins
**ID:** lens-scope-routing
A lens SHALL declare its scope as a plane-qualified locator subtree. The router SHALL
assign each affected governed pair to the most specific lens whose subtree covers it,
falling back to the lens its plane declares and then up the tree. The router SHALL
spawn only the lenses whose subtrees the change touches, plus the always-on
cross-cutting lenses, and SHALL log every lens it skipped and why.

#### Scenario: Scoped lens takes precedence inside its subtree
**ID:** scoped-lens-wins
- **WHEN** a scoped lens covers a nested subtree and a change touches a pair beneath it
- **THEN** the router selects the scoped lens rather than the plane-wide lens

#### Scenario: A pair falls back to its plane's lens
**ID:** plane-lens-fallback
- **WHEN** a governed pair declares no explicit lens and no scoped lens covers it
- **THEN** the router resolves it to the lens its plane declares

#### Scenario: A design-system pair routes to the design lens
**ID:** design-system-routes-to-design
- **WHEN** a pair under the design-system plane declares no explicit lens
- **THEN** the router resolves it to the design lens, which asks whether the interface and its copy honor the declared tokens, principles, and voice

#### Scenario: Router scales to the changed surface
**ID:** router-scales-to-change
- **WHEN** a change touches only part of the spec tree
- **THEN** the router spawns only the lenses whose subtrees are touched plus the cross-cutting lenses
- **AND** it logs every skipped lens and the reason

### Requirement: The panel reviews only the residue above the deterministic gate
**ID:** residue-above-gate
The system SHALL run the project's declared deterministic checks before the
reviewers and SHALL pass each lens the findings already covered together with the
deterministic binding IDs it is blind to, so a lens reports only what the
deterministic layer does not already prove. As deterministic bindings are added to a
review binding's declared residue, the reviewed surface SHALL shrink with no edit to
any lens method.

#### Scenario: Deterministic findings are not re-reviewed
**ID:** no-double-reporting
- **WHEN** a review binding names a sibling automated binding as already covering part of its territory
- **THEN** the lens executing that review binding is told those checks are covered and does not re-report them

#### Scenario: Residue shrinks without a lens edit
**ID:** residue-shrinks
- **WHEN** a new deterministic binding is added to a review binding's declared residue
- **THEN** the reviewed surface shrinks and the lens method is unchanged

### Requirement: Panel findings are refuted, critiqued, and never gate
**ID:** findings-non-gating
The system SHALL attempt to refute a high-severity finding with an independent second
opinion before reporting it, SHALL run a completeness critic that names any lens that
should have run and did not, and SHALL emit a read-only severity-grouped report
attributed by lens. Panel findings SHALL be reported as review-strength evidence and
SHALL NOT block archive, verification readiness, or strict coverage gating.

#### Scenario: A zealous finding is refuted
**ID:** refute-verified
- **WHEN** a lens reports a high-severity finding
- **THEN** an independent reviewer attempts to refute it and only surviving findings are reported at high severity

#### Scenario: A missing lens is named
**ID:** completeness-critic
- **WHEN** the panel finishes its reviewers
- **THEN** a completeness critic names any lens that should have run and did not

#### Scenario: Review evidence never gates
**ID:** review-never-gates
- **WHEN** the panel reports findings for a change
- **THEN** they are recorded as review-strength and fail neither archive readiness nor strict coverage gating

### Requirement: A lens carries method only, and the panel grows by proposal
**ID:** policy-read-at-review-time
A lens method SHALL hold only its reviewing method. The project policy a lens applies
SHALL be read at review time from the governed specs its scope covers and SHALL NOT
be copied into the lens. A new or scoped lens SHALL be added through the ordinary
change workflow and SHALL NOT be created automatically.

#### Scenario: A spec edit changes the review with no lens edit
**ID:** policy-follows-the-specs
- **WHEN** a spec inside a lens's subtree is edited
- **THEN** the next panel run reflects the edited spec with no change to the lens method

#### Scenario: A lens gap is proposed, not auto-created
**ID:** lens-growth-by-proposal
- **WHEN** exploration or verification finds a claim that no deterministic check and no existing lens covers
- **THEN** the workflow proposes pointing it at an existing lens or adding a new scoped lens as a change, and creates no lens automatically
