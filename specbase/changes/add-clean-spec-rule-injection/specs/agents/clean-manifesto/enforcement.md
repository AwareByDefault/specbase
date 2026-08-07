# Enforcement: Clean manifesto rule injection

<!--
  Paired with spec.md (agents.clean-manifesto). Bindings are authored `planned`
  while the codegen, generator wiring, and checks do not yet exist; each becomes
  `active` with a real target before verify/archive.
-->

```yaml
version: 1
spec: agents.clean-manifesto
bindings:
  - id: rules-single-source
    covers: [single-source, manifestos-mark-rules, generator-has-no-inline-copy]
    mechanism: command
    strength: automated
    status: planned
    targets:
      - docs/clean-spec.md
      - docs/clean-specbase.md
      - src/core/templates/workflows/governed-guidance.ts
    run:
      command: pnpm
      args: [vitest, run, test/clean-rules-source.test.ts]
      cwd: .
    limitations: Proves the marked sections exist and the generator imports the
      generated module rather than restating rules; does not judge whether the
      distilled rules faithfully capture the manifesto's intent.

  - id: rules-drift-check
    covers: [build-propagates, generated-matches-source, stale-generated-rejected]
    mechanism: command
    strength: automated
    status: planned
    targets:
      - src/core/templates/workflows/clean-rules.generated.ts
    run:
      command: pnpm
      args: [vitest, run, test/clean-rules-drift.test.ts]
      cwd: .
    limitations: Re-runs the extraction and asserts byte-equality with the
      committed module; a passing check means the two are in sync at test time.

  - id: emitted-skill-carries-rules
    covers: [skills-carry-rules, emitted-skill-contains-rules]
    mechanism: command
    strength: automated
    status: planned
    targets:
      - src/core/templates/workflows/governed-guidance.ts
    run:
      command: pnpm
      args: [vitest, run, test/generated-skill-rules.test.ts]
      cwd: .
    limitations: Generates a skill into a temp dir without docs/ and asserts the
      rules are present and no docs/ path is referenced.

  - id: propose-surface-present
    covers: [propose-surfaces-structure, placement-shown-with-rationale, writing-quality-ungated]
    mechanism: command
    strength: automated
    status: planned
    targets:
      - src/core/templates/workflows/governed-guidance.ts
    run:
      command: pnpm
      args: [vitest, run, test/propose-structure-surface.test.ts]
      cwd: .
    limitations: Asserts the generated propose guidance contains the
      structure-surface step and the injected writing rules; presence, not tone.

  - id: propose-surface-quality
    covers: [propose-surfaces-structure]
    mechanism: review
    strength: review
    status: planned
    covered_by: [propose-surface-present]
    targets:
      - src/core/templates/workflows/governed-guidance.ts
    review:
      procedure: Read the generated propose structure-surface step and confirm it
        reads as a genuine, discussable offer that shows the applied
        clean-specbase rule per locator — not a rubber-stamp prompt the user
        will reflexively dismiss.
      inputs:
        - src/core/templates/workflows/governed-guidance.ts
        - docs/clean-specbase.md
      lens: agents
    limitations: Judges tone and usefulness of the offer, which no linter can
      assess; the deterministic presence check is covered_by propose-surface-present.
```
