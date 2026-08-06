---
id: behavior.session-loop
---

<!--
  Behavioral truth: a user- or client-visible capability that must remain true
  now. Lives at specs/behavior/<locator>/spec.md and is paired with an
  enforcement.md in the same directory.
-->

## ADDED Requirements

### Requirement: Sessions resume after a crash
**ID:** `session-resume`
The application SHALL restore an interrupted session from durable state so no
committed user action is lost.

#### Scenario: Resume after unexpected exit
**ID:** `resume-after-crash`
- **WHEN** the process exits unexpectedly and is restarted
- **THEN** the last committed session state is restored
- **AND** uncommitted in-flight input is discarded

#### Scenario: Corrupt state is reported, not applied
**ID:** `corrupt-state-rejected`
- **WHEN** durable session state fails its integrity check on load
- **THEN** the application starts a fresh session
- **AND** reports the discarded state to the user
