---
id: architecture.completion
---

### Requirement: Each supported shell is served by one generator interface
**ID:** shell-generator-interface
Every supported shell SHALL be served by a completion generator that
implements one common interface: it declares the shell it targets and renders
a complete completion script from command definitions. Shell-specific syntax,
escaping, and script structure SHALL live only inside that shell's generator.

#### Scenario: Generator declares its shell
**ID:** generator-declares-shell
- **WHEN** a completion generator is inspected
- **THEN** it declares the shell it targets
- **AND** it exposes the same rendering entry point as every other generator

#### Scenario: Script rendered from definitions alone
**ID:** generator-renders-from-definitions
- **WHEN** a generator is given command definitions
- **THEN** it returns a complete script for its shell
- **AND** the definitions it consumed carry no shell-specific content

#### Scenario: Supporting a new shell adds a generator
**ID:** new-shell-adds-generator
- **WHEN** support for a new shell is added
- **THEN** a new generator implements the common interface
- **AND** no existing generator changes

### Requirement: Each supported shell is served by one installer interface
**ID:** shell-installer-interface
Every supported shell SHALL be served by an installer that implements one
common interface: install a rendered script, and uninstall it. Shell-specific
installation paths, configuration-file edits, and backup handling SHALL live
only inside that shell's installer.

#### Scenario: Install and uninstall are symmetric
**ID:** installer-installs-and-uninstalls
- **WHEN** an installer installs a completion script and later uninstalls it
- **THEN** both operations report their outcome through the same result shape
- **AND** uninstalling removes what installing added

#### Scenario: Installation location is the installer's business
**ID:** installer-owns-shell-paths
- **WHEN** a completion script must be placed for a shell
- **THEN** that shell's installer decides the path and the configuration edit
- **AND** no caller computes the location on the installer's behalf

### Requirement: Every shell consumes one command registry
**ID:** single-command-registry
The completable CLI surface — commands, subcommands, flags, and positional
arguments — SHALL be defined once in a single registry, and every shell
generator SHALL render from that registry. No generator SHALL carry its own
command list. The registry SHALL stay in step with the commands, flags, and
aliases the CLI actually exposes.

#### Scenario: One registry feeds every shell
**ID:** every-generator-reads-registry
- **WHEN** a completion script is generated for any supported shell
- **THEN** the generator renders the same single registry
- **AND** adding a command to the registry makes it completable in every shell

#### Scenario: Registry tracks the real CLI
**ID:** registry-matches-cli
- **WHEN** the registry is compared against the CLI's visible commands
- **THEN** the command names, aliases, flags, and positional arguments agree
- **AND** a command or flag added to the CLI without the registry is detected
