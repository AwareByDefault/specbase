# Enforcement: The Governed Spec Model

Paired with `spec.md` (`behavior.governed`). Plane resolution, locator safety,
identity, pair resolution, and the schema shape of a plane record all bind to
existing unit suites. The plane-membership *judgments* — what belongs on the
`agents` plane, what belongs on `design-system`, and the diagnostics for reserved
or colliding plane ids — are honest review residue above those suites.

```yaml
version: 1
spec: behavior.governed
bindings:
  - id: plane-resolution-tests
    covers:
      - governance-from-plane-selection
      - governance-never-contradicts
      - planes-as-schema-data
      - schema-defaults-resolve
      - project-appends-plane
      - project-replaces-planes
      - malformed-override-ignored
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/shared/skill-generation.test.ts
      - test/core/artifact-graph/spec-model.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/shared/skill-generation.test.ts, test/core/artifact-graph/spec-model.test.ts]
      cwd: .
    limitations: Exercises plane merge, replace, and the empty-set governance derivation at unit level; it does not run a full CLI session to prove every command honors the resolved set.

  - id: governed-vs-legacy-branching
    covers:
      - planes-mean-governed
      - no-planes-mean-flat
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/governed-context.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/governed-context.test.ts]
      cwd: .
    limitations: Proves status and instruction context branch on the resolved model and that no governed field leaks into a legacy project; archive and sync branching are proved by their own suites, not here.

  - id: plane-metadata-schema-tests
    covers:
      - plane-metadata-record
      - plane-required-fields
      - single-offerable-list
      - plane-optional-lens
      - agents-plane-opt-in
      - design-system-opt-in
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/governed-schema.test.ts
      - test/core/governed/review-panel.conformance.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/governed-schema.test.ts, test/core/governed/review-panel.conformance.test.ts]
      cwd: .
    limitations: Asserts the shipped plane records carry the required fields, the single offer-able list, its default-selected subset, and that declared review lenses resolve; it does not prove a picker renders that state.

  - id: locator-discovery-and-pair-tests
    covers:
      - open-plane-locators
      - pair-under-declared-plane
      - nested-locator-normalized
      - undeclared-plane-rejected
      - unsafe-locator-rejected
      - basename-collision
      - no-implicit-inheritance
      - namespace-not-incomplete
      - parent-coexists-with-children
      - governed-pair-resolution
      - resolve-by-locator
      - resolve-by-stable-id
      - incomplete-pair-surfaces
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/locator.test.ts
      - test/core/governed/discovery.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/locator.test.ts, test/core/governed/discovery.test.ts]
      cwd: .
    limitations: Locator normalization is asserted by treating a native backslash path segment-by-segment rather than by running on a second operating system, and the undeclared-plane case is asserted as a parse rejection rather than as rendered CLI output.

  - id: stable-identity-tests
    covers:
      - stable-scoped-identities
      - identity-survives-move
      - identity-survives-retitle
      - open-plane-prefix-accepted
      - duplicate-identity-reported
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/spec-id-index.test.ts
      - test/core/governed/spec-parser.test.ts
      - test/core/schemas/governed-spec.schema.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/spec-id-index.test.ts, test/core/governed/spec-parser.test.ts, test/core/schemas/governed-spec.schema.test.ts]
      cwd: .
    limitations: Covers spec-ID indexing, duplicate detection with every source location, slug-not-title identity, and the ID grammar; binding-ID uniqueness within an enforcement file is proved by the enforcement parser suite instead.

  - id: plane-declaration-validation-tests
    covers:
      - plane-declaration-validation
      - non-kebab-plane-id
      - missing-plane-purpose
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/spec-model.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/spec-model.test.ts]
      cwd: .
    limitations: Asserts the schema rejects a non-kebab id and a missing purpose; it does not assert the wording or source location of the rendered diagnostic.

  - id: plane-membership-diagnostics-review
    covers:
      - reserved-plane-id
      - duplicate-plane-id
      - unknown-plane-prefix
      - cross-cutting-plane
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/artifact-graph/types.ts
      - src/core/governed/locator.ts
      - src/core/governed/spec-id-index.ts
    review:
      procedure: >-
        Read the plane schema and the locator and spec-ID resolvers. Confirm the
        reserved plane ids are rejected, that a duplicated or collision-appended
        plane id is reported with its source locations, that a spec id whose
        prefix is not a declared plane is reported rather than silently indexed,
        and that a plane marked cross-cutting is never treated as a storage root
        during discovery.
      inputs:
        - src/core/artifact-graph/types.ts
        - src/core/governed/locator.ts
        - src/core/governed/spec-id-index.ts
        - src/core/governed/discovery.ts
    limitations: No shipped plane declares cross-cutting today, so the storage-home exclusion is verified by inspection only; the reserved and duplicate cases have schema-level guards but no dedicated assertion.
    covered_by: [plane-declaration-validation-tests, stable-identity-tests]

  - id: plane-catalog-review
    covers:
      - agents-plane-membership
      - repo-instrument-qualifies
      - agent-rule-excluded
      - imported-tooling-excluded
      - design-system-plane-membership
      - identity-not-behavior
      - token-stratum-automated
      - voice-stratum-review
    mechanism: review
    strength: review
    status: active
    targets:
      - schemas/spec-driven-governed/schema.yaml
      - src/core/templates/workflows/explore.ts
    review:
      procedure: >-
        Read each plane's declared purpose in the governed schema and the plane
        classifier baked into the explore guidance. Confirm the `agents` plane
        admits only instruments the repository owns and turns away agent
        behavior rules and imported tooling, and that the `design-system` plane
        is described as expressed identity split into a token stratum bound to
        automated audits and a voice stratum bound to review judgment.
      inputs:
        - schemas/spec-driven-governed/schema.yaml
        - src/core/templates/workflows/explore.ts
    limitations: Classification is a judgment about which truths an author files where; the suites prove only that the plane records exist and that the classifier text ships, never that a given spec was filed correctly.
    covered_by: [plane-metadata-schema-tests]
```
