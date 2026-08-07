---
id: design-system.cli-voice
---

## ADDED Requirements

### Requirement: CLI copy is calm and never blames the user
**ID:** calm-cli-voice
User-facing CLI copy SHALL be terse and calm. Error output SHALL be written to
stderr, prefixed with `Error: `, MUST NOT blame the user, and MUST NOT use
exclamation marks. The no-exclamation part is a deterministic lint; the "terse
and never blames the user" part is a voice judgment the `design` review lens
makes.

#### Scenario: Error copy shouts with an exclamation mark
**ID:** shouting-error
- **WHEN** a user-facing error string in `src/**` contains an exclamation mark
- **THEN** design enforcement reports it before merge

#### Scenario: Error copy blames the user
**ID:** blaming-error
- **WHEN** an error message assigns fault to the user rather than describing what
  went wrong and how to proceed
- **THEN** the `design` review lens flags it against this voice rule
