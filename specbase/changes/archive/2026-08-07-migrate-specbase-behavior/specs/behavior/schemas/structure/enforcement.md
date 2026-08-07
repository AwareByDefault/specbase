# Enforcement: Schema Structure

Paired with `spec.md` (`behavior.schemas.structure`). Directory layout, template
co-location, and the apply block all bind to real suites. The one claim with no
suite behind it is the project config naming a schema the project itself defines
— the config reader and the project-local lookup are each tested, but nothing
joins them end to end — so that is behavioural-lens review residue.

```yaml
version: 1
spec: behavior.schemas.structure
bindings:
  - id: schema-directory-location-tests
    covers: [self-contained-schema-directory, three-recognised-locations]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/resolver.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/resolver.test.ts]
      cwd: .
    limitations: Asserts the project, user-data, and package schema directories are each computed and searched, and that only directories carrying a schema.yaml count as schemas; the user location is exercised through an overridden data-directory env var rather than a real user profile.

  - id: template-colocation-tests
    covers: [templates-resolve-locally]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/governed-schema.test.ts
      - test/core/artifact-graph/instruction-loader.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/governed-schema.test.ts, test/core/artifact-graph/instruction-loader.test.ts]
      cwd: .
    limitations: Proves every artifact template a bundled schema declares exists inside that schema's own directory and that template loading is scoped to the named schema; it does not prove a schema directory stays self-contained after being copied elsewhere.

  - id: apply-block-tests
    covers: [apply-block, apply-block-present, apply-block-absent]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts]
      cwd: .
    limitations: Drives the real CLI over both a schema that declares an apply block and one that does not, covering the required-artifact gate, the schema instruction, and the all-artifacts fallback; the progress-tracking file is asserted through the apply output rather than by watching a run consume it.

  - id: config-project-local-schema-review
    covers: [config-names-project-local-schema, config-resolves-project-local, config-names-missing-schema]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/project-config.ts
      - src/utils/change-metadata.ts
      - src/core/artifact-graph/resolver.ts
    review:
      procedure: >-
        Follow the config `schema` field from where it is read to where the named
        schema is resolved. Confirm the value is passed through unchanged to the
        name lookup, so a name defined only in the project's own schemas
        directory resolves exactly like a packaged built-in, and confirm that a
        name matching nothing surfaces as a load failure that stops the command
        rather than a silent fallback to the built-in default.
      inputs:
        - src/core/project-config.ts
        - src/utils/change-metadata.ts
        - src/core/artifact-graph/resolver.ts
    limitations: Review-strength residue joining two separately-tested halves; the config reader and the project-local lookup each have suites, but no suite runs a command whose config names a project-defined schema.
    covered_by: [schema-directory-location-tests]
```
