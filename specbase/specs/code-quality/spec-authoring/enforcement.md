# Enforcement: Spec authoring

Paired with `spec.md` (`code-quality.spec-authoring`). These are craft rules: a
linter cannot judge whether ceremony is proportional to risk, whether a sentence
narrates mechanism, or whether a claim is restated across planes.

The repo's eslint config (`eslint.config.js`) scopes to `src/**/*.ts` and carries
exactly one project rule (`no-restricted-imports` for `@inquirer/*`). **No lint
rule governs spec prose**, so no lint conformance is bound here and none is
invented.

The one deterministic floor that does exist is the store validator: in strict
mode it rejects a requirement with no normative keyword and a requirement with no
scenario. That floor guards the *testable* half of `lightweight-by-default` and
nothing else; the code-quality lens reviews the residue above it.

```yaml
version: 1
spec: code-quality.spec-authoring
bindings:
  - id: store-validator-floor
    covers: [lightweight-by-default, smallest-testable-spec, observable-outcome-required]
    mechanism: command
    strength: automated
    status: active
    targets:
      - specbase/specs
    run:
      command: openspec
      args: [validate, --specs, --strict, --no-interactive]
      cwd: .
    limitations: >-
      Proves every requirement in the store carries a normative keyword and at
      least one scenario — the minimum that makes a requirement checkable at all.
      It makes no judgment about size, ceremony, mechanism leakage, plane
      placement, or restatement across pairs.

  - id: behavior-first-review
    covers: [behavior-first-boundary, observable-outcome-required, mechanism-routed-out, structural-truth-as-invariant, tool-behavior-is-observable]
    mechanism: review
    strength: review
    status: active
    lens: code-quality
    targets:
      - specbase/specs
      - docs/clean-spec.md
    review:
      procedure: >-
        Read each requirement body added or changed by the change under review.
        For each one, answer three questions in order. (1) Name the outside
        observer who could check this claim and the observation they would make;
        if no such observer exists, the requirement narrates mechanism — flag it
        and say where the detail belongs (`design.md`, `tasks.md`, or the code).
        (2) Check every sentence for a concrete library name, a class or function
        name, or an execution mechanic ("iterates", "caches", "computes a
        topological order"); each hit is a leak unless that mechanic is itself
        the user-facing contract. (3) For claims about packages, dependency
        direction, or ownership, confirm the requirement is on the architecture
        plane and is phrased as what must remain true rather than as a migration
        step. Where a repo-owned tool is the subject, confirm the tool's
        user-visible behavior is specified on its actor's plane and that the
        structural claim reaches the tool through an enforcement binding rather
        than through spec prose.
      inputs:
        - specbase/specs
        - docs/clean-spec.md
    limitations: >-
      Judgment-only. Nothing detects a mechanism leak mechanically; the finding
      strength is one reviewer's reading of the diff.
    covered_by: [store-validator-floor]

  - id: rigor-proportionality-review
    covers: [progressive-rigor, routine-change-stays-thin, high-risk-change-earns-detail, ceremony-traceable-to-risk, lightweight-by-default, requirement-earns-its-place, no-restatement]
    mechanism: review
    strength: review
    status: active
    lens: code-quality
    targets:
      - specbase/specs
      - docs/clean-specbase.md
    review:
      procedure: >-
        Classify the change under review as routine (local, reversible) or
        high-risk (contract-breaking, migration-heavy, cross-boundary, or
        security/privacy sensitive) using its own `proposal.md`. For a routine
        change, flag any requirement whose detail or artifact count exceeds what
        the risk earns. For a high-risk change, flag any contract that lacks
        explicit validation expectations or an edge-case scenario. Then take each
        added requirement and ask what would break silently if it were deleted;
        a requirement with no such answer is unearned — recommend deletion.
        Finally, run the restatement check from `docs/clean-specbase.md` §5:
        search the store for near-duplicate requirement text across pairs and
        planes, and flag any claim living in two homes, naming the one home
        locator it should keep.
      inputs:
        - specbase/specs
        - docs/clean-specbase.md
    limitations: >-
      "Proportional" has no threshold a check could hold. The restatement sweep
      is a manual text comparison, not an index; near-duplicates phrased
      differently will be missed.
    covered_by: [store-validator-floor]

  - id: current-truth-review
    covers: [current-truth-only, refactor-updates-current-truth, no-migration-narrative, superseded-claims-removed]
    mechanism: review
    strength: review
    status: active
    lens: code-quality
    targets:
      - specbase/specs
      - specbase/changes/archive
    review:
      procedure: >-
        Read the change's spec deltas for tense and for transition vocabulary —
        "will", "currently", "for now", "temporarily", "migrating", "legacy",
        "deprecated but". Each hit is either an end state stated in the wrong
        tense (rewrite it) or a transition that does not belong in current truth
        (move it to `proposal.md` / `design.md`, which the archive preserves).
        For every MODIFIED or REMOVED requirement, confirm the superseded text is
        gone from the spec rather than retained as a historical note, and confirm
        the reason survives in the change's own proposal or design.
      inputs:
        - specbase/specs
        - specbase/changes/archive
    limitations: >-
      Vocabulary scanning is a reviewer heuristic, not a lint rule; a migration
      narrative written in clean present tense reads as current truth and will
      pass.
```
