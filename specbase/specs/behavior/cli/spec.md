---
id: behavior.cli
---

### Requirement: The command surface is verb-first, with nouns as scope
**ID:** verb-noun-structure
Every top-level command SHALL name an action, and the noun it acts on SHALL be
supplied as a positional argument or a scoping flag. A command SHALL NOT
require the user to know a noun namespace to reach an action.

#### Scenario: A verb reaches the action directly
**ID:** verb-first-discovery
- **WHEN** a user runs a top-level command such as `list` or `validate`
- **THEN** the verb performs the action
- **AND** the noun refines the scope through a flag or argument such as
  `--specs`, `--changes`, or an item name

#### Scenario: An ambiguous item name is disambiguated by type, not by namespace
**ID:** type-flag-disambiguation
- **WHEN** an item name matches both a change and a spec
- **THEN** the command accepts `--type change|spec` to resolve it
- **AND** the help text documents that option

### Requirement: Deprecated noun-form commands keep working and announce their replacement
**ID:** noun-form-back-compat
The CLI SHALL continue to accept the noun-prefixed command forms and the hidden
`experimental` alias, and SHALL emit a deprecation notice naming the verb-first
replacement whenever one is used. A deprecated form SHALL produce the same
result as its replacement.

#### Scenario: A noun-prefixed command runs and warns
**ID:** noun-group-warns
- **WHEN** a user runs a noun-prefixed command such as `change show` or
  `spec list`
- **THEN** the command completes with its documented behavior
- **AND** a deprecation notice naming the verb-first alternative is written to
  stderr

#### Scenario: The hidden init alias delegates
**ID:** experimental-alias
- **WHEN** a user runs `openspec experimental`
- **THEN** the command delegates to `init`
- **AND** a deprecation notice pointing at `init` is displayed
- **AND** the alias is absent from help output

#### Scenario: A deprecated option alias still resolves
**ID:** deprecated-option-alias
- **WHEN** a user passes a deprecated option alias such as
  `--requirements-only`
- **THEN** the command behaves as if the current option name had been passed

### Requirement: Every reporting command can emit machine-readable output
**ID:** json-output
Every command that reports specs, changes, coverage, configuration, schema, or
workflow state SHALL accept `--json` and SHALL then write exactly one JSON
document to stdout. In JSON mode the command SHALL suppress spinners, prompts,
and decorative output, and SHALL report failures inside the JSON document while
still exiting non-zero.

#### Scenario: JSON output is the only thing on stdout
**ID:** json-is-clean
- **WHEN** a reporting command runs with `--json`
- **THEN** stdout parses as a single JSON document
- **AND** no spinner, prompt, or progress text is mixed into it

#### Scenario: Failures are reported inside the payload
**ID:** json-error-payload
- **WHEN** a command run with `--json` fails
- **THEN** the JSON document carries the error detail
- **AND** the process exits with a non-zero code

### Requirement: An omitted item argument opens a selection prompt
**ID:** interactive-selection
When a command needs an item and the user did not name one, and the session is
interactive, the command SHALL present the available items for selection and
SHALL then act on the chosen item. Selecting interactively SHALL NOT disable any
other option the command accepts.

#### Scenario: The user picks from the available items
**ID:** picker-offered
- **WHEN** a user runs a command that needs an item without naming one, in an
  interactive session
- **THEN** the command lists the available items for selection
- **AND** acts on the selected item with the options already supplied

### Requirement: A non-interactive session is never prompted
**ID:** non-interactive-fallback
The CLI SHALL treat a session as non-interactive when `--no-interactive` is
passed, when `OPEN_SPEC_INTERACTIVE=0` is set, when a continuous-integration
environment is detected, or when stdin is not a terminal. In a non-interactive
session the CLI SHALL NOT prompt; a command missing a required item SHALL
instead print a hint naming the valid items and exit non-zero.

#### Scenario: Prompts are disabled by flag or environment
**ID:** prompts-disabled
- **WHEN** `--no-interactive` is passed or `OPEN_SPEC_INTERACTIVE=0` is set
- **THEN** no interactive prompt is displayed

