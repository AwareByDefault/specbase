# Enforcement: The review panel judges every governed plane

Paired with `spec.md` (`agents.review-panel`). The default binding is a **review**
binding: in a consuming project the review panel is the lens set OpenSpec applies
over the project's specs, which the project does not own as code — so agentic
review is honestly review-strength evidence, not a project-owned test.

A repository that OWNS the panel (its own lens set in code) should REPLACE this
binding with an automated `test` one asserting the resolved lens set conforms to
the lenses this spec declares — e.g. OpenSpec itself binds `lens-conformance` to
a vitest over `src/core/governed/lenses.ts`.

```yaml
version: 1
spec: agents.review-panel
bindings:
  - id: lens-conformance
    covers:
      - panel-covers-planes
      - lens-per-plane
      - lenses-conform
      - panel-reviews-implemented-specs
      - minimal-model-still-reviews
      - added-plane-refines
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/review-panel-projection.conformance.test.ts
    run:
      command: pnpm
      args:
        - test
        - --
        - test/core/templates/review-panel-projection.conformance.test.ts
      cwd: .
    limitations: Asserts the generated skill's lens set equals the projection of the
      resolved review model and that the panel keeps a non-empty
      spec-conformance job for a minimal model; does not judge whether each
      lens's question is the right one.
  - id: lens-questions-are-right
    covers:
      - panel-covers-planes
    mechanism: review
    strength: review
    status: active
    review:
      lens: enforcement
      procedure: On the enforcement lens, read each projected lens's question and
        judge whether it actually captures its plane's concern rather than
        merely naming the plane. Flag a lens whose question is vacuous or
        misaimed.
      inputs:
        - the generated review-panel skill's lens table
        - the resolved plane roster and each plane's purpose
    limitations: Subjective judgment of question quality; covered_by the
      lens-conformance binding for the mechanical set-equality residue.
```
