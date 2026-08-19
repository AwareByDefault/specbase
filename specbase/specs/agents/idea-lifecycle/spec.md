---
id: agents.idea-lifecycle
---

### Requirement: A save-idea skill persists an explore session to the idea's scratchpad
**ID:** save-idea-skill
The repo SHALL ship a `save-idea` skill (a `SKILL.md` under the skill set) that,
invoked during or at the close of an explore session on an idea, appends the
session's accumulated thinking to `specbase/ideas/<id>/notes.md` under a dated
`## Session <date>` heading. The skill SHALL append, never overwrite, so prior
sessions remain as resumption context, and MAY refine the idea's `summary` in
`.openspec.yaml` when the session sharpened the one-line intent. The skill
SHALL NOT write `spec.md`, `enforcement.md`, or any governed artifact.

#### Scenario: A session is appended to notes
**ID:** session-appended-to-notes
- **WHEN** the save-idea skill runs at the close of an explore session on idea
  `dark-mode-x7k29f3a`
- **THEN** `specbase/ideas/dark-mode-x7k29f3a/notes.md` gains a new
  `## Session <date>` section holding the session's thinking
- **AND** any prior `## Session` sections are preserved unchanged

#### Scenario: The summary may be refined
**ID:** summary-refined
- **WHEN** the session produced a sharper one-line intent for the idea
- **THEN** the skill MAY update `summary` in the idea's `.openspec.yaml`
- **AND** the skill SHALL NOT change the idea's `id` or `created`

#### Scenario: No governed artifacts are written
**ID:** save-idea-writes-no-governed-artifacts
- **WHEN** the save-idea skill runs
- **THEN** no `spec.md` or `enforcement.md` is created under `specbase/ideas/`
  or anywhere else

### Requirement: The explore skill treats an idea as its input unit
**ID:** explore-reads-idea
The explore skill SHALL accept an idea id as its input and SHALL read
`specbase/ideas/<id>/notes.md` (including any prior `## Session` sections) to
resume context before exploring, so an idea explored and saved in one session
is continued, not restarted, in a later session. The explore skill's guidance
SHALL name the idea-as-input-unit contract alongside its existing change-as-
input contract.

#### Scenario: Explore resumes from saved sessions
**ID:** explore-resumes-saved
- **WHEN** an explore session begins on an idea whose `notes.md` carries prior
  `## Session` sections
- **THEN** the explore skill reads those sections as prior context before
  producing new thinking

#### Scenario: Explore may end in propose
**ID:** explore-ends-in-propose
- **WHEN** an explore session on an idea reaches a proposal-ready state
- **THEN** the explore skill MAY hand off to the propose workflow, which moves
  the idea into `changes/` per `behavior.workflow.idea-graduation`

### Requirement: The idea workflow treats an idea as a loosely-coupled thought record
**ID:** idea-elevation-instrument
The repo SHALL make its `save-idea` and `explore` workflow instruments treat an
idea as a loosely-coupled developing-thought record in the ideas backlog — a
record the agent may resume by passing the idea's directory, not a mandatory
linked artifact of any change. The instruments SHALL keep an idea's accumulated
thinking intact through elevation into a proposal and SHALL do nothing that
discards that thinking when the idea-graduation move or archive carries it.

#### Scenario: An agent resumes an idea by passing its directory
**ID:** explorer-carry-idea-dir
- **WHEN** an explore session begins on an idea by passing `specbase/ideas/<id>/`
- **THEN** the idea's accumulated `notes.md` sessions are read as context, and the
  idea is treated as a thought record, not a fixed link to a change

#### Scenario: The instrument preserves thinking through an idea
**ID:** save-idea-preserves-through
- **WHEN** a `save-idea` skill runs and the idea later graduates into a change
- **THEN** the accumulated thinking is preserved in the carried `notes.md`, never
  overwritten or reduced to a stub
