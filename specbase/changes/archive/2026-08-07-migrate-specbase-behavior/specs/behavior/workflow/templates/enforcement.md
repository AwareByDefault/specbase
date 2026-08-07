# Enforcement: Workflow Templates

Paired with `spec.md` (`behavior.workflow.templates`). The templates command and
template loading bind to real suites, as does the existence and parseability of
the governed schema's per-plane authoring templates. What no suite checks is the
*content* of the design-system template — that its two strata and its describe
direction are actually demonstrated — so that is behavioural-lens review residue.

```yaml
version: 1
spec: behavior.workflow.templates
bindings:
  - id: templates-command-tests
    covers: [templates-command, templates-default-schema, templates-named-schema, templates-report-source]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts]
      cwd: .
    limitations: Spawns the real CLI for the resolved schema, an explicitly named schema, and a schema drawn from project config, and asserts each entry carries a template path and a source label; only the package source is observed, so the project and user labels are exercised by the resolver suite rather than through this command.

  - id: template-loading-tests
    covers: [template-loading, template-loaded, template-missing]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/instruction-loader.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/instruction-loader.test.ts]
      cwd: .
    limitations: Covers loading a template from a named schema's directory and the failure carrying the template path for both a missing template and a missing schema; unit-level, so the CLI's rendering of that failure is not observed.

  - id: governed-template-shipping-tests
    covers: [per-plane-authoring-templates, governed-templates-present, templates-parse-cleanly]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/governed-schema.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/governed-schema.test.ts]
      cwd: .
    limitations: Asserts every per-plane template ships non-empty, that every artifact the governed schema declares has its template on disk, and that the behavioural and architectural examples parse with a stable identity plus requirement and scenario identities; it does not parse the ops, code-quality, or design-system examples, and it does not inspect what any template teaches.

  - id: design-system-template-content-review
    covers: [design-system-template]
    mechanism: review
    strength: review
    status: active
    targets:
      - schemas/spec-driven-governed/templates/design-system-spec.md
    review:
      procedure: >-
        Read the shipped design-system authoring template. Confirm it carries
        stable-identity frontmatter, states the direction in which a
        design-system spec describes its subject, and shows both strata — the
        token stratum and the voice stratum — each with at least one added
        requirement carrying a scenario.
      inputs:
        - schemas/spec-driven-governed/templates/design-system-spec.md
    limitations: Review-strength; the suite proves the template ships and is non-empty, but nothing asserts its content teaches the two strata or the describe direction.
    covered_by: [governed-template-shipping-tests]
```
