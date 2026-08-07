# Enforcement: Command generation

Paired with `spec.md` (`architecture.command-generation`). The shapes — content,
adapter, generator, registry — are asserted directly by the existing
`test/core/command-generation/*` suites, and the one-workflow-source claim by
the template parity suite. The negative half of each boundary claim ("and
nowhere else") cannot be witnessed by a test, so it binds the `architectural`
review lens with its deterministic residue named in `covered_by`.

```yaml
version: 1
spec: architecture.command-generation
bindings:
  - id: content-shape-tests
    covers: [tool-agnostic-content, content-is-portable]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/command-generation/types.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/command-generation/types.test.ts]
      cwd: .
    limitations: Asserts the content and adapter shapes compile and carry the declared fields; it cannot prove no tool-specific field was added elsewhere.

  - id: adapter-conformance-tests
    covers: [adapter-boundary, adapter-answers-path-and-format, adapter-path-scope]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/command-generation/adapters.test.ts
      - test/core/command-generation/yaml.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/command-generation/adapters.test.ts, test/core/command-generation/yaml.test.ts]
      cwd: .
    limitations: Every registered adapter is exercised for tool id, path, and formatted output, including the global-scoped tool's absolute path and frontmatter value escaping. The suite enumerates adapters explicitly, so a newly added adapter that is never listed here would go unasserted.

  - id: generator-tests
    covers: [generator-composition, generate-single-command, generate-many-commands, shared-command-body, same-body-across-tools, body-rewrites-live-in-adapter]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/command-generation/generator.test.ts
      - test/core/command-generation/adapters.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/command-generation/generator.test.ts, test/core/command-generation/adapters.test.ts]
      cwd: .
    limitations: The generator suite feeds one content through two adapters and asserts the body survives while path and frontmatter differ, plus order preservation and per-command independence. The adapter suite asserts that the tools needing hyphen-form command references or injected argument placeholders apply that rewrite inside their own adapter, from the same unmodified body. Neither proves callers never bypass the generator — see no-bypass-review.

  - id: registry-tests
    covers: [single-adapter-registry, registry-resolves-by-tool-id, unregistered-tool-yields-nothing, registry-enumerates-adapters]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/command-generation/registry.test.ts
      - test/core/legacy-cleanup.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/command-generation/registry.test.ts, test/core/legacy-cleanup.test.ts]
      cwd: .
    limitations: The registry suite asserts lookup, absence, and enumeration; the legacy-cleanup suite asserts one real consumer derives its tool ids by enumerating the registry rather than hard-coding them. Other consumers are covered by inspection only.

  - id: adapterless-tool-handling
    covers: [adapterless-tool-skipped]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/update.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/update.test.ts]
      cwd: .
    limitations: One case inside a large update suite picks a configured tool that has no registered adapter and asserts the run completes and skips its command files. The equivalent init path is asserted only by inspection.

  - id: workflow-projection-parity
    covers: [single-workflow-source, projection-parity, guidance-covers-every-workflow]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/skill-templates-parity.test.ts
      - test/core/shared/skill-generation.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/skill-templates-parity.test.ts, test/core/shared/skill-generation.test.ts]
      cwd: .
    limitations: Hashes every template payload against a baseline, asserts command contents and command templates share ids, and iterates the production registries so cross-cutting guidance reaches every projected skill and command. Payload hashes detect drift but do not by themselves prove a single registration point.

  - id: no-bypass-review
    covers: [new-tool-adds-adapter, single-generation-path, init-and-update-share-path, inspection-uses-adapter, workflow-registered-once]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/init.ts
      - src/core/update.ts
      - src/core/migration.ts
      - src/core/profile-sync-drift.ts
      - src/core/shared/skill-generation.ts
    review:
      procedure: >-
        Read every code path that writes, detects, or removes tool command
        files. Confirm each one takes its command content from the shared
        workflow source and resolves the tool's path and file format through
        the adapter registry. Flag any literal tool command directory, any
        frontmatter assembled outside an adapter, and any hand-maintained list
        of workflows or tool ids that the registries could supply. Confirm that
        adding a tool would require only a new adapter and its registration.
      inputs:
        - src/core/init.ts
        - src/core/update.ts
        - src/core/migration.ts
        - src/core/profile-sync-drift.ts
        - src/core/shared/skill-generation.ts
        - src/core/command-generation/registry.ts
    limitations: >-
      Architectural-lens review of the residue above the suites below. A test
      can show the sanctioned path works; only inspection can show no
      unsanctioned path exists. Known residue at authoring time - init and
      update still run their own write loops over the shared content and
      adapters, and apply the hyphen-command rewrite through an inline
      per-tool conditional rather than a registered transform. Both are
      duplication inside the sanctioned path, not a bypass of it.
    covered_by: [generator-tests, registry-tests, workflow-projection-parity]
```
