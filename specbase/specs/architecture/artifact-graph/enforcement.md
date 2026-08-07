# Enforcement: Artifact graph structure

Paired with `spec.md` (`architecture.artifact-graph`). The three DAG
invariants are asserted directly by the schema parser suite, and two further
entry points — schema resolution and the `schema validate` command — are shown
to reject the same defects. That the parse boundary is the *only* validator is
a negative claim, so it binds the `architectural` review lens.

```yaml
version: 1
spec: architecture.artifact-graph
bindings:
  - id: dag-invariant-tests
    covers: [acyclic-graph, self-cycle-rejected, cycle-rejected, resolvable-requires, dangling-requires-rejected, unique-artifact-ids, duplicate-id-rejected]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/schema.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/schema.test.ts]
      cwd: .
    limitations: Asserts each rejection with a distinct case - self-reference, a two-artifact cycle, a longer cycle whose error lists every id in order, a dangling dependency reference, and a duplicated id. Cases are hand-written schemas, not a property-based search over arbitrary graphs.

  - id: load-path-validation-tests
    covers: [validated-at-parse-boundary, every-load-path-validates]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/resolver.test.ts
      - test/commands/schema.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/resolver.test.ts, test/commands/schema.test.ts]
      cwd: .
    limitations: Shows two further entry points rejecting the same defects - schema resolution throws on a cyclic user override, and the schema validate command reports circular dependencies and unknown dependency references. It covers the entry points that exist today rather than proving a future one would also validate.

  - id: parse-boundary-review
    covers: [validated-at-parse-boundary, no-duplicate-validators]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/artifact-graph/schema.ts
      - src/core/artifact-graph/graph.ts
      - src/core/artifact-graph/resolver.ts
      - src/commands/schema.ts
    review:
      procedure: >-
        Trace every path that turns schema content into an artifact graph -
        file load, schema resolution, raw content, and the schema commands.
        Confirm each one reaches the single parse function that performs the
        cycle, dangling-reference, and duplicate-id checks. Flag any consumer
        that parses schema YAML itself, that builds a graph from an
        unvalidated structure, or that re-implements a dependency-graph check
        the parse boundary already performs.
      inputs:
        - src/core/artifact-graph/schema.ts
        - src/core/artifact-graph/graph.ts
        - src/core/artifact-graph/resolver.ts
        - src/core/artifact-graph/instruction-loader.ts
        - src/commands/schema.ts
        - src/commands/workflow/templates.ts
    limitations: Architectural-lens review of the residue above the suites below. The suites prove the known entry points reject invalid schemas; only inspection can show no path constructs a graph around the parse boundary.
    covered_by: [dag-invariant-tests, load-path-validation-tests]
```
