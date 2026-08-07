# Enforcement: Workflow Profiles

Paired with `spec.md` (`behavior.config.profiles`). Profile resolution, delivery
semantics, storage defaults and the interactive flow all bind to real suites.
The residue is the negative claim that changing preferences touches no project
file anywhere, and the current-state header the flow prints before its first
prompt — neither is asserted by an existing test.

```yaml
version: 1
spec: behavior.config.profiles
bindings:
  - id: profile-resolution-tests
    covers: [profile-definitions, core-resolves-defaults, core-ignores-custom-list, custom-resolves-declared-list, custom-empty-list]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/profiles.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/profiles.test.ts]
      cwd: .
    limitations: Resolves workflow sets from in-memory arguments; it does not read the profile off a stored configuration.

  - id: delivery-semantics-tests
    covers: [delivery-independent-of-profile, delivery-both, delivery-skills-only, delivery-commands-only]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/init.test.ts
      - test/core/update.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/init.test.ts, test/core/update.test.ts]
      cwd: .
    limitations: Proves each delivery value installs and omits the right surfaces for the tools the suites cover; it does not sweep every profile against every delivery value.

  - id: preference-storage-tests
    covers: [profile-preferences-stored-globally, preference-fields, absent-preferences-default, delivery-default]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/global-config.test.ts
      - test/commands/config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/global-config.test.ts, test/commands/config.test.ts]
      cwd: .
    limitations: Covers the stored shape, the accepted keys and the core/both defaults; the file location itself is enforced by `behavior.config.global`, not here.

  - id: profile-flow-tests
    covers: [interactive-profile-configuration, independent-paths, current-value-marked, profile-derived-from-selection, no-op-writes-nothing, no-change-no-write, no-change-no-apply-prompt, preferences-applied-by-explicit-sync, apply-offered-after-change, drift-warning-when-out-of-sync]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/config-profile.test.ts
      - test/core/profile-sync-drift.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/config-profile.test.ts, test/core/profile-sync-drift.test.ts]
      cwd: .
    limitations: Drives the flow with stubbed prompts and asserts the no-op leaves the configuration file byte-identical; it never renders a real terminal session.

  - id: project-isolation-review
    covers: [config-changes-never-touch-projects, project-files-untouched, existing-projects-keep-files, current-state-shown-first]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/config-prompts.ts
      - src/commands/config.ts
    review:
      procedure: >-
        Read the profile configuration flow end to end. Confirm the only
        filesystem write on the non-apply path is the user-level configuration
        file, and that every project write happens inside the branch the user
        explicitly confirms. Then confirm the flow prints the current delivery
        value and workflow count before it issues its first prompt.
      inputs:
        - src/core/config-prompts.ts
        - src/commands/config.ts
    limitations: Review-strength residue; the "no project file anywhere is touched" claim is a negative over the whole flow that no suite asserts, and the current-state header has no automated case.
    covered_by: [profile-flow-tests]
```
