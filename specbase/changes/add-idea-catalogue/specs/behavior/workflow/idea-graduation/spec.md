---
id: behavior.workflow.idea-graduation
---

## ADDED Requirements

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
