---
id: behavior.workflow.idea-graduation
---

### Requirement: Proposing from an idea moves it into the change namespace
**ID:** propose-moves-idea
When a change is proposed with an idea in context (an idea id supplied to the
propose workflow or the `new change` command), the system SHALL move the idea's
directory from `specbase/ideas/<id>/` to `specbase/changes/<id>/` and SHALL
scaffold the change artifacts (`proposal.md`, `tasks.md`, `design.md`, and the
`specs/` delta tree) inside the moved directory. The idea's stable `id` SHALL
be carried forward unchanged into the change's `.openspec.yaml`. The move IS
the graduation; no separate `graduate` command SHALL exist and no
`graduates_to` or `from-idea` link field SHALL be written.

#### Scenario: An idea becomes a change by moving
**ID:** idea-moved-to-change
- **WHEN** a user proposes a change from idea `dark-mode-x7k29f3a`
- **THEN** the directory `specbase/ideas/dark-mode-x7k29f3a/` no longer exists
- **AND** `specbase/changes/dark-mode-x7k29f3a/` exists with `proposal.md`,
  `tasks.md`, `design.md`, and a `specs/` tree
- **AND** the change's `.openspec.yaml` carries `id: dark-mode-x7k29f3a`

#### Scenario: The scratchpad is preserved as reference material
**ID:** scratchpad-preserved
- **WHEN** an idea with a `notes.md` and a `sketch.png` is proposed into a change
- **THEN** both `notes.md` and `sketch.png` exist inside the moved
  `specbase/changes/<id>/` directory alongside the scaffolded change artifacts

#### Scenario: No graduation command exists
**ID:** no-graduate-command
- **WHEN** the `specbase` CLI command surface is inspected
- **THEN** no `ideas graduate` or equivalent graduation verb is present
- **AND** the `ideas` command exposes only the capture verbs (`add`, `list`, `show`, `delete`)

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
