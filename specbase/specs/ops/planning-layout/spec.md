---
id: ops.planning-layout
---

### Requirement: `specbase/` is the planning root
**ID:** specbase-is-planning-root
This repository SHALL keep its planning store — `config.yaml`, `specs/`, and
`changes/` — under the `specbase/` directory at the repository root. The CLI
SHALL resolve this store as the planning root, and no legacy `openspec/`
directory at the repository root SHALL shadow or duplicate it.

#### Scenario: The governed store lives under specbase
**ID:** store-under-specbase
- **WHEN** the planning store is inspected at the repository root
- **THEN** `specbase/config.yaml`, `specbase/specs/`, and `specbase/changes/` exist
- **AND** no root-level `openspec/` planning directory exists

#### Scenario: CLI commands operate on the specbase store
**ID:** cli-operates-on-specbase
- **WHEN** a CLI command resolves the planning root
- **THEN** it reads and writes the `specbase/` store, and changes created by the
  CLI land under `specbase/changes/`

### Requirement: `openspec-old/` is retired history, not spec truth
**ID:** openspec-old-inert
The `openspec-old/` directory SHALL be treated as dated historical archive: it
MAY be read for history and rationale, but it MUST NOT be consulted as a source
of current spec requirements, and no CLI command SHALL resolve it as a planning
root.

#### Scenario: Legacy content is not discovered
**ID:** legacy-not-discovered
- **WHEN** CLI discovery runs (`list`, `status`, `coverage`, `validate`)
- **THEN** no spec, change, or config under `openspec-old/` appears in the results

#### Scenario: Current truth lives in specbase
**ID:** specbase-is-authoritative
- **WHEN** a requirement is changed or removed
- **THEN** the change is recorded in the `specbase/` store, and the historical
  copy in `openspec-old/` is not updated
