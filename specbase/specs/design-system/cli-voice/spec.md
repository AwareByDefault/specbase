---
id: design-system.cli-voice
---

### Requirement: User-facing copy is terse and calm
**ID:** terse-calm-copy
User-facing CLI copy SHALL state the outcome and, where the user must act, the
next action — in as few words as carry the meaning. Copy SHALL NOT hype,
apologize, exclaim, or narrate the tool's internal steps.

#### Scenario: Outcome first, then the action
**ID:** outcome-then-action
- **WHEN** a command writes a message to the user
- **THEN** the message names what happened
- **AND** where the user must act, it names the action to take

#### Scenario: No filler
**ID:** no-filler
- **WHEN** copy is authored
- **THEN** it carries no exclamation marks, no self-congratulation, and no
  apology for the tool's own behavior

#### Scenario: No internal narration
**ID:** no-internal-narration
- **WHEN** a command reports progress
- **THEN** it names the user-meaningful step, not the internal module, function,
  or data structure doing the work

#### Scenario: Success copy renders on plain terminals
**ID:** ascii-safe-success-copy
- **WHEN** a command reports success
- **THEN** the message uses ASCII characters apart from the shared status symbols
- **AND** it stays readable in a terminal without extended font support

### Requirement: Errors name the problem and the way forward, never the user
**ID:** non-blaming-errors
An error message SHALL name what could not be done and what the user can do
next. It SHALL NOT attribute fault to the user and SHALL NOT end without a way
forward.

#### Scenario: Unsupported input lists the supported set
**ID:** unsupported-input-lists-supported-set
- **WHEN** a user names a shell the CLI does not support
- **THEN** the message states that the shell is not supported yet
- **AND** it lists the shells that are supported

#### Scenario: Undetected state offers the explicit path
**ID:** undetected-state-offers-explicit-path
- **WHEN** the CLI cannot auto-detect the user's shell
- **THEN** the message says so and asks the user to specify the shell explicitly
- **AND** it shows the usage form that does so

#### Scenario: Invalid value names the alternatives
**ID:** invalid-value-names-alternatives
- **WHEN** a user passes an unrecognized tool id to `init`
- **THEN** the message names the invalid value
- **AND** it lists the available values

#### Scenario: The condition is described, not the user
**ID:** never-blames
- **WHEN** any error message is displayed
- **THEN** its wording describes the condition that blocked the command
- **AND** it does not characterize the user's action as a mistake

### Requirement: Errors go to stderr; machine output owns stdout
**ID:** stream-routing
The CLI SHALL write errors and human-readable failure guidance to stderr, and
machine-readable output to stdout. A `--json` invocation SHALL emit JSON on
stdout and nothing on stderr.

#### Scenario: Errors on stderr
**ID:** errors-on-stderr
- **WHEN** a command fails because of unrecognized input
- **THEN** the message is written to stderr
- **AND** the command exits non-zero

#### Scenario: JSON output is alone on stdout
**ID:** json-only-on-stdout
- **WHEN** a command is invoked with `--json` and succeeds
- **THEN** stdout parses as JSON
- **AND** stderr is empty

#### Scenario: Failure guidance travels with the error
**ID:** failure-footer-on-stderr
- **WHEN** validation reports an invalid item in human-readable output
- **THEN** the summary and its `Next steps:` footer are written to stderr
  alongside the error, not to stdout

### Requirement: One status vocabulary across every surface
**ID:** status-vocabulary
The CLI SHALL use one vocabulary for status across all commands: `✓` for
complete, `○` for not started, and for delta operations `+` added, `~` modified,
`-` removed, `→` renamed. Color SHALL carry one consistent meaning: green for
complete, yellow for active or ready, red for blocked or failed, cyan for
specifications, dim for supplementary text. A command SHALL NOT introduce a
second symbol or a second color for a state that already has one.

That a command reports delta counts at all, and that color can be disabled
(`--no-color`, `NO_COLOR`), are command invariants owned by `behavior/cli`; this
requirement governs only what the symbols and colors mean.

#### Scenario: Change state symbols
**ID:** change-state-symbols
- **WHEN** the dashboard lists changes
- **THEN** a completed change is marked `✓`
- **AND** a change with no work started is marked `○`

#### Scenario: Delta operation symbols
**ID:** delta-operation-symbols
- **WHEN** a command reports delta counts against a spec
- **THEN** it uses `+` for added, `~` for modified, `-` for removed, and `→` for
  renamed

#### Scenario: Colors carry one meaning
**ID:** status-colors
- **WHEN** a command colors its output
- **THEN** green means complete, yellow means active or ready, red means blocked
  or failed, cyan marks specifications, and dim marks supplementary text

#### Scenario: Progress is drawn with one pair of blocks
**ID:** progress-bar-glyphs
- **WHEN** a command draws a progress bar
- **THEN** the completed portion uses filled blocks and the remaining portion
  uses light blocks, the same pair everywhere a bar appears

#### Scenario: No competing vocabulary
**ID:** no-competing-symbols
- **WHEN** a new command reports a state that already has a symbol or a color
- **THEN** it reuses the existing one rather than inventing another

### Requirement: Every terminal outcome ends with what to do next
**ID:** actionable-next-steps
A command that completes SHALL end with a summary of what changed and, where the
user's next move is not obvious, the next step. An invalid result in
human-readable output SHALL end with a `Next steps:` footer carrying targeted
guidance and a command to run.

#### Scenario: Setup success summarizes and points forward
**ID:** success-summary-and-next-steps
- **WHEN** initialization completes
- **THEN** the output gives a categorized summary of the tools created,
  refreshed, and skipped
- **AND** it lists the next steps to take
- **AND** it states the restart needed for the new commands to take effect

#### Scenario: Update names what changed
**ID:** update-names-what-changed
- **WHEN** the update command completes
- **THEN** the success message names each tool it updated
- **AND** it states the version now installed

#### Scenario: Invalid result ends with a next-steps footer
**ID:** invalid-result-next-steps-footer
- **WHEN** validation reports an item as invalid without `--json`
- **THEN** the output states that the item has issues
- **AND** it ends with a `Next steps:` footer naming a command to run
