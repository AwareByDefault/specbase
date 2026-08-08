---
id: architecture.ideas
---

## ADDED Requirements

### Requirement: An object's id is immutable across store moves
**ID:** stable-id-across-moves
Every idea and change SHALL carry an `id` field in its `.openspec.yaml` that is
immutable across the directory moves of its lifecycle: from `specbase/ideas/`
to `specbase/changes/` on propose, and from `specbase/changes/` to
`specbase/changes/archive/<date>-<id>/` on archive. The id SHALL NOT be derived
from the directory name; the directory name is mutable presentation and the
archive move SHALL prepend a date prefix that is not part of the id. The id of
an archived change SHALL equal the id the object carried before archiving.

#### Scenario: The id survives the archive date prefix
**ID:** id-survives-date-prefix
- **WHEN** a change with `id: dark-mode-x7k29f3a` is archived to
  `changes/archive/2026-08-08-dark-mode-x7k29f3a/`
- **THEN** the archived `.openspec.yaml` still carries `id: dark-mode-x7k29f3a`

#### Scenario: The id survives the idea-to-change move
**ID:** id-survives-propose-move
- **WHEN** an idea with `id: dark-mode-x7k29f3a` is proposed into a change
- **THEN** the change's `.openspec.yaml` carries the identical `id`

### Requirement: The ideas store is outside governed enumeration
**ID:** ideas-outside-governed-enumeration
The `specbase/ideas/` directory SHALL be excluded from the governed enumeration
and validation surfaces. The store resolver SHALL treat `ideas/` as an
ungoverned region: `validate`, `coverage`, `list --specs`, and the artifact
graph SHALL scan `specs/` and `changes/` only. No idea path SHALL appear in
the output of those surfaces.

#### Scenario: The resolver skips ideas during coverage
**ID:** resolver-skips-ideas-coverage
- **WHEN** `specbase coverage` runs over a store that contains an idea
- **THEN** the report contains no path under `specbase/ideas/`

#### Scenario: The resolver skips ideas during validation
**ID:** resolver-skips-ideas-validate
- **WHEN** `specbase validate` runs over a store that contains an idea
- **THEN** no path under `specbase/ideas/` appears in the results
