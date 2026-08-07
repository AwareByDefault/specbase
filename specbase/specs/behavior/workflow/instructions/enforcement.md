# Enforcement: Workflow Instructions

Paired with `spec.md` (`behavior.workflow.instructions`). Enrichment, context and
rule injection, artifact-ID validation, governed pair context, and planning-home
path resolution all bind to real suites — including an end-to-end suite that
proves instruction paths follow a planning home outside the repository. The
rendered section layout (tag order, one bullet per rule, schema guidance sitting
alongside config rules) is asserted by no suite and is behavioural-lens review
residue.

```yaml
version: 1
spec: behavior.workflow.instructions
bindings:
  - id: instruction-enrichment-tests
    covers: [artifact-instructions, instructions-metadata-and-template, instructions-dependency-state, instructions-unlocked, context-injection, context-present, context-absent, context-multiline, verbatim-injection, verbatim-markup-characters, rules-scoped-to-artifact, rules-for-named-artifact, rules-absent-for-others, rules-differ-per-artifact]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/instruction-loader.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/instruction-loader.test.ts]
      cwd: .
    limitations: Covers the generator directly — metadata, template body, per-dependency done/missing state, root-artifact marking, unlocked artifacts, context present/absent/multi-line/special-characters, and rules keyed by artifact including the empty and non-matching cases; it asserts the structured fields the renderer consumes, not the rendered text, so tag names and section order are not proven here.

  - id: instructions-command-tests
    covers: [instructions-metadata-and-template, instructions-when-blocked, instructions-on-empty-change, apply-instructions, apply-context-ready, apply-context-blocked, context-present, rules-for-named-artifact, rules-absent-for-others]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts]
      cwd: .
    limitations: Spawns the real CLI for artifact instructions on scaffolded and blocked artifacts and for both the ready and blocked implementation paths, and confirms config context and matching rules reach the output while non-matching rules do not; it matches on injected text rather than on the surrounding tag structure.

  - id: rules-id-validation-tests
    covers: [rules-id-validation-at-load, config-loads-despite-unknown-key, warning-at-instruction-time, no-warning-for-valid-keys, warning-once-per-session]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/instruction-loader.test.ts
      - test/core/project-config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/instruction-loader.test.ts, test/core/project-config.test.ts]
      cwd: .
    limitations: Proves a config keyed by an unknown artifact ID loads without error and that the warning is raised at instruction time and withheld for valid keys; the deduplication case asserts only that at least one warning was seen, so "shown once per session" is not actually pinned by it.

  - id: resolved-planning-path-tests
    covers: [instructions-use-resolved-paths, repo-local-paths-preserved, external-planning-home-paths]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/cli-e2e/store-lifecycle.test.ts
      - test/commands/declared-store-fallback.test.ts
    run:
      command: pnpm
      args: [test, --, test/cli-e2e/store-lifecycle.test.ts, test/commands/declared-store-fallback.test.ts]
      cwd: .
    limitations: Spawns the CLI against a planning home outside the repository and asserts the emitted artifact path points into that home, and against a repository-held change for the unchanged case; it covers the artifact instruction path, not every path field of the implementation context.

  - id: governed-instruction-context-tests
    covers: [governed-instruction-context, governed-spec-instructions, governed-enforcement-instructions, governed-apply-context, non-governed-instructions-unchanged]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/governed-context.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/governed-context.test.ts]
      cwd: .
    limitations: Covers plane target roots, complete and incomplete delta pairs with their identities and paired paths, the link to the corresponding current pair, the deduped current-pair file set, and the no-op under a non-governed schema; unit-level, so the identity requirements are checked as emitted context rather than as enforced authoring rules.

  - id: instruction-rendering-review
    covers: [rules-formatting, rules-one-bullet-each, rules-section-order, rules-are-additive, schema-guidance-and-rules-both-shown, verbatim-markdown, verbatim-multiline-rule]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/workflow/instructions.ts
    review:
      procedure: >-
        Read the instruction renderer. Confirm the project-context block is
        emitted before the rules block and the rules block before the template
        block; that each rule is written as its own bullet with its text
        interpolated raw, so Markdown and embedded line breaks pass through
        untouched; and that the schema's own artifact instruction is emitted as
        its own block rather than being replaced by the config's rules.
      inputs:
        - src/commands/workflow/instructions.ts
    limitations: Review-strength; no suite asserts the rendered section order or the bullet shape, so layout and pass-through fidelity rest on inspection. The underlying values reaching the renderer are covered automatically.
    covered_by: [instruction-enrichment-tests, instructions-command-tests]
```
