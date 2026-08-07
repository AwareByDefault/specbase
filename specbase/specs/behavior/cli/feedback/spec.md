---
id: behavior.cli.feedback
---

### Requirement: The feedback command files an issue against the project's tracker
**ID:** feedback-command
The `feedback` command SHALL take the user's message as its argument and file an
issue on the project's public issue tracker, titling the issue from that message
with a `Feedback:` prefix and labelling it `feedback`. An optional body argument
SHALL become the issue's description. On success the command SHALL print the URL
of the issue it created.

#### Scenario: A one-line message becomes an issue
**ID:** feedback-submitted
- **WHEN** a user runs `feedback` with a message
- **THEN** an issue is filed whose title is that message prefixed with `Feedback:`
- **AND** the issue carries the `feedback` label
- **AND** the URL of the created issue is printed

#### Scenario: A detailed body is carried through
**ID:** feedback-with-body
- **WHEN** a user runs `feedback` with a message and a body
- **THEN** the body becomes the issue's description

### Requirement: User text is never interpreted as a command
**ID:** literal-user-input
The CLI SHALL pass the user's title and body to the issue-filing tool as discrete
arguments and SHALL NOT interpolate them into a shell command line. Quotes,
backticks, and substitution syntax in the user's text SHALL reach the issue as
literal characters.

#### Scenario: Shell metacharacters stay literal
**ID:** metacharacters-literal
- **WHEN** a user's message or body contains quotes, backticks, or command
  substitution syntax
- **THEN** the characters are filed as literal text
- **AND** nothing in the user's text is executed

### Requirement: Feedback falls back to manual submission when it cannot file automatically
**ID:** manual-fallback
When the tool that files issues is unavailable or not authorized, the command
SHALL NOT fail. It SHALL warn that manual submission is needed, print the
composed issue between explicit start and end delimiters — title, labels, and
body with its metadata — print a pre-filled issue URL the user can open, say how
to enable automatic submission next time, and succeed.

#### Scenario: No issue-filing tool available
**ID:** fallback-when-tool-missing
- **WHEN** a user runs `feedback` and no issue-filing tool is available
- **THEN** the command warns that manual submission is required
- **AND** prints the composed title, labels, and body between explicit delimiters
- **AND** prints a pre-filled issue URL
- **AND** succeeds

#### Scenario: The issue-filing tool is not authorized
**ID:** fallback-when-unauthorized
- **WHEN** a user runs `feedback` and the issue-filing tool is present but not
  authorized
- **THEN** the command falls back to the same manual submission output
- **AND** states how to authorize the tool so future submissions are automatic
- **AND** succeeds

### Requirement: Feedback carries diagnostic context but nothing identifying
**ID:** issue-metadata
Every filed issue SHALL carry the tool version, the operating-system platform, the
submission timestamp, and a trailer naming the CLI as the sender. The issue SHALL
NOT carry file paths from the user's machine, project or directory names,
environment variables, or IP addresses.

#### Scenario: Diagnostic metadata is attached
**ID:** metadata-included
- **WHEN** an issue is filed from feedback
- **THEN** its body carries the tool version, the platform, and the timestamp
- **AND** a trailer states the issue was submitted from the CLI

#### Scenario: Nothing identifying is attached
**ID:** no-sensitive-metadata
- **WHEN** an issue is filed from feedback
- **THEN** its body carries no file path from the user's machine, no project or
  directory name, no environment variable, and no IP address

### Requirement: Feedback works whatever the usage-reporting settings are
**ID:** feedback-independent-of-telemetry
The `feedback` command SHALL work identically whether usage reporting is enabled,
opted out, or suppressed by the environment. Opting out of usage reporting SHALL
NOT suppress, degrade, or block a feedback submission.

#### Scenario: Feedback still works with usage reporting off
**ID:** works-with-reporting-off
- **WHEN** a user who has opted out of usage reporting runs `feedback`
- **THEN** the feedback is submitted normally
- **AND** no usage-reporting event is sent

#### Scenario: Feedback still works in an automated environment
**ID:** works-in-ci
- **WHEN** `feedback` runs in an environment where usage reporting is suppressed
  automatically
- **THEN** the submission proceeds normally

### Requirement: An agent workflow drafts feedback and requires the user's approval
**ID:** feedback-skill
The CLI SHALL ship a feedback workflow that an AI tool can run: it SHALL gather
context from the conversation, draft a titled issue enriched with what the user
was doing and what went well or badly, replace paths, secrets, organization
names, personal names, and private URLs with placeholders, present the complete
draft, and submit through the `feedback` command only after the user approves.

#### Scenario: The draft is enriched and anonymized
**ID:** agent-drafts-and-anonymizes
- **WHEN** a user asks an AI tool to send feedback
- **THEN** the draft states what the user was doing and what worked or failed
- **AND** file paths, secrets, organization names, personal names, and private
  URLs are replaced with placeholders

#### Scenario: Nothing is submitted without approval
**ID:** approval-required
- **WHEN** the draft is ready
- **THEN** the complete draft is shown to the user
- **AND** the user can request changes
- **AND** submission happens only after the user explicitly approves
