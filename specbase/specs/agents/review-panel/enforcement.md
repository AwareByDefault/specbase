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
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/lenses.test.ts
      - test/core/governed/review-panel.conformance.test.ts
    run:
      command: pnpm
      args:
        - test
        - --
        - test/core/governed/lenses.test.ts
        - test/core/governed/review-panel.conformance.test.ts
      cwd: .
    limitations: Asserts the resolved lens set conforms to the declared lenses; does
      not judge whether each lens's question is the right one.
```
