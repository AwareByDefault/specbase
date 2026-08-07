## ADDED Requirements

### Requirement: Verify executes the review panel for review bindings
Under the governed spec model, `/opsx:verify`'s review-procedure step SHALL execute the review panel over the affected review bindings: it SHALL route each affected `review`/`manual` binding to its lens (or the most-specific default lens for its subtree), run the panel over the residue above the bindings named in `covered_by`, and report the findings as `review`-strength evidence. Panel findings SHALL NOT flip verification readiness or block archive.

#### Scenario: Verify runs the affected lenses
- **WHEN** verification runs on a governed change touching pairs with review bindings
- **THEN** it runs the review panel for the lenses whose subtrees the change touches and reports findings attributed by lens and severity

#### Scenario: Review findings are weaker evidence
- **WHEN** the review panel reports findings during verification
- **THEN** they are recorded as `review`-strength and do not by themselves mark the change ready or not-ready to archive

#### Scenario: A non-deterministic claim without a lens is flagged
- **WHEN** an affected review claim resolves to no lens
- **THEN** verification reports it as an un-lensed review gap and suggests pointing it at an existing lens or proposing a new one

#### Scenario: Legacy verify unchanged
- **WHEN** the project's resolved spec model is legacy
- **THEN** verify guidance is byte-identical to its pre-change output
