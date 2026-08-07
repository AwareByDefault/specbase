# Enforcement: The review panel judges every governed plane

Paired with `spec.md` (`agents.review-panel`). This repository OWNS the panel —
its lens set lives in `src/core/governed/lenses.ts` — so the binding is an
automated lens-conformance test, not a review-strength default.

```yaml
version: 1
spec: agents.review-panel
remove: [panel-review]
bindings:
  - id: lens-conformance
    covers: [panel-covers-planes, lens-per-plane, lenses-conform]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/lenses.test.ts
      - test/core/governed/review-panel.conformance.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/lenses.test.ts, test/core/governed/review-panel.conformance.test.ts]
      cwd: .
    limitations: Asserts the resolved lens set conforms to the declared lenses; does not judge whether each lens's question is the right one.
```
