---
id: ops.planning-layout
---

## Purpose
The repository keeps current planning in one predictable root while retired OpenSpec content remains historical and inert.

## MODIFIED Requirements

### Requirement: `specbase/` is the planning root
**ID:** specbase-is-planning-root
This repository SHALL keep its planning store — `config.yaml`, `specs/`,
`changes/`, `ideas/`, and `stacks/` — under the `specbase/` directory at the
repository root. The CLI SHALL resolve this store as the planning root, and no
legacy `openspec/` directory at the repository root SHALL shadow or duplicate
it. The `ideas/` directory is the home for ungoverned idea scratchpads and the
`stacks/` directory is the home for ungoverned linear delivery context; both
are excluded from ordinary governed enumeration, and their placement alongside
`specs/` and `changes/` is part of the planning root layout.

#### Scenario: The governed store lives under specbase
**ID:** store-under-specbase
- **WHEN** the planning store is inspected at the repository root
- **THEN** `specbase/config.yaml`, `specbase/specs/`, `specbase/changes/`,
  `specbase/ideas/`, and `specbase/stacks/` exist
- **AND** no root-level `openspec/` planning directory exists

#### Scenario: CLI commands operate on the specbase store
**ID:** cli-operates-on-specbase
- **WHEN** a CLI command resolves the planning root
- **THEN** it reads and writes the `specbase/` store, and changes created by the
  CLI land under `specbase/changes/`

#### Scenario: The ideas home is part of the planning root
**ID:** ideas-home-in-planning-root
- **WHEN** `specbase init` initializes a planning store
- **THEN** an `ideas/` directory is created under `specbase/` alongside `specs/`
  and `changes/`

#### Scenario: The stacks home is part of the planning root
**ID:** stacks-home-in-planning-root
- **WHEN** `specbase init` initializes a planning store
- **THEN** a `stacks/` directory is created under `specbase/` alongside `ideas/`,
  `specs/`, and `changes/`
