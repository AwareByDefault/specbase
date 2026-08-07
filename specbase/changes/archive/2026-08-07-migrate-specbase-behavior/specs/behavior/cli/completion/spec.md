---
id: behavior.cli.completion
---

## ADDED Requirements

### Requirement: The completion command generates, installs, and removes completion scripts
**ID:** completion-subcommands
The `completion` command SHALL expose `generate`, `install`, and `uninstall`
subcommands, each accepting an optional shell name. When the shell name is
omitted, the subcommand SHALL act on the shell the session is running in.

#### Scenario: The three operations are available
**ID:** subcommands-available
- **WHEN** a user asks for the `completion` command's help
- **THEN** `generate`, `install`, and `uninstall` are listed
- **AND** each accepts an optional shell name

### Requirement: Completion supports a fixed set of named shells
**ID:** supported-shells
Completion SHALL be available for `zsh`, `bash`, `fish`, and `powershell`. A
shell name SHALL be accepted whatever its letter case. A name outside that set
SHALL be refused before anything is generated or written.

#### Scenario: A named shell is matched case-insensitively
**ID:** shell-name-case-insensitive
- **WHEN** a user names a supported shell in any letter case
- **THEN** the command acts on that shell

#### Scenario: An unsupported shell name is refused
**ID:** unsupported-shell-refused
- **WHEN** a user names a shell outside the supported set
- **THEN** the command refuses
- **AND** no script is generated and no file is written

### Requirement: An unnamed shell is detected from the session
**ID:** shell-auto-detection
When no shell is named, the CLI SHALL determine the shell from the running
session, preferring the process that invoked it over the configured login shell.
An explicitly named shell SHALL always win over detection. When no shell can be
determined, the command SHALL say so and ask for the shell to be named.

#### Scenario: The running shell is used
**ID:** detect-from-session
- **WHEN** a user runs a completion subcommand without naming a shell
- **THEN** the shell of the running session is detected and used

#### Scenario: An explicit name overrides detection
**ID:** explicit-shell-wins
- **WHEN** a user names a shell that differs from the detected one
- **THEN** the command acts on the named shell

#### Scenario: Undetectable shell asks to be named
**ID:** detect-fails-asks-explicitly
- **WHEN** the session offers nothing to detect a shell from
- **THEN** the command reports that it could not detect the shell
- **AND** asks the user to name one

### Requirement: Generation writes a native completion script to stdout
**ID:** generated-script-on-stdout
The `completion generate` subcommand SHALL write the completion script for the
target shell to stdout and write nothing else there, so the output can be
redirected to a file. The script SHALL use the target shell's own completion
mechanism and SHALL NOT change that shell's completion trigger or navigation
behavior, so completions feel native to users of that shell.

#### Scenario: Only the script reaches stdout
**ID:** script-only-on-stdout
- **WHEN** a user generates a completion script
- **THEN** stdout carries the completion script and no status or progress text
- **AND** redirecting stdout to a file yields a usable script

#### Scenario: The script speaks the shell's own idiom
**ID:** script-uses-native-conventions
- **WHEN** a completion script is generated for a supported shell
- **THEN** it registers itself through that shell's native completion mechanism
- **AND** it adds no custom trigger or navigation behavior of its own

### Requirement: Completion offers the project's own change and spec names
**ID:** dynamic-value-completion
Where a command takes a change or a spec, completion SHALL offer the names that
exist in the current project: the active changes, excluding archived ones, and
the specs. Outside an initialized project only the static commands and options
SHALL be offered. Discovered names SHALL be cached briefly and refreshed once the
cache expires, so repeated completions do not rescan the project.

#### Scenario: Active names are offered
**ID:** project-names-offered
- **WHEN** a user requests completion for an argument that takes a change or a
  spec inside an initialized project
- **THEN** the active change names or the spec names are offered

#### Scenario: Archived changes are not offered
**ID:** archived-excluded
- **WHEN** change names are discovered for completion
- **THEN** archived changes are excluded from the offered names

#### Scenario: Outside a project only static names are offered
**ID:** outside-project-static-only
- **WHEN** a user requests completion outside an initialized project
- **THEN** no change or spec names are offered
- **AND** the static commands and options are still offered

#### Scenario: Repeated completions reuse a short-lived cache
**ID:** dynamic-values-cached
- **WHEN** completion values are requested twice inside the cache window
- **THEN** the second request reuses the discovered names
- **AND** a request after the window rediscovers them

### Requirement: Installation wires completion into the shell and is safe to repeat
**ID:** idempotent-install
The `completion install` subcommand SHALL write the generated script where the
target shell loads completions from, SHALL create the directories it needs, and
SHALL add the loading line to the shell's configuration only when that line is
not already present. Overwriting an existing script SHALL leave a backup copy.
Re-running installation SHALL be safe and SHALL report that completion is already
current. On success the command SHALL report where it installed and how to reload
the shell, and SHALL report each step it took when asked to be verbose.

#### Scenario: The script is written and the shell is wired to load it
**ID:** install-writes-and-wires
- **WHEN** a user installs completion for a supported shell
- **THEN** the script is written where that shell loads completions from
- **AND** any missing directory is created first
- **AND** the loading line is added to the shell's configuration only when absent

#### Scenario: Re-installing is safe
**ID:** install-idempotent
- **WHEN** completion is installed again for a shell that already has it
- **THEN** the command reports the existing installation
- **AND** an overwritten script is backed up before it is replaced

#### Scenario: Success names the location and the reload step
**ID:** install-reports-location-and-reload
- **WHEN** installation succeeds
- **THEN** the command reports where the script was installed
- **AND** how to reload the shell so completion takes effect

#### Scenario: Verbose installation narrates its steps
**ID:** install-verbose-steps
- **WHEN** a user asks for verbose installation
- **THEN** the detected shell, the target paths, and the configuration changes are
  each reported

### Requirement: Uninstallation removes only what installation added
**ID:** clean-uninstall
The `completion uninstall` subcommand SHALL ask for confirmation before removing
anything unless the user already agreed, SHALL delete the installed script, SHALL
remove the loading lines installation added while leaving the rest of the shell's
configuration untouched, and SHALL report when there is nothing installed to
remove.

#### Scenario: Removal is confirmed first
**ID:** uninstall-confirms
- **WHEN** a user uninstalls completion without having already agreed
- **THEN** the command asks for confirmation
- **AND** declining leaves the installed script and the configuration untouched

#### Scenario: The script and its loading lines go, the rest stays
**ID:** uninstall-removes-script-and-config
- **WHEN** an uninstall is confirmed
- **THEN** the installed completion script is deleted
- **AND** the loading lines installation added are removed
- **AND** every other line of the shell's configuration is preserved

#### Scenario: Nothing installed is reported, not silently ignored
**ID:** uninstall-not-installed
- **WHEN** a user uninstalls completion that was never installed
- **THEN** the command reports that completion is not installed
