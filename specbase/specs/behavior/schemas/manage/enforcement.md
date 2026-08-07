# Enforcement: Managing Schemas

Paired with `spec.md` (`behavior.schemas.manage`). The parts of the surface that
run through shared library code — schema parsing, dependency-graph rejection,
listing with source labels, resolution failure — bind to real suites. The four
command bodies (`fork`, `init`, `validate`, `which`) have no suite that drives
them: the file named `test/commands/schema.test.ts` re-implements fork and name
validation inline instead of invoking the commands, so it is deliberately not
bound here and those claims are behavioural-lens review residue.

```yaml
version: 1
spec: behavior.schemas.manage
bindings:
  - id: schema-structure-and-graph-tests
    covers: [validate-schema-structure, validate-missing-field, validate-dependency-graph, validate-cycle, validate-dangling-reference, validate-valid-dag]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/schema.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/schema.test.ts]
      cwd: .
    limitations: Exercises the schema parser the validate command delegates to — missing required fields, duplicate artifact IDs, self/short/long cycles, and unknown dependency references; it does not run the validate command, so per-schema reporting, exit codes, and the pass path's summary text are unproven here.

  - id: schema-resolution-listing-tests
    covers: [listing-shows-source, list-includes-project-local, list-dedupes-shadowed, list-labels-user-and-package, validate-parse-error, validate-schema-missing]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/artifact-graph/resolver.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/artifact-graph/resolver.test.ts]
      cwd: .
    limitations: Covers listing with project/user/package source labels, single-entry deduplication of shadowed names, unparseable-YAML failure carrying the file path, and not-found failure listing available schemas; it does not prove a parse error carries a line number, and it drives the library rather than any command.

  - id: fork-command-review
    covers: [fork-copies-schema, fork-explicit-name, fork-default-name, fork-source-missing, fork-overwrite-guard, fork-blocked-by-existing, fork-force-replaces, fork-confirmed-overwrite, fork-preserves-files, fork-copies-templates, fork-copies-nested-dirs]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/schema.ts
    review:
      procedure: >-
        Read the fork subcommand body. Confirm it resolves the source by name and
        fails with the available-schema list when nothing resolves; that the
        destination defaults to the source name with a `-custom` suffix; that the
        copied `schema.yaml` has its `name` field rewritten to the destination
        name; that the recursive copy walks nested directories and copies file
        contents unchanged; and that an existing destination is only removed on
        `--force` or an affirmative confirmation, never silently.
      inputs:
        - src/commands/schema.ts
    limitations: Entirely review-strength — no suite drives the fork command, so overwrite refusal, the name rewrite, and nested-directory fidelity are verified by inspection only.

  - id: init-command-review
    covers: [init-creates-schema, init-scaffolds-files, init-rejects-bad-name, init-rejects-existing, init-sets-default, init-default-requested, init-default-declined]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/schema.ts
    review:
      procedure: >-
        Read the init subcommand body. Confirm it rejects names that are not
        kebab-case before writing anything; that it refuses an existing
        destination and points at the force flag or at forking; that the
        generated `schema.yaml` carries name, version, description, and
        artifacts and that a template file is written for every artifact it
        declares; and that the project config's default is written only when the
        user asked for it and left untouched otherwise.
      inputs:
        - src/commands/schema.ts
    limitations: Review-strength; the scaffold is not parsed back by any suite, so "the generated schema is valid" rests on inspection rather than a round-trip assertion.

  - id: validate-command-review
    covers: [validate-named-schema, validate-all-project-schemas, validate-template-existence, validate-missing-template, validate-templates-present, validate-verbose, validate-verbose-run]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/schema.ts
    review:
      procedure: >-
        Read the validate subcommand body and its schema-validation helper.
        Confirm that omitting the name walks every project-local schema and that
        the command fails when any one of them is invalid; that each artifact's
        template file is looked for and a missing one is reported naming both the
        template and the artifact; and that the verbose path emits a line for
        each check — parse, structure, template existence, dependency graph — as
        it runs rather than only at the end.
      inputs:
        - src/commands/schema.ts
    limitations: Review-strength for the command wrapper and template/verbose checks; the structural and dependency-graph faults it delegates are covered automatically.
    covered_by: [schema-structure-and-graph-tests]

  - id: which-command-review
    covers: [which-reports-resolution, which-shows-location, which-shows-shadowed, which-no-shadowing, which-not-found, which-list-mode, which-all-schemas]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/schema.ts
    review:
      procedure: >-
        Read the which subcommand body and the all-locations helper it uses.
        Confirm it reports the resolved location label and full path; that every
        lower-priority same-named schema is listed as shadowed, in priority
        order, and that nothing is reported when there is only one location; that
        an unresolvable name fails with the available-schema list; and that list
        mode reports every schema grouped by location with shadowing marked.
      inputs:
        - src/commands/schema.ts
    limitations: Review-strength; the underlying location lookup is covered automatically, but the which command's own reporting and list mode are verified by inspection.
    covered_by: [schema-resolution-listing-tests]
```
