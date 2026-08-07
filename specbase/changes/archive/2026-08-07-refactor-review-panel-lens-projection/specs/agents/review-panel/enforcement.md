# Enforcement: The review panel judges every reviewed plane through a projected lens set

Paired with `spec.md` (`agents.review-panel`). This change retargets the existing
`lens-conformance` binding from `src/core/governed/lenses.ts` to the **generated
review-panel skill**: the instrument's operational artifact is now the emitted
skill, and conformance asserts its lens set equals the projection of the resolved
review model. The judgment a test cannot make — whether each lens's *question* is
the right one — is an honest `review` binding on the `enforcement` lens.

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
    limitations: Asserts the generated skill's lens set equals the projection of
      the resolved review model and that the panel keeps a non-empty
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
        judge whether it actually captures its plane's concern rather than merely
        naming the plane. Flag a lens whose question is vacuous or misaimed.
      inputs:
        - the generated review-panel skill's lens table
        - the resolved plane roster and each plane's purpose
    limitations: Subjective judgment of question quality; covered_by the
      lens-conformance binding for the mechanical set-equality residue.
```