#### Scenario: A missing item prints a hint instead of prompting
**ID:** hint-instead-of-prompt
- **GIVEN** a non-interactive session
- **WHEN** a command that needs an item is run without one
- **THEN** the command prints a hint listing the available item names
- **AND** exits with a non-zero code

### Requirement: Exit codes separate success from failure
**ID:** exit-codes
Every command SHALL exit 0 only when it completed the action it reported, and
SHALL exit non-zero on any failure, including an unknown command, an invalid
option value, a missing store, and a refused destructive operation.

#### Scenario: Success exits zero
**ID:** success-exit-zero
- **WHEN** a command completes its action
- **THEN** it exits with code 0

#### Scenario: An invalid option value fails
**ID:** invalid-option-exit
- **WHEN** a command is given an option value it does not accept
- **THEN** it exits with a non-zero code and reports the accepted values

#### Scenario: An unknown command fails
**ID:** unknown-command-exit
- **WHEN** a user runs a command name the CLI does not register
- **THEN** the CLI reports the name as unknown and exits with a non-zero code

### Requirement: Errors name the problem and the next action
**ID:** actionable-errors
Every error the CLI reports SHALL go to stderr and SHALL state what failed and
what the user can do next. When a name is not found, the CLI SHALL offer the
nearest matches or the list of valid names; when a name is ambiguous, it SHALL
say how to disambiguate; when the store or a required directory is missing, it
SHALL name the command that creates it.

#### Scenario: An unknown name suggests near matches
**ID:** nearest-match-suggestion
- **WHEN** a command is given an item name that does not exist
- **THEN** the error names the missing item and offers the nearest matching
  names or the full list of valid names

#### Scenario: A missing store names the fix
**ID:** missing-store-error
- **WHEN** a command runs outside an initialized project
- **THEN** the error says the store was not found and names the command that
  initializes it

#### Scenario: An unsupported value lists the supported ones
**ID:** unsupported-value-error
- **WHEN** a command is given an unsupported value, such as an unknown shell or
  an unknown tool identifier
- **THEN** the error lists the supported values

### Requirement: Delta operations are reported with the standard symbols
**ID:** delta-symbols
Wherever the CLI reports requirement deltas, it SHALL use `+` for added, `~`
for modified, `-` for removed, and `→` for renamed, and SHALL report a count per
operation.

#### Scenario: Applying deltas reports counts by symbol
**ID:** delta-counts-displayed
- **WHEN** the CLI applies or summarizes a change's deltas
- **THEN** it reports the added, modified, removed, and renamed counts using
  `+`, `~`, `-`, and `→`

### Requirement: Every command and option is offered by shell completion
**ID:** completion-registration
The completion surface SHALL stay in step with the command surface: every
non-hidden command, subcommand, alias, positional argument, and option the CLI
registers SHALL be offered by shell completion, and completion SHALL offer
nothing the CLI does not register.

#### Scenario: The completion registry matches the command tree
**ID:** registry-matches-commands
- **WHEN** the completion registry is compared with the registered command tree
- **THEN** the visible commands, aliases, positionals, and options match exactly

#### Scenario: A new command is completable without extra work
**ID:** new-command-completable
- **WHEN** a user types a partial command or option name and requests completion
- **THEN** the shell offers the matching registered commands and options

### Requirement: Output honors the terminal's color and progress conventions
**ID:** output-framing
The CLI SHALL use color only to reinforce status, and SHALL emit no color codes
when `--no-color` is passed or `NO_COLOR` is set. Long-running work SHALL show a
progress indicator in human-readable mode and none in machine-readable mode.

#### Scenario: Color is suppressed on request
**ID:** no-color-respected
- **WHEN** `--no-color` is passed or `NO_COLOR` is set in the environment
- **THEN** output contains no color escape sequences and still distinguishes
  status by text

#### Scenario: Progress is shown only to humans
**ID:** progress-human-only
- **WHEN** a command performs work that takes noticeable time
- **THEN** a progress indicator is shown in human-readable mode
- **AND** no progress indicator is written in machine-readable mode
