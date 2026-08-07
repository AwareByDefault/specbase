# Enforcement: Init

Paired with `spec.md` (`behavior.cli.init`). The scaffolding, tool-selection,
generation, preference, and migration claims bind to the existing `init`,
tool-detection, template, and adapter suites. The plane picker, baseline
planting, and phase reporting are honest behavioural-lens review of source that
no suite exercises. Plane seeding, command-surface capability, and install scope
are `planned`: the current source does not yet implement them, and each binding
records the specific gap.

```yaml
version: 1
spec: behavior.cli.init
bindings:
  - id: init-structure-and-config-tests
    covers: [store-scaffolding, structure-created, config-created, config-preserved]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.test.ts]
      cwd: .
    limitations: Asserts the created directory tree, that the config file records the resolved schema, and that an existing config is byte-preserved; it does not assert the wording that reports created versus preserved.

  - id: init-tool-selection-tests
    covers: [tool-detection-and-confirmation, detected-preselected, explicit-tool-selection, explicit-tools-win, tools-all, tools-none, reserved-not-combinable, non-interactive-detected-fallback, non-interactive-nothing-detected]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.test.ts
      - test/core/available-tools.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.test.ts, test/core/available-tools.test.ts]
      cwd: .
    limitations: The picker itself is mocked, so pre-checking is asserted through the choice objects handed to it rather than through a rendered prompt.

  - id: tool-picker-presentation-review
    covers: [configured-listed-first, nothing-detected-full-list]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/init.ts
    review:
      procedure: >-
        Read the tool-selection routine in src/core/init.ts. Confirm that
        already-configured tools are reported by name, pre-checked, and sorted
        ahead of merely detected tools, that a detected-but-unconfigured tool is
        offered unchecked in extend mode, and that the choice list is built from
        every supported tool that owns a skills directory, independently of what
        was detected.
      inputs:
        - src/core/init.ts
    limitations: Ordering and the full-list construction are verified by reading the source, not by an assertion on rendered output.
    covered_by: [init-tool-selection-tests]

  - id: picker-interaction-tests
    covers: [picker-toggles-and-confirms]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/prompts/searchable-multi-select.test.ts
    run:
      command: pnpm
      args: [test, --, test/prompts/searchable-multi-select.test.ts]
      cwd: .
    limitations: Exercises the prompt component's toggle, confirm, and empty-selection validation directly; it does not run the component inside an init invocation, and typed filtering is not asserted.

  - id: generation-profile-delivery-tests
    covers: [profile-driven-generation, profile-workflows-only, delivery-skills-only, delivery-commands-only, delivery-both, commands-optional-per-tool, skills-only-tool-supported, commands-skipped-reported]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.test.ts
      - test/core/shared/skill-generation.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.test.ts, test/core/shared/skill-generation.test.ts]
      cwd: .
    limitations: Covers the default and custom profiles and all three delivery settings for a few tools; it does not sweep every supported tool, and the skipped-command report is asserted for one skills-only tool.

  - id: skill-header-tests
    covers: [skill-frontmatter, frontmatter-fields, cli-pre-approved]
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
    limitations: Asserts the header fields and the CLI pre-approval entry across every deployed template; that a real agent honors the field and stays unrestricted for other tools is outside any suite.

  - id: oh-my-pi-artifact-tests
    covers: [oh-my-pi-artifacts, omp-file-layout, omp-hyphen-references, omp-arguments-exposed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/command-generation/adapters.test.ts
      - test/utils/command-references.test.ts
      - test/core/available-tools.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/command-generation/adapters.test.ts, test/utils/command-references.test.ts, test/core/available-tools.test.ts]
      cwd: .
    limitations: Exercises the command-file path, header, hyphen rewrite, and argument injection at the generator level; a full init run writing the Oh My Pi skills directory is not exercised, and the agent actually receiving the argument value is inferred from the injected line.

  - id: preference-application-tests
    covers: [configured-preferences-applied, stored-profile-applied, stored-delivery-applied, no-profile-confirmation, profile-option-not-persisted]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.test.ts
      - test/core/global-config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.test.ts, test/core/global-config.test.ts]
      cwd: .
    limitations: Stored preferences are written to a temporary config location, so the real user-level config path is never touched; the absence of a confirmation prompt is asserted by the prompt mock never being called.

  - id: extend-and-reinit-tests
    covers: [extend-mode, extra-tool-added, reinit-preserves-and-cleans, delivery-cleanup-on-reinit]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.test.ts]
      cwd: .
    limitations: Re-runs init in a temporary project and asserts that a second tool is added, existing artifacts are refreshed, and command files disappear when delivery changes; it does not assert the already-initialized reporting or the outcome of an extend run that selects nothing new.

  - id: extend-mode-review
    covers: [extend-continues-to-selection, empty-extend-succeeds, extra-workflows-kept, cleanup-when-templates-current]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/init.ts
    review:
      procedure: >-
        Read the extend-mode path in src/core/init.ts. Confirm that an existing
        store short-circuits structure creation and still reaches tool
        selection; that a run adding no new tool completes without raising the
        already-initialized error and leaves the store and config untouched;
        that regeneration rewrites only the active profile's artifacts and
        never deletes a workflow outside the profile; and that the
        delivery-driven removal runs on every re-init, not only when a template
        version changed.
      inputs:
        - src/core/init.ts
    limitations: Verified by reading the source; no suite drives an extend run that selects nothing new, nor one where every template is already current.
    covered_by: [extend-and-reinit-tests]

  - id: init-migration-tests
    covers: [init-migration, reinit-migrates, fresh-project-not-migrated]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/migration.test.ts
      - test/core/init.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/migration.test.ts, test/core/init.test.ts]
      cwd: .
    limitations: The shared migration routine is exercised directly and once through an extend-mode init; the no-migration path for a brand-new project is asserted through the resulting default-profile artifacts rather than by observing that migration was skipped.

  - id: phase-reporting-review
    covers: [setup-phase-reporting, silent-validation, phase-completion-reported]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/init.ts
    review:
      procedure: >-
        Read the execute path in src/core/init.ts. Confirm that the validation
        step emits nothing on success and only raises on failure, and that the
        structure-creation step and each per-tool setup step report their own
        completion naming the tool.
      inputs:
        - src/core/init.ts
    limitations: Suites mock the console, so no assertion exists on the emitted phase output; this is read-only inspection.

  - id: plane-picker-review
    covers: [plane-picker, single-governance-picker, plane-defaults-precheck, toggle-all-planes, no-planes-no-list]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/init.ts
    review:
      procedure: >-
        Read the plane-selection prompt in src/core/init.ts. Confirm that one
        multi-select is built from the schema's offered planes, that each
        choice's initial checked state comes from the plane record's declared
        default, that a select-all affordance is offered, that no separate
        governed yes/no prompt or per-plane opt-in prompt exists anywhere in the
        init path, and that an empty selection writes a config with no plane
        list.
      inputs:
        - src/core/init.ts
    limitations: No suite drives the plane picker; the select-all affordance comes from the prompt library and is asserted nowhere.

  - id: baseline-planting-review
    covers: [baseline-planting, planted-without-change, agents-baselines-planted, existing-baseline-preserved, unselected-plane-not-planted]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/init.ts
    review:
      procedure: >-
        Read the baseline-planting routine in src/core/init.ts. Confirm that it
        runs only when the owning plane was selected, that it copies each spec
        and its paired enforcement file straight into the store's specs tree
        with no change entry created, that an existing destination file is
        skipped rather than overwritten, and that the agents plane plants both a
        spec-driven pair and a review-panel pair.
      inputs:
        - src/core/init.ts
    limitations: No suite plants a baseline; idempotence and the no-change-entry property are verified by reading the copy routine.
```
