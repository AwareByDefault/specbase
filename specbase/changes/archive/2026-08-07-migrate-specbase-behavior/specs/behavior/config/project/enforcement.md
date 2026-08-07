# Enforcement: Project Configuration

Paired with `spec.md` (`behavior.config.project`). File discovery, resilient
field parsing, the context cap and plane resolution all bind to real unit
suites; the residue is that those suites resolve the planning directory by its
current fixed name rather than through the general planning-root resolver, and
that the "a broken config never halts the command" leg is asserted at loader
level rather than end-to-end.

```yaml
version: 1
spec: behavior.config.project
bindings:
  - id: config-file-discovery-tests
    covers: [project-config-file, config-file-parsed, config-file-absent, config-file-malformed, yml-extension-alias, yml-fallback, yaml-preferred]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/project-config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/project-config.test.ts]
      cwd: .
    limitations: Exercises discovery against a temporary project directory; the planning root is supplied by the test rather than resolved from a live working directory.

  - id: resilient-parsing-tests
    covers: [resilient-field-parsing, invalid-field-dropped, partial-entries-kept, absent-field-is-quiet, context-size-limit, context-within-limit, context-over-limit]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/project-config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/project-config.test.ts]
      cwd: .
    limitations: Covers field-level parsing and the 50KB cap for the shipped field set; a newly added config field gets no coverage until its own case is written.

  - id: plane-resolution-tests
    covers: [declared-plane-set, planes-append, planes-replace-exact, planes-default, omitted-plane-not-resolved, spec-model-kind-derived, non-empty-set-governed, empty-set-flat]
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
    limitations: Drives plane resolution from in-memory schema and config objects; it does not read a plane declaration off a real config file on disk.

  - id: planning-root-and-degradation-review
    covers: [project-config-file, config-errors-never-halt, command-continues-on-bad-config, warning-on-stderr, declared-kind-not-authoritative]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/project-config.ts
      - src/core/planning-home.ts
      - src/core/shared/skill-generation.ts
    review:
      procedure: >-
        Confirm three things by reading the loader. First, that the config file
        is located relative to the resolved planning directory rather than a
        directory name spelled inline at each call site. Second, that every
        failure path returns defaults and writes its warning to the error
        stream, so no caller can be made to abort on a bad config. Third, that
        the resolved spec-model kind is computed from the resolved plane count
        on every path, with no branch letting a declared kind survive.
      inputs:
        - src/core/project-config.ts
        - src/core/planning-home.ts
        - src/core/shared/skill-generation.ts
    limitations: Review-strength residue above the unit suites; the no-halt claim is verified by inspecting call sites, not by running a command against a corrupt config in a real process.
    covered_by: [config-file-discovery-tests, plane-resolution-tests]
```
