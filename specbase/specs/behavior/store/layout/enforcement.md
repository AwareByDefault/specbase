# Enforcement: Store layout

Paired with `spec.md` (`behavior.store.layout`). The store's shape is exercised
end to end by the root-inspection, archive, list, and change-creation suites;
the plane-root claims bind the governed discovery suite. The one claim no suite
guards — that the flat legacy structure remains readable for a project that
never adopted the governed model — is an honest behavioural-lens review.

```yaml
version: 1
spec: behavior.store.layout
bindings:
  - id: planning-root-shape-tests
    covers: [planning-store-shape, healthy-store-recognized, young-store-recognized]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/openspec-root.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/openspec-root.test.ts]
      cwd: .
    limitations: Inspects a root holding the config file (both `.yaml` and `.yml`), reports missing pieces without mutating them, and accepts a root before changes, applied specs, or archives exist; it does not assert that every command routes through this inspection.

  - id: change-directory-tests
    covers: [change-directory-shape, change-layout]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/artifact-workflow.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/artifact-workflow.test.ts]
      cwd: .
    limitations: Asserts that creating a change writes its own directory with the expected documents and rejects invalid or duplicate names; the optional design document and the delta subtree are exercised through the status and instructions cases rather than asserted as a directory contract.

  - id: archive-layout-tests
    covers: [archive-layout, archive-dated-directory, archive-excluded-from-current]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.test.ts
      - test/core/list.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.test.ts, test/core/list.test.ts]
      cwd: .
    limitations: Asserts the archived directory is named `YYYY-MM-DD-<change>` under `changes/archive/` and that listing excludes the archive directory; it does not assert that every reader of the store applies the same exclusion.

  - id: governed-plane-root-tests
    covers: [governed-plane-roots, roots-match-planes, empty-plane-no-directory]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/discovery.test.ts
      - test/core/artifact-graph/spec-model.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/discovery.test.ts, test/core/artifact-graph/spec-model.test.ts]
      cwd: .
    limitations: Discovery is asserted to return plane-qualified locators, to treat a pair-less directory as a namespace, and to return an empty result when plane directories are absent; the resolved plane set drives discovery here through fixtures rather than through a live project config.

  - id: legacy-flat-store-review
    covers: [legacy-flat-store]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/openspec-root.ts
      - src/core/governed
    review:
      procedure: >-
        Confirm, by reading the store-resolution and discovery paths, that a
        project whose config declares no planes is read through the flat
        `specs/<capability>/spec.md` layout without error, and that no code path
        requires a plane root to exist before the store can be listed,
        validated, or shown.
      inputs:
        - src/core/openspec-root.ts
        - src/core/governed
    limitations: >-
      Review-strength only. The repository's own store is governed, so no suite
      exercises a project that stayed flat end to end; the governed half of the
      same decision is covered automatically.
    covered_by: [governed-plane-root-tests, planning-root-shape-tests]
```
