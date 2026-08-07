# Enforcement: Completion Command

Paired with `spec.md` (`behavior.cli.completion`). The command surface, shell
detection, per-shell script generation, and install/uninstall file handling all
bind to existing suites. Two claims are honest behavioural-lens residue: that a
generated script feels native once a real shell loads it, and that uninstall asks
before it removes.

```yaml
version: 1
spec: behavior.cli.completion
bindings:
  - id: completion-command-surface-tests
    covers: [completion-subcommands, subcommands-available, supported-shells, shell-name-case-insensitive, unsupported-shell-refused, shell-auto-detection, explicit-shell-wins, detect-fails-asks-explicitly, script-only-on-stdout, install-reports-location-and-reload, install-verbose-steps, uninstall-not-installed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/completion.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/completion.test.ts]
      cwd: .
    limitations: Drives the command object with the shell detector and the installer replaced by doubles; it proves the routing, refusals, and reported output, not that a real shell loads what is written.

  - id: shell-detection-tests
    covers: [detect-from-session]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/utils/shell-detection.test.ts
    run:
      command: pnpm
      args: [test, --, test/utils/shell-detection.test.ts]
      cwd: .
    limitations: Detection is exercised through simulated environment variables and a stubbed parent-process lookup; no real shell session is spawned.

  - id: registry-surface-tests
    covers: [completion-subcommands]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/completions/command-registry.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/completions/command-registry.test.ts]
      cwd: .
    limitations: Compares the completion registry against the registered command tree; it says nothing about how any shell renders the result.

  - id: generator-tests
    covers: [generated-script-on-stdout, script-uses-native-conventions]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/completions/generators/zsh-generator.test.ts
      - test/core/completions/generators/bash-generator.test.ts
      - test/core/completions/generators/fish-generator.test.ts
      - test/core/completions/generators/powershell-generator.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/completions/generators/zsh-generator.test.ts, test/core/completions/generators/bash-generator.test.ts, test/core/completions/generators/fish-generator.test.ts, test/core/completions/generators/powershell-generator.test.ts]
      cwd: .
    limitations: Asserts each generated script's registration form, escaping, and dynamic-value hooks as text; no script is sourced by the shell it targets.

  - id: dynamic-completion-tests
    covers: [dynamic-value-completion, project-names-offered, archived-excluded, outside-project-static-only, dynamic-values-cached]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/completions/completion-provider.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/completions/completion-provider.test.ts]
      cwd: .
    limitations: Discovery, archive exclusion, and cache expiry run against temporary project directories; the outside-a-project case is covered as an empty result rather than as a shell session that falls back to static names.

  - id: installer-tests
    covers: [idempotent-install, install-writes-and-wires, install-idempotent, clean-uninstall, uninstall-removes-script-and-config]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/completions/installers/zsh-installer.test.ts
      - test/core/completions/installers/bash-installer.test.ts
      - test/core/completions/installers/fish-installer.test.ts
      - test/core/completions/installers/powershell-installer.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/completions/installers/zsh-installer.test.ts, test/core/completions/installers/bash-installer.test.ts, test/core/completions/installers/fish-installer.test.ts, test/core/completions/installers/powershell-installer.test.ts]
      cwd: .
    limitations: Installs into a temporary home directory, so directory creation, marker-guarded config edits, user-content preservation, backups, repeat installs, and removal are all proven against the file system only — never against a live shell profile.

  - id: uninstall-confirmation-review
    covers: [uninstall-confirms]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/commands/completion.ts
    review:
      procedure: >-
        Read the uninstall path in the completion command. Confirm it asks for
        confirmation whenever the user has not already agreed, and that declining
        returns before any file is deleted or any shell configuration is edited.
      inputs:
        - src/commands/completion.ts
    limitations: Review-strength; every uninstall test passes the already-agreed option, so the prompt and the decline path are unexercised.
    covered_by: [completion-command-surface-tests, installer-tests]

  - id: native-feel-review
    covers: [script-uses-native-conventions]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/completions/generators
    review:
      procedure: >-
        For each supported shell's generator, confirm the emitted script uses only
        that shell's own completion registration and helpers, and that it installs
        no custom key binding, trigger, or menu behavior that would override how
        the shell normally completes.
      inputs:
        - src/core/completions/generators
    limitations: Review-strength residue above the text assertions in the generator suites; nothing here runs a real shell, so "feels native" is judged by reading the emitted script.
    covered_by: [generator-tests]
```
