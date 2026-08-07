# Enforcement: Schemas

Paired with `spec.md` (`behavior.schemas`). The two precedence chains bind to
real suites — the change-schema chain to the metadata resolver's precedence
tests, the name-lookup chain to the resolver's project/user/package tests. The
planning-home tier of the change-schema chain lives in the new-change command
rather than the shared resolver, so it is honest behavioural-lens review residue.

```yaml
version: 1
spec: behavior.schemas
bindings:
  - id: change-schema-precedence-tests
    covers: [change-schema-precedence, flag-beats-all, metadata-beats-config, config-supplies-schema, builtin-default-applies, schema-backwards-compatibility, existing-change-no-config, config-added-later]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/utils/change-metadata.test.ts
    run:
      command: pnpm
      args: [test, --, test/utils/change-metadata.test.ts]
      cwd: .
    limitations: Exercises the shared schema resolver directly (explicit flag, change metadata, project config, built-in default) including a full precedence-order case; the planning-home tier is applied by the new-change command and is not covered here, and the CLI process is not spawned.

  - id: schema-lookup-precedence-tests
    covers: [schema-lookup-precedence, project-shadows-user, project-shadows-package, falls-back-through-chain, lookup-without-project]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/resolver.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/resolver.test.ts]
      cwd: .
    limitations: Covers directory lookup and shadowing across project, user, and package locations with temp fixtures; the user location is exercised through an overridden data-directory env var rather than a real user profile.

  - id: new-change-schema-binding-tests
    covers: [new-change-binds-schema, new-change-records-config-schema, new-change-flag-overrides]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
      - test/utils/change-utils.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts, test/utils/change-utils.test.ts]
      cwd: .
    limitations: Asserts the created change's metadata records the schema the project config named and that an explicit flag is honoured; it does not prove the recorded schema survives a later edit of the project config.

  - id: planning-home-default-tier-review
    covers: [change-schema-precedence]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/workflow/new-change.ts
      - src/utils/change-metadata.ts
    review:
      procedure: >-
        Read the schema resolution in the new-change command and in the shared
        change-metadata resolver. Confirm the planning home's default schema is
        consulted after the explicit flag and the change's own metadata, and
        before the built-in default, and that no code path lets the built-in
        default win over a declared planning-home or project-config schema.
      inputs:
        - src/commands/workflow/new-change.ts
        - src/utils/change-metadata.ts
    limitations: Review-strength residue for the one precedence tier no suite exercises; the surrounding tiers are covered automatically.
    covered_by: [change-schema-precedence-tests, new-change-schema-binding-tests]
```
