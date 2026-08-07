# Enforcement: The review panel judges every reviewed plane through a projected lens set

Paired with `spec.md` (`agents.review-panel`). The default binding is a **review**
binding: in a consuming project the panel's lens set is projected into the
generated review-panel skill, which the project does not own as code — so the
review of whether the panel judges each plane is honestly review-strength
evidence, not a project-owned test.

A repository that OWNS the panel (its own generated skill and the projection that
produces it, e.g. Specbase itself) should REPLACE the review binding with an
automated `test` one asserting the generated skill's lens set conforms to the
projection — Specbase itself binds `lens-conformance` to a vitest over the
generated review-panel skill.

```yaml
version: 1
spec: agents.review-panel
bindings:
  - id: panel-review
    covers:
      - panel-covers-planes
      - lens-per-plane
      - lenses-conform
      - panel-reviews-implemented-specs
      - minimal-model-still-reviews
      - added-plane-refines
    mechanism: review
    strength: review
    status: active
    targets:
      - specbase/config.yaml
    review:
      procedure: >-
        Confirm the generated review-panel skill names one lens per resolved
        plane carrying a `reviewLens` (plus the cross-cutting enforcement lens and
        any declared augmentation), holds no lens the projection does not name,
        and stays non-empty (a general spec-conformance reviewer when no plane
        declares a `reviewLens`). Compare the skill's lens table to the plane
        roster in the resolved model.
      inputs:
        - the generated review-panel skill
        - specbase/config.yaml (the resolved review model)
        - specbase/specs/agents/review-panel/spec.md
    limitations: A review confirms the projected lens set by inspection, not by
      an automated conformance check against the generated skill.
```