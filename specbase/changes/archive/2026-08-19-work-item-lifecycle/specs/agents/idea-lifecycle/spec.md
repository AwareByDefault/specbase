---
id: agents.idea-lifecycle
---

## ADDED Requirements

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