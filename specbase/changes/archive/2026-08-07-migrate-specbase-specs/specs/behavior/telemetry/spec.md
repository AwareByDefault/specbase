---
id: behavior.telemetry
---

## ADDED Requirements

### Requirement: Every CLI command reports its name to telemetry
**ID:** command-executed-tracking
The system SHALL send a `command_executed` event when any CLI command executes,
carrying only the command name and the tool version as properties. A nested
command SHALL report its full command path (for example `change:apply`).

#### Scenario: Standard command execution
**ID:** standard-command-executed
- **WHEN** a user runs any openspec command
- **THEN** a `command_executed` event is sent with the command name and version

#### Scenario: Subcommand execution
**ID:** subcommand-executed
- **WHEN** a user runs a nested command like `openspec change apply`
- **THEN** the event carries the full command path, e.g. `change:apply`

### Requirement: Telemetry events carry no identifying detail
**ID:** privacy-preserving-events
The system SHALL NOT include command arguments, file paths, project names, spec
content, error messages, or IP addresses in telemetry events.

#### Scenario: Command with arguments
**ID:** args-excluded
- **WHEN** a user runs `openspec init my-project --force`
- **THEN** the event contains only the command name and version, without arguments

#### Scenario: IP address exclusion
**ID:** ip-excluded
- **WHEN** the system sends a telemetry event
- **THEN** the event explicitly sets `$ip: null` to prevent IP tracking

### Requirement: Telemetry respects opt-out environment variables
**ID:** env-opt-out
The system SHALL send no telemetry events when `OPENSPEC_TELEMETRY=0` or
`DO_NOT_TRACK=1` is set. An opt-out env var SHALL win over any config state.

#### Scenario: OPENSPEC_TELEMETRY opt-out
**ID:** openspec-telemetry-off
- **WHEN** `OPENSPEC_TELEMETRY=0` is set in the environment
- **THEN** no telemetry events are sent

#### Scenario: DO_NOT_TRACK opt-out
**ID:** do-not-track
- **WHEN** `DO_NOT_TRACK=1` is set in the environment
- **THEN** no telemetry events are sent

#### Scenario: Environment variable takes precedence over config
**ID:** env-overrides-config
- **WHEN** the user has previously used the CLI (config exists)
- **AND** the user sets `OPENSPEC_TELEMETRY=0`
- **THEN** telemetry is disabled regardless of config state

### Requirement: CI environments are telemetry-free by default
**ID:** ci-auto-disable
The system SHALL send no telemetry events when `CI=true` is set, and CI
SHALL take precedence even when telemetry is explicitly enabled.

#### Scenario: CI environment detection
**ID:** ci-detected
- **WHEN** `CI=true` is set in the environment
- **THEN** no telemetry events are sent

#### Scenario: CI with explicit enable
**ID:** ci-wins-over-enable
- **WHEN** `CI=true` is set
- **AND** `OPENSPEC_TELEMETRY=1` is explicitly set
- **THEN** telemetry remains disabled (CI takes precedence for privacy)

### Requirement: First run discloses telemetry once, before any event
**ID:** first-run-notice
The system SHALL display a one-line telemetry disclosure notice on the first
command execution, before any telemetry event is sent, and SHALL NOT display it
again once seen.

#### Scenario: First command execution
**ID:** notice-on-first-run
- **WHEN** a user runs their first openspec command
- **AND** telemetry is enabled
- **THEN** the system displays a one-line notice stating anonymous usage stats are
  collected and how to opt out (`OPENSPEC_TELEMETRY=0`)

#### Scenario: Notice shown before any telemetry
**ID:** notice-before-telemetry
- **WHEN** the first-run notice is displayed
- **THEN** it appears before any telemetry event is sent

#### Scenario: Subsequent runs stay quiet
**ID:** notice-once
- **WHEN** the user has already seen the notice (recorded in config)
- **THEN** the notice is not displayed again

### Requirement: An anonymous identity is generated lazily and reused
**ID:** anonymous-identity
The system SHALL generate a random UUID as an anonymous identifier on first
telemetry send, persist it in global config, and reuse the same identifier
across sessions. No identifier SHALL be generated or stored when telemetry is
opted out before any event.

#### Scenario: First telemetry event
**ID:** id-generated-on-first-send
- **WHEN** the first telemetry event is sent
- **AND** no `anonymousId` exists in config
- **THEN** the system generates a random UUID and stores it in config

#### Scenario: Persistent identity across sessions
**ID:** id-reused
- **WHEN** a user runs multiple commands across sessions
- **THEN** the same `anonymousId` is used for all events

#### Scenario: Lazy generation with opt-out
**ID:** id-not-generated-when-opted-out
- **WHEN** a user opts out before running any command
- **THEN** no `anonymousId` is ever generated or stored

### Requirement: Telemetry sends immediately, without batching
**ID:** immediate-send
The system SHALL send telemetry events immediately rather than queuing them for
batch transmission.

#### Scenario: Event transmission timing
**ID:** sent-not-queued
- **WHEN** a command executes
- **THEN** the telemetry event is sent immediately, not queued for later batch transmission

### Requirement: Pending telemetry flushes before exit
**ID:** graceful-shutdown
The system SHALL flush pending telemetry before the CLI exits, on both success
and failure paths.

#### Scenario: Normal exit
**ID:** flush-on-success
- **WHEN** a command completes successfully
- **THEN** pending telemetry is flushed before the CLI exits

#### Scenario: Error exit
**ID:** flush-on-error
- **WHEN** a command fails with an error
- **THEN** pending telemetry is still flushed before the CLI exits

### Requirement: Telemetry failure never affects the CLI
**ID:** silent-failure
The system SHALL silently ignore telemetry failures — network errors, backend
outage, or shutdown failure — so the CLI command completes normally.

#### Scenario: Network failure
**ID:** network-failure-ignored
- **WHEN** the telemetry request fails due to a network error
- **THEN** the CLI command completes normally without an error message

#### Scenario: Backend outage
**ID:** backend-outage-ignored
- **WHEN** the telemetry backend is unavailable
- **THEN** the CLI command completes normally without an error message

#### Scenario: Shutdown failure
**ID:** shutdown-failure-ignored
- **WHEN** flushing pending telemetry fails or times out
- **THEN** the CLI exits normally without an error message
