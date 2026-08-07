# Enforcement: The review-panel skill is available in every project

Paired with `spec.md` (`behavior.cli.review-panel-availability`). The observable
contract is that init/update install the review-panel skill in both flat and
governed projects and that the installed skill names exactly the lenses the
project's resolved model implies. One vitest over fixtures covers both
requirements — availability and per-project lens content are the same observable
output of the same command.

```yaml
version: 1
spec: behavior.cli.review-panel-availability
bindings:
  - id: availability-and-lens-content
    covers:
      - panel-available-every-project
      - flat-gains-skill
      - governed-retains-skill
      - skill-names-own-lenses
      - governed-sees-declared-lenses
      - flat-sees-general-reviewer
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init/review-panel-availability.test.ts
    run:
      command: pnpm
      args:
        - test
        - --
        - test/core/init/review-panel-availability.test.ts
      cwd: .
    limitations: Runs init/update over a flat fixture and a governed fixture
      (one declaring ops and design lenses), asserting the skill is present in
      each and that its named lenses match the resolved model; does not judge
      the skill's review quality.
```
