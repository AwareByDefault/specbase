# Enforcement: Shell completion structure

Paired with `spec.md` (`architecture.completion`). Each shell's generator and
installer suite asserts interface conformance for that shell, and the registry
suite compares the registry against the live Commander program — a real drift
check. The "one registry, and only one" claim is a whole-repo negative, so it
binds the `architectural` review lens over the residue.

```yaml
version: 1
spec: architecture.completion
bindings:
  - id: generator-interface-tests
    covers: [shell-generator-interface, generator-declares-shell, generator-renders-from-definitions]
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
    limitations: Every shell's suite opens with an interface-compliance block asserting the declared shell and the rendering entry point, then renders scripts from plain command definitions. Conformance is asserted per shell, so a fifth shell added without a suite would go unasserted.

  - id: installer-interface-tests
    covers: [shell-installer-interface, installer-installs-and-uninstalls, installer-owns-shell-paths]
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
    limitations: Each installer is exercised for install, re-install, backup, uninstall, and its own path resolution against a temporary home directory. The suites do not assert that the four installers share a declared interface type; that is a compile-time fact checked by the build.

  - id: registry-cli-parity
    covers: [single-command-registry, registry-matches-cli]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/completions/command-registry.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/completions/command-registry.test.ts]
      cwd: .
    limitations: Walks the live Commander program and compares visible commands, subcommands, aliases, flags, and positionals against the registry, so CLI-side drift fails the suite. It asserts the registry's fidelity, not that every generator reads it.

  - id: completion-command-routing
    covers: [every-generator-reads-registry]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/completion.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/completion.test.ts]
      cwd: .
    limitations: Exercises generate, install, and uninstall routing to a per-shell generator and installer through the single selection point. The installer is mocked, and the suite does not assert the registry instance passed to each generator.

  - id: single-registry-review
    covers: [new-shell-adds-generator, every-generator-reads-registry]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/commands/completion.ts
      - src/core/completions/factory.ts
      - src/core/completions/command-registry.ts
    review:
      procedure: >-
        Read the completion command and every shell generator. Confirm the
        command registry is passed in from the one shared definition and that
        no generator declares, imports, or hard-codes command names, flags, or
        subcommands of its own. Confirm the per-shell selection point is the
        only place a shell maps to an implementation, so adding a shell means
        adding a generator, an installer, and one selection entry.
      inputs:
        - src/commands/completion.ts
        - src/core/completions/factory.ts
        - src/core/completions/command-registry.ts
        - src/core/completions/generators/zsh-generator.ts
        - src/core/completions/generators/bash-generator.ts
        - src/core/completions/generators/fish-generator.ts
        - src/core/completions/generators/powershell-generator.ts
    limitations: Architectural-lens review of the residue above the suites below. The suites prove each generator renders whatever definitions it is handed; only inspection proves none of them keeps a second source of commands.
    covered_by: [registry-cli-parity, completion-command-routing, generator-interface-tests]
```
