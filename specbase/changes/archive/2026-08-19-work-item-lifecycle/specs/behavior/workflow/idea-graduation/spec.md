---
id: behavior.workflow.idea-graduation
---

## ADDED Requirements

### Requirement: An archived change carries the idea's thinking with it
**ID:** idea-thinking-archives
When a change that grew from an idea is archived — where by-move graduation moved
the idea's directory into the change, or the change's metadata carries the idea's
`id` — the system SHALL preserve the idea's accumulated thinking, including its
`notes.md` and any carried scratchpad, inside the archived change at
`changes/archive/<date>-<id>/`. Archiving an idea-grown change SHALL NOT discard
the idea's preserved reasoning; the thinking travels with the closed work item.

#### Scenario: An idea's archive carries its notes
**ID:** idea-notes-archive-carry
- **WHEN** a change that came from an idea is archived
- **THEN** `changes/archive/<date>-<id>/` holds both the change artifacts and the
  idea's preserved `notes.md`, with nothing silently dropped

#### Scenario: An unproposed idea stays in the backlog
**ID:** loose-idea-unproposed
- **WHEN** an idea exists in `specbase/ideas/<id>/` but was never proposed into a
  change
- **THEN** it is not archived because no change closed; it remains a developing
  thought record in the ideas backlog, unchanged by this behavior